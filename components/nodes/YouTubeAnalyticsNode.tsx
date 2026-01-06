
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { NodeContentProps } from '../../types';
import { CatalogItemType } from '../../types';
import { ActionButton } from '../ActionButton';
import { extractYouTubeMetadata } from '../../services/geminiService';

interface VideoEntry {
    id: string;
    thumbnailBase64: string | null;
    uploadDate: string; // ISO string
    title: string;
    description?: string;
    views?: number;
    likes?: number;
    isShort?: boolean; // New field
}

interface DailyStat {
    date: string; // YYYY-MM-DD
    subscribers: number;
    totalViews: number; // Aggregate
    shortsViews?: number; // New
    longViews?: number; // New
}

interface DailyNote {
    id: string;
    date: string; // YYYY-MM-DD or ISO
    content: string;
}

interface ChannelData {
    id: string;
    name: string;
    description?: string; // Added description
    videos: VideoEntry[];
    stats: DailyStat[];
    goal?: string;
    currentSubscribers?: number;
    isMonetized?: boolean;
}

interface AnalyticsData {
    authorName: string;
    channels: ChannelData[];
    activeChannelId: string | null;
    globalNotes: DailyNote[]; 
    aiAdvice: string;
    aiSuggestedGoal?: string;
    targetLanguage?: string;
    contextPrompt?: string; // New field for user context
}

// Image Resizer Utility
const resizeThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error("Could not get canvas context"));
                return;
            }

            // Target dimensions
            const TARGET_WIDTH = 128;
            const TARGET_HEIGHT = 72;

            canvas.width = TARGET_WIDTH;
            canvas.height = TARGET_HEIGHT;

            // Calculate scaling to cover the target area (like object-fit: cover)
            const scale = Math.max(TARGET_WIDTH / img.width, TARGET_HEIGHT / img.height);
            const x = (TARGET_WIDTH / 2) - (img.width / 2) * scale;
            const y = (TARGET_HEIGHT / 2) - (img.height / 2) * scale;

            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            resolve(canvas.toDataURL('image/png').split(',')[1]); // Return base64 without header
        };
        img.onerror = reject;
    });
};

// Split image for Metadata extraction
const processYouTubeScreenshot = (file: File): Promise<{ thumbnail: string, metadataImage: string }> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const CUT_X = 136; // Approximate width of the thumbnail in the screenshot
            
            // Canvas 1: Thumbnail
            const cvsThumb = document.createElement('canvas');
            cvsThumb.width = CUT_X;
            cvsThumb.height = img.height;
            const ctxThumb = cvsThumb.getContext('2d');
            if (!ctxThumb) { reject("Canvas error"); return; }
            ctxThumb.drawImage(img, 0, 0, CUT_X, img.height, 0, 0, CUT_X, img.height);
            
            // Canvas 2: Metadata
            const cvsMeta = document.createElement('canvas');
            const metaWidth = img.width - CUT_X;
            cvsMeta.width = metaWidth;
            cvsMeta.height = img.height;
            const ctxMeta = cvsMeta.getContext('2d');
            if (!ctxMeta) { reject("Canvas error"); return; }
            ctxMeta.drawImage(img, CUT_X, 0, metaWidth, img.height, 0, 0, metaWidth, img.height);

            resolve({
                thumbnail: cvsThumb.toDataURL('image/png').split(',')[1],
                metadataImage: cvsMeta.toDataURL('image/png').split(',')[1]
            });
        };
        img.onerror = reject;
    });
};

// Simple SVG Line Chart
const StatsChart: React.FC<{ stats: DailyStat[], videos: VideoEntry[], showSubs: boolean, showViews: boolean, showVideos: boolean }> = ({ stats, videos, showSubs, showViews, showVideos }) => {
    if (!stats.length && !videos.length) return <div className="h-24 flex items-center justify-center text-gray-500 text-xs">No data for chart</div>;

    // 1. Unify Dates
    const allDates = new Set<string>();
    stats.forEach(s => allDates.add(s.date));
    videos.forEach(v => allDates.add(v.uploadDate.split('T')[0]));
    
    const sortedDates = Array.from(allDates).sort();
    if (sortedDates.length < 2) return <div className="h-24 flex items-center justify-center text-gray-500 text-xs">Not enough data points</div>;

    // 2. Prepare Data Series
    const chartData = sortedDates.map(date => {
        const stat = stats.find(s => s.date === date);
        const time = new Date(date).getTime();
        const videoCount = videos.filter(v => v.uploadDate.split('T')[0] <= date).length;
        
        return {
            date,
            time,
            subscribers: stat ? stat.subscribers : undefined,
            totalViews: stat ? stat.totalViews : undefined,
            videoCount
        };
    });

    // 3. Scales
    const minTime = chartData[0].time;
    const maxTime = chartData[chartData.length - 1].time;
    const timeRange = maxTime - minTime || 1;

    // Normalize values to 0-1 for drawing
    const getPoints = (key: 'subscribers' | 'totalViews' | 'videoCount') => {
        const validPoints = chartData.filter(d => d[key] !== undefined);
        if (validPoints.length === 0) return [];
        
        const values = validPoints.map(d => d[key] as number);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const range = maxVal - minVal || 1; // Avoid divide by zero

        return validPoints.map(d => ({
            x: ((d.time - minTime) / timeRange) * 100,
            y: 100 - (((d[key] as number) - minVal) / range) * 100, // Invert Y
            val: d[key],
            date: d.date
        }));
    };

    const subsPoints = showSubs ? getPoints('subscribers') : [];
    const viewsPoints = showViews ? getPoints('totalViews') : [];
    const videosPoints = showVideos ? getPoints('videoCount') : [];

    const renderLine = (points: any[], color: string) => {
        if (points.length < 2) return null;
        const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        return (
            <>
                <path d={pathD} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
                {points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="1.5" fill={color} stroke="none" vectorEffect="non-scaling-stroke">
                        <title>{`${p.date}: ${p.val}`}</title>
                    </circle>
                ))}
            </>
        );
    };

    return (
        <svg viewBox="0 0 100 100" className="w-full h-24 bg-gray-900/30 rounded border border-gray-700 overflow-visible" preserveAspectRatio="none">
            {renderLine(subsPoints, '#10b981')} {/* Emerald - Subs */}
            {renderLine(viewsPoints, '#06b6d4')} {/* Cyan - Views */}
            {renderLine(videosPoints, '#a855f7')} {/* Purple - Videos */}
        </svg>
    );
};

const AIAdviceSection: React.FC<{ advice: string, addToast: (msg: string, type: 'success' | 'info') => void }> = ({ advice, addToast }) => {
    if (!advice) return null;

    // Parse markdown-like headers (### Title)
    const sections = useMemo(() => {
        const parts = advice.split(/(?=###\s)/); // Split looking ahead for ###
        return parts.map(part => {
            const trimmed = part.trim();
            if (trimmed.startsWith('###')) {
                const [titleLine, ...contentLines] = trimmed.split('\n');
                return {
                    title: titleLine.replace(/^###\s*/, '').trim(),
                    content: contentLines.join('\n').trim(),
                    isHeader: true
                };
            }
            return {
                title: null,
                content: trimmed,
                isHeader: false
            };
        }).filter(p => p.content);
    }, [advice]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        addToast('Copied to clipboard', 'success');
    };

    // Helper to render markdown bold
    const renderContent = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="text-emerald-300 font-semibold">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    return (
        <div className="space-y-2 mt-2">
            {sections.map((section, idx) => (
                <div key={idx} className={`bg-gray-800/80 border border-gray-700 rounded-md overflow-hidden ${section.isHeader ? 'mb-2' : 'mb-1'}`}>
                    {section.title && (
                        <div className="flex justify-between items-center bg-gray-900/60 px-2 py-1.5 border-b border-gray-700/50">
                            <h4 className="text-sm font-bold text-emerald-400">{section.title}</h4>
                            <ActionButton title="Copy Section" onClick={() => handleCopy(`${section.title}\n${section.content}`)}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            </ActionButton>
                        </div>
                    )}
                    <div className="p-2 text-xs text-gray-300 whitespace-pre-wrap select-text leading-relaxed">
                        {renderContent(section.content)}
                    </div>
                </div>
            ))}
        </div>
    );
};


const YouTubeAnalyticsNode: React.FC<NodeContentProps> = ({
    node,
    onValueChange,
    t,
    deselectAllNodes,
    onAnalyzeYouTubeStats,
    isAnalyzingYouTubeStats,
    isStopping,
    onStopGeneration,
    addToast,
    saveDataToCatalog,
    getUpstreamTextValue,
    connections
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [todaySubscribers, setTodaySubscribers] = useState<string>('');
    const [todayLongViews, setTodayLongViews] = useState<string>('');
    const [todayShortViews, setTodayShortViews] = useState<string>('');
    const [videoFilter, setVideoFilter] = useState<'all' | 'long' | 'shorts'>('all');
    const [isDescriptionCollapsed, setIsDescriptionCollapsed] = useState(false);
    
    // Incoming Data State
    const [incomingVideoData, setIncomingVideoData] = useState<{ title: string, description: string } | null>(null);
    
    // Chart Toggles
    const [showSubs, setShowSubs] = useState(true);
    const [showViews, setShowViews] = useState(false);
    const [showVideos, setShowVideos] = useState(true);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const parsedValue: AnalyticsData = useMemo(() => {
        try {
            const parsed = JSON.parse(node.value || '{}');
            const channels = Array.isArray(parsed.channels) ? parsed.channels : [{ id: 'default', name: 'Main Channel', videos: [], stats: [] }];
            
            return {
                authorName: parsed.authorName || '',
                channels: channels,
                activeChannelId: parsed.activeChannelId || 'default',
                globalNotes: Array.isArray(parsed.globalNotes) ? parsed.globalNotes : (Array.isArray(parsed.notes) ? parsed.notes : []),
                aiAdvice: parsed.aiAdvice || '',
                aiSuggestedGoal: parsed.aiSuggestedGoal || '',
                targetLanguage: parsed.targetLanguage || 'ru',
                contextPrompt: parsed.contextPrompt || ''
            };
        } catch {
            return {
                authorName: '',
                channels: [{ id: 'default', name: 'Main Channel', videos: [], stats: [] }],
                activeChannelId: 'default',
                globalNotes: [],
                aiAdvice: '',
                aiSuggestedGoal: '',
                targetLanguage: 'ru',
                contextPrompt: ''
            };
        }
    }, [node.value]);

    const { authorName, channels, activeChannelId, globalNotes, aiAdvice, aiSuggestedGoal, targetLanguage, contextPrompt } = parsedValue;
    const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0];

    const handleValueUpdate = (updates: Partial<AnalyticsData>) => {
        onValueChange(node.id, JSON.stringify({ ...parsedValue, ...updates }));
    };

    const updateChannel = (channelId: string, updates: Partial<ChannelData>) => {
        const newChannels = channels.map(ch => ch.id === channelId ? { ...ch, ...updates } : ch);
        handleValueUpdate({ channels: newChannels });
    };

    // Check for upstream connections and refresh data
    const refreshIncomingData = () => {
        if (!getUpstreamTextValue || !connections) return;
        const inputConnection = connections.find(c => c.toNodeId === node.id);
        if (inputConnection) {
            const dataStr = getUpstreamTextValue(inputConnection.fromNodeId, inputConnection.fromHandleId);
            try {
                const data = JSON.parse(dataStr);
                const title = data.title || (typeof data === 'string' ? data : '');
                const description = data.description || '';
                if (title) {
                    setIncomingVideoData({ title, description });
                    addToast(t('node.action.refreshData'), 'success');
                } else {
                    addToast(t('youtube_analytics.noIncomingData'), 'info');
                }
            } catch (e) {
                if (dataStr && dataStr.trim()) {
                    setIncomingVideoData({ title: dataStr, description: '' });
                    addToast(t('node.action.refreshData'), 'success');
                } else {
                    setIncomingVideoData(null);
                }
            }
        } else {
            setIncomingVideoData(null);
        }
    };

    useEffect(() => {
        refreshIncomingData();
    }, [connections]);

    const handleAddIncomingVideo = () => {
        if (!incomingVideoData || !activeChannel) return;
        const newVideo: VideoEntry = {
            id: `vid-${Date.now()}`,
            thumbnailBase64: null,
            uploadDate: new Date().toISOString(),
            title: incomingVideoData.title,
            description: incomingVideoData.description,
            views: 0,
            likes: 0,
            isShort: false
        };
        const updatedVideos = [newVideo, ...activeChannel.videos];
        updateChannel(activeChannel.id, { videos: updatedVideos });
        addToast(t('youtube_analytics.videoAdded'), 'success');
    };

    const handleAddChannel = () => {
        const newId = `channel-${Date.now()}`;
        const newChannel: ChannelData = { id: newId, name: `Channel ${channels.length + 1}`, videos: [], stats: [] };
        handleValueUpdate({ 
            channels: [...channels, newChannel],
            activeChannelId: newId
        });
    };

    const handleDeleteChannel = (e: React.MouseEvent, channelId: string) => {
        e.stopPropagation();
        if (channels.length <= 1) return;
        const newChannels = channels.filter(c => c.id !== channelId);
        handleValueUpdate({ 
            channels: newChannels,
            activeChannelId: activeChannelId === channelId ? newChannels[0].id : activeChannelId
        });
    };

    const handleAcceptSuggestion = () => {
        if (aiSuggestedGoal && activeChannel) {
             // We must create a full new channels array to ensure state update triggers correctly
            const newChannels = channels.map(ch => 
                ch.id === activeChannel.id ? { ...ch, goal: aiSuggestedGoal } : ch
            );
            
            // Single atomic update to node value
            onValueChange(node.id, JSON.stringify({ 
                ...parsedValue, 
                channels: newChannels,
                aiSuggestedGoal: '' 
            }));
            
            addToast("Goal updated based on AI suggestion", "success");
        }
    };

    // --- Video Logic ---

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        if (!activeChannel) return;

        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            processYouTubeScreenshot(file).then(async ({ thumbnail, metadataImage }) => {
                const newVideoId = `vid-${Date.now()}`;
                const newVideo: VideoEntry = {
                    id: newVideoId,
                    thumbnailBase64: thumbnail,
                    uploadDate: new Date().toISOString(),
                    title: "Processing...",
                    views: 0,
                    likes: 0,
                    isShort: false
                };
                
                const updatedVideos = [newVideo, ...activeChannel.videos];
                const newChannels = channels.map(ch => ch.id === activeChannel.id ? { ...ch, videos: updatedVideos } : ch);
                onValueChange(node.id, JSON.stringify({ ...parsedValue, channels: newChannels }));
                addToast(t('toast.videoPasted'), 'success');

                try {
                    const meta = await extractYouTubeMetadata(metadataImage);
                    updateVideoWithMeta(newVideoId, meta);
                } catch (err) {
                    console.error("Failed to extract metadata", err);
                    addToast("Failed to extract text from image", "info");
                }

            }).catch(err => {
                console.error("Failed to process screenshot", err);
                addToast("Failed to process image", 'info');
            });
        }
    };
    
    const channelsRef = useRef(channels);
    useEffect(() => { channelsRef.current = channels; }, [channels]);
    const activeChannelIdRef = useRef(activeChannelId);
    useEffect(() => { activeChannelIdRef.current = activeChannelId; }, [activeChannelId]);

    const updateVideoWithMeta = (videoId: string, meta: any) => {
        const currentChannels = channelsRef.current;
        const currentActiveId = activeChannelIdRef.current;
        
        const targetChannelIndex = currentChannels.findIndex(c => c.id === currentActiveId);
        if (targetChannelIndex === -1) return;
        
        const targetChannel = currentChannels[targetChannelIndex];
        const videoIndex = targetChannel.videos.findIndex(v => v.id === videoId);
        
        if (videoIndex === -1) return;
        
        const updatedVideos = [...targetChannel.videos];
        updatedVideos[videoIndex] = {
            ...updatedVideos[videoIndex],
            title: meta.title || "Untitled",
            description: meta.description || "",
            views: meta.views || 0
        };
        
        const updatedChannels = [...currentChannels];
        updatedChannels[targetChannelIndex] = { ...targetChannel, videos: updatedVideos };
        
        onValueChange(node.id, JSON.stringify({ ...parsedValue, channels: updatedChannels }));
        addToast("Title and description extracted!", "success");
    };

    const handleVideoItemDrop = (e: React.DragEvent<HTMLDivElement>, videoId: string) => {
        e.preventDefault();
        e.stopPropagation();
        
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            resizeThumbnail(file).then((base64String) => {
                updateVideo(videoId, { thumbnailBase64: base64String });
                addToast(t('youtube_analytics.thumbnailUpdated'), 'success');
            });
        }
    };

    const updateVideo = (videoId: string, updates: Partial<VideoEntry>) => {
        if (!activeChannel) return;
        const updatedVideos = activeChannel.videos.map(v => v.id === videoId ? { ...v, ...updates } : v);
        updateChannel(activeChannel.id, { videos: updatedVideos });
    };

    const deleteVideo = (videoId: string) => {
        if (!activeChannel) return;
        const updatedVideos = activeChannel.videos.filter(v => v.id !== videoId);
        updateChannel(activeChannel.id, { videos: updatedVideos });
    };

    const filteredVideos = useMemo(() => {
        if (!activeChannel) return [];
        if (videoFilter === 'all') return activeChannel.videos;
        const wantShorts = videoFilter === 'shorts';
        return activeChannel.videos.filter(v => !!v.isShort === wantShorts);
    }, [activeChannel, videoFilter]);

    // --- Stats Logic ---

    const handleAddDailyStat = () => {
        if (!activeChannel) return;
        
        const now = new Date();
        const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        
        const subs = parseInt(todaySubscribers) || 0;
        const longV = parseInt(todayLongViews) || 0;
        const shortV = parseInt(todayShortViews) || 0;
        const totalV = longV + shortV;

        if (subs === 0 && totalV === 0) return;

        const existingStatIndex = activeChannel.stats.findIndex(s => s.date === today);
        let newStats = [...activeChannel.stats];
        
        const newStatEntry = { 
            date: today, 
            subscribers: subs, 
            totalViews: totalV, 
            shortsViews: shortV,
            longViews: longV
        };

        if (existingStatIndex >= 0) {
            newStats[existingStatIndex] = newStatEntry;
        } else {
            newStats.push(newStatEntry);
            newStats.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        }

        updateChannel(activeChannel.id, { stats: newStats });
        setTodaySubscribers('');
        setTodayLongViews('');
        setTodayShortViews('');
        addToast(t('youtube_analytics.statsUpdated'), 'success');
    };

    const handleDeleteStat = (date: string) => {
        if (!activeChannel) return;
        const newStats = activeChannel.stats.filter(s => s.date !== date);
        updateChannel(activeChannel.id, { stats: newStats });
    };

    // --- Notes Logic (Global) ---

    const handleAddNote = () => {
        const now = new Date();
        const localDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        
        const newNote: DailyNote = {
            id: `note-${Date.now()}`,
            date: localDate,
            content: ''
        };
        handleValueUpdate({ globalNotes: [newNote, ...globalNotes] });
    };

    const handleUpdateNote = (noteId: string, content: string) => {
        const updatedNotes = globalNotes.map(n => n.id === noteId ? { ...n, content } : n);
        handleValueUpdate({ globalNotes: updatedNotes });
    };

    const handleDeleteNote = (noteId: string) => {
        const updatedNotes = globalNotes.filter(n => n.id !== noteId);
        handleValueUpdate({ globalNotes: updatedNotes });
    };

    // --- File Operations ---
    
    const handleSaveToDisk = () => {
        const dataWithMeta = { 
            type: 'youtube-analytics-data', 
            ...parsedValue 
        };
        
        const dataStr = JSON.stringify(dataWithMeta, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        
        const cleanAuthor = authorName.replace(/[^a-z0-9а-яё\s-_]/gi, '').trim() || 'Unknown';
        const cleanChannel = activeChannel.name.replace(/[^a-z0-9а-яё\s-_]/gi, '').trim() || 'Channel';
        const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
        
        a.href = url;
        a.download = `youtube_analytics_${cleanAuthor.replace(/\s+/g, '_')}_${cleanChannel.replace(/\s+/g, '_')}_${dateStr}.json`;
        a.click();
        URL.revokeObjectURL(url);
        addToast(t('youtube_analytics.savedToDisk'), 'success');
    };

    const handleSaveToCatalog = () => {
        if (saveDataToCatalog) {
            saveDataToCatalog(node.id, CatalogItemType.YOUTUBE, activeChannel.name || "YouTube Data");
        }
    };

    const handleLoadFromFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const json = JSON.parse(evt.target?.result as string);
                onValueChange(node.id, JSON.stringify(json));
                addToast(t('youtube_analytics.loadedFromDisk'), 'success');
            } catch (err) {
                addToast(t('youtube_analytics.loadFailed'), 'info');
            }
        };
        reader.readAsText(file);
        if(e.target) e.target.value = '';
    };

    // --- Summary Calculations ---

    const getSummary = (channel: ChannelData) => {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const videosWeek = channel.videos.filter(v => new Date(v.uploadDate) >= oneWeekAgo).length;
        const videosMonth = channel.videos.filter(v => new Date(v.uploadDate) >= oneMonthAgo).length;

        let growth = "0";
        if (channel.stats.length >= 2) {
            const latest = channel.stats[channel.stats.length - 1];
            const previous = channel.stats[channel.stats.length - 2];
            const diff = latest.subscribers - previous.subscribers;
            growth = diff > 0 ? `+${diff}` : `${diff}`;
        }

        return { videosWeek, videosMonth, growth };
    };

    const activeSummary = activeChannel ? getSummary(activeChannel) : { videosWeek: 0, videosMonth: 0, growth: "0" };

    const totalVideosWeek = channels.reduce((acc, ch) => acc + getSummary(ch).videosWeek, 0);
    const totalVideosMonth = channels.reduce((acc, ch) => acc + getSummary(ch).videosMonth, 0);

    const goalOptions = [
        "100 Subscribers", "1,000 Subscribers", "Monetization (4k hours / 1k subs)",
        "10,000 Subscribers", "Silver Play Button (100k)", "Gold Play Button (1M)",
        "High Retention", "Increase CTR", "Regular Upload Schedule"
    ];

    const currentDateTimeStr = useMemo(() => new Date().toLocaleString(), []);

    return (
        <div className="flex flex-row h-full bg-gray-800/50 rounded-lg overflow-hidden">
            {/* --- COLUMN 1: CHANNEL MGMT --- */}
            <div className="flex flex-col flex-1 h-full border-r border-gray-700 min-w-0">
                {/* AUTHOR NAME */}
                <div className="bg-gray-900 px-2 border-b border-gray-700 flex items-center space-x-2 flex-shrink-0 h-12">
                    <label className="text-xs text-gray-400 whitespace-nowrap font-semibold">{t('youtube_analytics.authorName')}:</label>
                    <input
                        type="text"
                        value={authorName}
                        onChange={(e) => handleValueUpdate({ authorName: e.target.value })}
                        className="bg-gray-800 text-sm rounded p-1 border border-transparent focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none flex-grow text-emerald-300 font-medium transition-all"
                        onFocus={deselectAllNodes}
                        placeholder={t('youtube_analytics.authorName')}
                    />
                </div>

                {/* TABS */}
                <div className="flex items-center bg-gray-900 p-1 gap-1 overflow-x-auto custom-scrollbar flex-shrink-0">
                    {channels.map(channel => (
                        <div 
                            key={channel.id}
                            onClick={() => handleValueUpdate({ activeChannelId: channel.id })}
                            className={`px-3 py-1.5 h-8 text-xs rounded-t-md cursor-pointer flex items-center gap-2 flex-shrink-0 transition-colors ${activeChannelId === channel.id ? 'bg-gray-800 text-emerald-400 font-bold' : 'bg-gray-900 hover:bg-gray-800 text-gray-400'}`}
                        >
                            {activeChannelId === channel.id ? (
                                <input 
                                    type="text" 
                                    value={channel.name} 
                                    onChange={(e) => updateChannel(channel.id, { name: e.target.value })}
                                    className="bg-transparent border-none focus:ring-0 p-0 text-emerald-400 font-bold w-24 text-xs focus:outline-none"
                                    onClick={e => e.stopPropagation()}
                                    onFocus={deselectAllNodes}
                                />
                            ) : (
                                <span>{channel.name}</span>
                            )}
                            {channels.length > 1 && (
                                <button onClick={(e) => handleDeleteChannel(e, channel.id)} className="text-gray-500 hover:text-red-400">
                                    &times;
                                </button>
                            )}
                        </div>
                    ))}
                    <button onClick={handleAddChannel} className="px-2 text-gray-400 hover:text-emerald-400 font-bold text-lg">+</button>
                </div>

                {/* CHANNEL DETAILS */}
                {activeChannel && (
                    <div className="p-2 bg-gray-900/50 border-b border-gray-700 grid grid-cols-2 gap-2">
                         <div className="col-span-2">
                             <div className="flex justify-between items-center mb-1">
                                 <label 
                                    className="text-[10px] text-gray-400 uppercase font-bold block cursor-pointer select-none hover:text-gray-300 transition-colors"
                                    onClick={() => setIsDescriptionCollapsed(!isDescriptionCollapsed)}
                                 >
                                    Description
                                 </label>
                                 <ActionButton 
                                    title={isDescriptionCollapsed ? "Expand" : "Collapse"} 
                                    onClick={(e) => { e.stopPropagation(); setIsDescriptionCollapsed(!isDescriptionCollapsed); }}
                                    tooltipPosition="left"
                                >
                                    {isDescriptionCollapsed ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                                    )}
                                </ActionButton>
                             </div>
                             {!isDescriptionCollapsed && (
                                <textarea 
                                    value={activeChannel.description || ''}
                                    onChange={(e) => updateChannel(activeChannel.id, { description: e.target.value })}
                                    className="w-full bg-gray-800 text-xs rounded p-1 border border-transparent focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-white transition-all resize-none h-[80px] custom-scrollbar"
                                    placeholder="Channel description..."
                                    onFocus={deselectAllNodes}
                                    onWheel={(e) => e.stopPropagation()}
                                />
                             )}
                         </div>
                        <div className="col-span-2">
                            <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Goal</label>
                            <div className="flex gap-1">
                                <input 
                                    list={`goal-options-${node.id}`}
                                    type="text" 
                                    value={activeChannel.goal || ''}
                                    onChange={(e) => updateChannel(activeChannel.id, { goal: e.target.value })}
                                    className="flex-grow bg-gray-800 text-xs rounded p-1 border border-transparent focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-white transition-all"
                                    placeholder="e.g. 1000 Subscribers"
                                    onFocus={deselectAllNodes}
                                />
                                <datalist id={`goal-options-${node.id}`}>
                                    {goalOptions.map(opt => <option key={opt} value={opt} />)}
                                </datalist>
                                {aiSuggestedGoal && activeChannel.goal !== aiSuggestedGoal && (
                                    <button 
                                        onClick={handleAcceptSuggestion} 
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2 rounded animate-pulse"
                                        title={`Accept Suggestion: ${aiSuggestedGoal}`}
                                    >
                                        Accept
                                    </button>
                                )}
                            </div>
                            {aiSuggestedGoal && activeChannel.goal !== aiSuggestedGoal && (
                                <div className="text-[10px] text-emerald-400 mt-1">
                                    Suggestion: {aiSuggestedGoal}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Current Subs</label>
                            <input 
                                type="number" 
                                value={activeChannel.currentSubscribers || ''}
                                onChange={(e) => updateChannel(activeChannel.id, { currentSubscribers: parseInt(e.target.value) || 0 })}
                                className="w-full bg-gray-800 text-xs rounded p-1 border border-transparent focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-white transition-all"
                                placeholder="0"
                                onFocus={deselectAllNodes}
                            />
                        </div>
                        <div className="flex flex-col justify-end">
                            <label className="flex items-center space-x-2 cursor-pointer bg-gray-800 p-1 rounded border border-gray-700 h-[26px]">
                                <input 
                                    type="checkbox" 
                                    checked={activeChannel.isMonetized || false} 
                                    onChange={(e) => updateChannel(activeChannel.id, { isMonetized: e.target.checked })} 
                                    className="form-checkbox h-3.5 w-3.5 text-emerald-500 rounded border-gray-500 bg-gray-900 focus:ring-0"
                                />
                                <span className="text-[10px] text-gray-300 font-bold uppercase select-none">Monetization</span>
                            </label>
                        </div>
                    </div>
                )}

                {/* VIDEOS LIST AREA */}
                <div className="flex-grow flex flex-col p-2 min-h-0">
                    {/* FILTER BAR */}
                     <div className="flex space-x-1 mb-2">
                        {(['all', 'long', 'shorts'] as const).map(filter => (
                            <button
                                key={filter}
                                onClick={() => setVideoFilter(filter)}
                                className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${videoFilter === filter ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-400 hover:text-white'}`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>

                    {/* INCOMING DATA PANEL */}
                    {connections && connections.some(c => c.toNodeId === node.id) && (
                        <div className="bg-gray-900/80 border border-emerald-500/30 rounded-md p-2 mb-2 flex flex-col gap-2 shadow-lg flex-shrink-0">
                            <div className="flex justify-between items-center">
                                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">{t('youtube_analytics.incomingData')}</h4>
                                <button onClick={refreshIncomingData} className="text-gray-400 hover:text-white" title={t('node.action.refreshData')}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                </button>
                            </div>
                            {incomingVideoData ? (
                                <>
                                    <div className="text-sm text-white font-semibold truncate" title={incomingVideoData.title}>{incomingVideoData.title}</div>
                                    {incomingVideoData.description && <div className="text-xs text-gray-400 line-clamp-2">{incomingVideoData.description}</div>}
                                    <button onClick={handleAddIncomingVideo} className="w-full bg-emerald-700 hover:bg-emerald-600 text-white text-xs py-1 rounded font-bold transition-colors">
                                        {t('youtube_analytics.addToChannel')}
                                    </button>
                                </>
                            ) : (
                                <div className="text-xs text-gray-500 italic">{t('youtube_analytics.noIncomingData')}</div>
                            )}
                        </div>
                    )}

                    {/* DROP ZONE */}
                    <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`flex-shrink-0 h-16 border-2 border-dashed rounded-lg flex flex-col items-center justify-center mb-2 transition-colors ${isDragOver ? 'border-emerald-400 bg-emerald-900/20' : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'}`}
                    >
                        <p className="text-xs text-gray-400 pointer-events-none text-center px-2">{t('youtube_analytics.dragDrop')}</p>
                    </div>

                    {/* LIST */}
                    <div className="flex-grow overflow-y-auto custom-scrollbar space-y-2" onWheel={e => e.stopPropagation()}>
                        {filteredVideos.map((video) => (
                            <div 
                                key={video.id} 
                                className="flex gap-2 bg-gray-900/50 p-2 rounded-md group relative hover:bg-gray-800 transition-colors"
                                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                onDrop={(e) => handleVideoItemDrop(e, video.id)}
                            >
                                <div className="w-20 h-12 bg-black flex-shrink-0 rounded overflow-hidden relative group/thumb">
                                    {video.thumbnailBase64 ? (
                                        <img src={`data:image/png;base64,${video.thumbnailBase64}`} className="w-full h-full object-cover" alt="Thumb" />
                                    ) : <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-600 text-[9px]">No Image</div>}
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity pointer-events-none">
                                        <span className="text-[8px] text-white">Drop Image</span>
                                    </div>
                                    {video.isShort && (
                                         <div className="absolute bottom-0 right-0 bg-red-600 text-white text-[8px] px-1 font-bold">SHORTS</div>
                                    )}
                                </div>
                                <div className="flex-grow min-w-0 flex flex-col justify-between">
                                    <div className="flex justify-between items-start gap-1">
                                         <input 
                                            type="text" 
                                            value={video.title} 
                                            onChange={(e) => updateVideo(video.id, { title: e.target.value })}
                                            placeholder={t('youtube_analytics.videoTitle')}
                                            className="bg-transparent border border-transparent rounded p-0.5 -ml-1 text-sm text-white font-medium focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-gray-800 w-full transition-all outline-none"
                                            onFocus={deselectAllNodes}
                                        />
                                        <input 
                                            type="checkbox"
                                            checked={!!video.isShort}
                                            onChange={(e) => updateVideo(video.id, { isShort: e.target.checked })}
                                            className="form-checkbox h-3 w-3 text-red-500 rounded border-gray-600 bg-gray-800 flex-shrink-0 mt-1"
                                            title="Mark as Shorts"
                                        />
                                    </div>

                                    <textarea
                                        value={video.description || ''}
                                        onChange={(e) => updateVideo(video.id, { description: e.target.value })}
                                        placeholder="Description..."
                                        className="bg-transparent border border-transparent rounded p-0.5 -ml-1 text-xs text-gray-400 w-full resize-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-gray-800 focus:text-gray-300 transition-all outline-none"
                                        rows={1}
                                        onFocus={deselectAllNodes}
                                    />
                                    <div className="flex justify-between items-end mt-1">
                                        <span className="text-xs text-gray-500">{new Date(video.uploadDate).toLocaleString()}</span>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <input 
                                                type="number" 
                                                placeholder={t('youtube_analytics.views')}
                                                value={video.views || ''} 
                                                onChange={(e) => updateVideo(video.id, { views: parseInt(e.target.value) || 0 })}
                                                className="w-16 bg-gray-800 text-xs p-0.5 rounded text-right text-gray-300 border border-gray-700 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                                onFocus={deselectAllNodes}
                                            />
                                            <button onClick={() => deleteVideo(video.id)} className="text-gray-500 hover:text-red-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filteredVideos.length === 0 && <p className="text-center text-xs text-gray-500 mt-4">{t('youtube_analytics.noVideos')}</p>}
                    </div>
                </div>

                {/* FOOTER */}
                <div className="bg-gray-900 p-2 flex flex-col gap-2 border-t border-gray-700 flex-shrink-0 mt-auto">
                    {/* Merged Chart Section */}
                    <div className="bg-gray-800/50 p-2 rounded-md border border-gray-700/50">
                        <div className="flex items-center justify-between mb-1">
                             <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-gray-400">{t('youtube_analytics.statsTrend')}</h4>
                                <div className="text-[10px] text-gray-500 font-mono bg-gray-800 px-1 rounded">{currentDateTimeStr}</div>
                             </div>
                            <div className="flex gap-1">
                                <label className="flex items-center text-[10px] text-emerald-400 space-x-1 cursor-pointer">
                                    <input type="checkbox" checked={showSubs} onChange={e => setShowSubs(e.target.checked)} className="form-checkbox h-3 w-3 text-emerald-600 rounded focus:ring-0 border-gray-600 bg-gray-800" />
                                    <span>Subs</span>
                                </label>
                                <label className="flex items-center text-[10px] text-cyan-400 space-x-1 cursor-pointer">
                                    <input type="checkbox" checked={showViews} onChange={e => setShowViews(e.target.checked)} className="form-checkbox h-3 w-3 text-cyan-600 rounded focus:ring-0 border-gray-600 bg-gray-800" />
                                    <span>Views</span>
                                </label>
                                <label className="flex items-center text-[10px] text-purple-400 space-x-1 cursor-pointer">
                                    <input type="checkbox" checked={showVideos} onChange={e => setShowVideos(e.target.checked)} className="form-checkbox h-3 w-3 text-purple-600 rounded focus:ring-0 border-gray-600 bg-gray-800" />
                                    <span>Vids</span>
                                </label>
                            </div>
                        </div>
                        <StatsChart 
                            stats={activeChannel?.stats || []} 
                            videos={activeChannel?.videos || []} 
                            showSubs={showSubs} 
                            showViews={showViews} 
                            showVideos={showVideos}
                        />
                    </div>

                    {/* Stats Row */}
                    <div className="flex justify-between items-center text-xs text-gray-400 px-2">
                        <div className="flex gap-4">
                            <div>
                                <span className="block text-[10px] text-gray-500 uppercase">{t('youtube_analytics.currentChannel')}</span>
                                <span className="text-white font-bold">{activeSummary.videosWeek} videos/wk</span>
                            </div>
                            <div>
                                <span className="block text-[10px] text-gray-500 uppercase">{t('youtube_analytics.growth')}</span>
                                <span className={`${parseInt(activeSummary.growth) > 0 ? 'text-green-400' : 'text-gray-300'}`}>{activeSummary.growth} subs</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="block text-[10px] text-gray-500 uppercase">{t('youtube_analytics.allChannels')}</span>
                            <span className="text-emerald-400 font-bold">{totalVideosWeek} vids/wk  |  {totalVideosMonth} vids/mo</span>
                        </div>
                    </div>

                    {/* File Actions Row */}
                    <div className="flex gap-2 border-t border-gray-800 pt-2">
                        <button onClick={handleSaveToDisk} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold py-1 rounded transition-colors">
                            {t('youtube_analytics.saveDisk')}
                        </button>
                        <button onClick={handleSaveToCatalog} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold py-1 rounded transition-colors">
                            {t('youtube_analytics.saveCatalog')}
                        </button>
                        <label className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold py-1 rounded transition-colors text-center cursor-pointer">
                            {t('youtube_analytics.loadDisk')}
                            <input type="file" accept=".json" onChange={handleLoadFromFile} className="hidden" ref={fileInputRef} />
                        </label>
                    </div>
                </div>
            </div>

            {/* --- COLUMN 2: AI ADVICE (Full Height) --- */}
            <div className="flex flex-col flex-1 h-full border-r border-gray-700 min-w-0 bg-gray-900/20">
                {/* Header Controls */}
                <div className="flex flex-col bg-gray-900 px-2 pt-2 pb-2 border-b border-gray-700 gap-2">
                    {/* Context Area */}
                    <div className="w-full">
                         <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Context / Question</label>
                         <textarea
                            value={contextPrompt}
                            onChange={(e) => handleValueUpdate({ contextPrompt: e.target.value })}
                            className="w-full bg-gray-800 text-xs rounded p-2 border border-gray-700 focus:border-emerald-500 outline-none text-white resize-y custom-scrollbar"
                            placeholder="Add specific context or ask a question for the analysis..."
                            rows={2}
                            onFocus={deselectAllNodes}
                            onWheel={(e) => e.stopPropagation()}
                         />
                    </div>
                    {/* Language & Button */}
                    <div className="flex items-center h-8">
                        <div className="flex items-center space-x-1 mr-2 h-full">
                            <button onClick={() => handleValueUpdate({ targetLanguage: 'ru' })} className={`px-2 h-full rounded text-xs font-bold transition-colors ${targetLanguage === 'ru' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>RU</button>
                            <button onClick={() => handleValueUpdate({ targetLanguage: 'en' })} className={`px-2 h-full rounded text-xs font-bold transition-colors ${targetLanguage === 'en' ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>EN</button>
                        </div>
                        <button 
                            onClick={() => onAnalyzeYouTubeStats && onAnalyzeYouTubeStats(node.id)}
                            disabled={isAnalyzingYouTubeStats || isStopping}
                            className={`flex-grow h-full px-3 text-xs font-bold uppercase tracking-wider rounded transition-colors ${isAnalyzingYouTubeStats ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                        >
                            {isAnalyzingYouTubeStats ? t('youtube_analytics.analyzing') : t('youtube_analytics.askAI')}
                        </button>
                    </div>
                </div>
                
                {aiAdvice ? (
                    <div className="flex-grow overflow-y-auto custom-scrollbar p-2" onWheel={e => e.stopPropagation()}>
                        <AIAdviceSection advice={aiAdvice} addToast={addToast} />
                    </div>
                ) : (
                    <div className="flex-grow flex items-center justify-center text-xs text-gray-600 italic p-4 text-center">
                        {isAnalyzingYouTubeStats ? t('youtube_analytics.analyzing') : t('youtube_analytics.clickForAdvice')}
                    </div>
                )}
            </div>

            {/* --- COLUMN 3: TOOLS (Notes, Stats, History) --- */}
            <div className="w-80 flex flex-col p-2 border-l border-gray-700 bg-gray-900/20 flex-shrink-0 gap-2 overflow-hidden">
                
                {/* 1. Daily Notes */}
                <div className="flex flex-col bg-gray-900/30 rounded-md border border-gray-700/50 overflow-hidden h-1/3 flex-shrink-0">
                    <div className="flex justify-between items-center p-2 bg-gray-900/50 border-b border-gray-700/50">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('youtube_analytics.dailyNotes')}</h4>
                        <button onClick={handleAddNote} className="text-emerald-400 hover:text-emerald-300 bg-gray-800 rounded px-2 py-0.5 text-sm font-bold">
                            +
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto custom-scrollbar p-2 space-y-2" onWheel={e => e.stopPropagation()}>
                        {globalNotes.map((note) => (
                            <div key={note.id} className="bg-gray-800 rounded p-2 flex flex-col space-y-1 group">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-emerald-500 font-mono">{note.date}</span>
                                    <button onClick={() => handleDeleteNote(note.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        &times;
                                    </button>
                                </div>
                                <textarea
                                    value={note.content}
                                    onChange={(e) => handleUpdateNote(note.id, e.target.value)}
                                    className="w-full bg-transparent border border-transparent rounded text-xs text-gray-300 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 p-1 resize-y h-[90px] min-h-[90px] transition-colors outline-none"
                                    placeholder="Write a note..."
                                    rows={3}
                                    onFocus={deselectAllNodes}
                                />
                            </div>
                        ))}
                        {globalNotes.length === 0 && <p className="text-center text-[10px] text-gray-600 mt-4">{t('youtube_analytics.noNotes')}</p>}
                    </div>
                </div>

                {/* 2. Log Daily Stats */}
                <div className="bg-gray-900/50 p-2 rounded-md space-y-2 flex-shrink-0 border border-emerald-500/20">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase">{t('youtube_analytics.logDailyStats')}</h4>
                    <div>
                        <label className="text-[10px] text-gray-400 block">{t('youtube_analytics.subscribers')}</label>
                        <input 
                            type="number" 
                            value={todaySubscribers} 
                            onChange={e => setTodaySubscribers(e.target.value)}
                            className="w-full bg-gray-800 text-sm rounded p-1 border border-gray-700 focus:border-emerald-500 outline-none"
                            onFocus={deselectAllNodes}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] text-gray-400 block">Long Views</label>
                            <input 
                                type="number" 
                                value={todayLongViews} 
                                onChange={e => setTodayLongViews(e.target.value)}
                                className="w-full bg-gray-800 text-sm rounded p-1 border border-gray-700 focus:border-emerald-500 outline-none"
                                onFocus={deselectAllNodes}
                                placeholder="Video Views"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-gray-400 block">Shorts Views</label>
                            <input 
                                type="number" 
                                value={todayShortViews} 
                                onChange={e => setTodayShortViews(e.target.value)}
                                className="w-full bg-gray-800 text-sm rounded p-1 border border-gray-700 focus:border-emerald-500 outline-none"
                                onFocus={deselectAllNodes}
                                placeholder="Shorts Views"
                            />
                        </div>
                    </div>
                    <div className="text-[10px] text-right text-gray-500">
                        Monthly Views (Sum): {((parseInt(todayLongViews)||0) + (parseInt(todayShortViews)||0))}
                    </div>
                    <button onClick={handleAddDailyStat} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-1 rounded transition-colors">{t('youtube_analytics.updateStats')}</button>
                </div>

                {/* 3. History List */}
                <div className="bg-gray-900/30 p-2 rounded-md flex-grow overflow-y-auto custom-scrollbar border border-gray-700/50 min-h-0" onWheel={e => e.stopPropagation()}>
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 sticky top-0 bg-gray-900/90 py-1 z-10">{t('youtube_analytics.history')}</h4>
                    {activeChannel?.stats && activeChannel.stats.length > 0 ? (
                        <div className="space-y-1">
                            {[...activeChannel.stats].reverse().map((stat, idx) => (
                                <div key={stat.date} className="flex flex-col justify-between text-[10px] bg-gray-800/50 p-1.5 rounded hover:bg-gray-800 gap-1">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-300 font-mono font-bold">{stat.date}</span>
                                        <button onClick={() => handleDeleteStat(stat.date)} className="text-gray-500 hover:text-red-400 ml-1">
                                            &times;
                                        </button>
                                    </div>
                                    <div className="flex gap-2 text-gray-400">
                                        <span className="text-emerald-400">S: {stat.subscribers}</span>
                                        <span className="text-cyan-400" title="Total Views">V: {stat.totalViews}</span>
                                    </div>
                                    {(stat.longViews !== undefined || stat.shortsViews !== undefined) && (
                                        <div className="flex gap-2 text-[9px] text-gray-500 border-t border-gray-700 pt-1 mt-0.5">
                                            <span title="Long Views">L: {stat.longViews || 0}</span>
                                            <span title="Shorts Views">Sh: {stat.shortsViews || 0}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-[10px] text-gray-600">{t('youtube_analytics.noHistory')}</p>
                    )}
                </div>

            </div>
        </div>
    );
};

export default YouTubeAnalyticsNode;
