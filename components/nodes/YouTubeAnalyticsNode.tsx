
import React, { useState, useMemo } from 'react';
import { NodeContentProps, CatalogItemType } from '../../types';
import { AnalyticsData } from './youtube-analytics/types';
import { YouTubePlanner } from './youtube-analytics/YouTubePlanner';
import { useLanguage } from '../../localization';
import { ChannelControls } from './youtube-analytics/ChannelControls';
import { VideoList } from './youtube-analytics/VideoList';
import { StatsPanel } from './youtube-analytics/StatsPanel';
import { AIAdviceSection } from './youtube-analytics/AIAdviceSection';

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
    // View Mode for Planner vs Analytics
    const [viewMode, setViewMode] = useState<'analytics' | 'planner'>('analytics');
    
    // Incoming Data State for Video List
    const [incomingVideoData, setIncomingVideoData] = useState<{ title: string, description: string } | null>(null);
    
    // Points animation state (lifted for header display)
    const [justEarned, setJustEarned] = useState(0);
    
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
                contextPrompt: parsed.contextPrompt || '',
                schedule: parsed.schedule || {},
                activePlanningChannels: parsed.activePlanningChannels || [],
                // Discipline features
                disciplinePoints: parsed.disciplinePoints || 0,
                globalGoals: parsed.globalGoals || [],
                habitCompletions: parsed.habitCompletions || {}
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
                contextPrompt: '',
                schedule: {},
                activePlanningChannels: [],
                disciplinePoints: 0,
                globalGoals: [],
                habitCompletions: {}
            };
        }
    }, [node.value]);

    const { authorName, channels, activeChannelId, globalNotes, aiAdvice, aiSuggestedGoal, targetLanguage, contextPrompt, schedule, activePlanningChannels, disciplinePoints, globalGoals, habitCompletions } = parsedValue;
    const activeChannel = channels.find(c => c.id === activeChannelId) || channels[0];

    const handleValueUpdate = (updates: Partial<AnalyticsData>) => {
        onValueChange(node.id, JSON.stringify({ ...parsedValue, ...updates }));
    };

    const updateChannel = (channelId: string, updates: Partial<any>) => {
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

    // Initial load
    React.useEffect(() => {
        refreshIncomingData();
    }, [connections]);

    const handleAddChannel = () => {
        const newId = `channel-${Date.now()}`;
        const newChannel = { id: newId, name: `Channel ${channels.length + 1}`, videos: [], stats: [] };
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
    
    // Accept AI Goal Suggestion
    const handleAcceptSuggestion = () => {
        if (aiSuggestedGoal && activeChannel) {
            const newChannels = channels.map(ch => 
                ch.id === activeChannel.id ? { ...ch, goal: aiSuggestedGoal } : ch
            );
            onValueChange(node.id, JSON.stringify({ 
                ...parsedValue, 
                channels: newChannels,
                aiSuggestedGoal: '' 
            }));
            addToast(t('youtube_analytics.goalUpdated') || "Goal updated", "success");
        }
    };

    // --- Notes Logic (Global) ---
    const handleAddNote = () => {
        const now = new Date();
        const localDate = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
        const newNote = { id: `note-${Date.now()}`, date: localDate, content: '' };
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
        const dataWithMeta = { type: 'youtube-analytics-data', ...parsedValue };
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

    const handleSaveToCatalogWrapper = () => {
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

    // Planner Props Construction
    const plannerProps = {
        channels: channels.map(c => ({ id: c.id, name: c.name })),
        activeChannelIds: activePlanningChannels || [],
        schedule: schedule || {},
        onUpdateActiveChannels: (ids: string[]) => handleValueUpdate({ activePlanningChannels: ids }),
        onUpdateSchedule: (newSchedule: Record<string, any[]>) => handleValueUpdate({ schedule: newSchedule }),
        disciplinePoints: disciplinePoints || 0,
        globalGoals: globalGoals || [],
        habitCompletions: habitCompletions || {},
        onUpdatePoints: (newPoints: number) => handleValueUpdate({ disciplinePoints: newPoints }),
        onUpdateGoals: (newGoals: any[]) => handleValueUpdate({ globalGoals: newGoals }),
        onUpdateHabitCompletions: (newCompletions: Record<string, Record<string, boolean>>) => handleValueUpdate({ habitCompletions: newCompletions }),
        t
    };

    return (
        <div className="flex flex-col h-full rounded-lg overflow-hidden relative">
            {/* View Mode Toggle Header */}
            <div className="flex-shrink-0 flex items-end gap-1 px-2 pt-2 bg-gray-900 border-b border-gray-700">
                 <button onClick={() => setViewMode('analytics')} className={`px-4 py-1.5 text-xs font-bold rounded-t-md transition-colors border-t border-l border-r -mb-px z-10 ${viewMode === 'analytics' ? 'bg-gray-800 text-emerald-400 border-gray-700' : 'bg-gray-900 text-gray-400 border-transparent hover:bg-gray-800 hover:text-gray-200'}`}>
                    {t('youtube_analytics.mode.analytics')}
                </button>
                <button onClick={() => setViewMode('planner')} className={`px-4 py-1.5 text-xs font-bold rounded-t-md transition-colors border-t border-l border-r -mb-px z-10 ${viewMode === 'planner' ? 'bg-gray-800 text-emerald-400 border-gray-700' : 'bg-gray-900 text-gray-400 border-transparent hover:bg-gray-800 hover:text-gray-200'}`}>
                    {t('youtube_analytics.mode.planner')}
                </button>
                
                {/* Points Display */}
                <div className="ml-auto flex items-center gap-2 mb-1 px-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-bold text-yellow-100 font-mono">{disciplinePoints || 0}</span>
                    {justEarned > 0 && <span className="text-xs font-bold text-emerald-400 animate-bounce">+{justEarned}</span>}
                </div>
            </div>

            {viewMode === 'planner' ? (
                <div className="flex-grow p-0 overflow-hidden h-full bg-gray-800">
                    <YouTubePlanner {...plannerProps} />
                </div>
            ) : (
                <div className="flex flex-row flex-grow min-h-0 bg-gray-800">
                    {/* --- COLUMN 1: CHANNEL MGMT --- */}
                    <div className="flex flex-col flex-1 h-full border-r border-gray-700 min-w-0">
                        <ChannelControls 
                            authorName={authorName}
                            channels={channels}
                            activeChannelId={activeChannelId}
                            activeChannel={activeChannel}
                            aiSuggestedGoal={aiSuggestedGoal}
                            t={t}
                            onUpdateValue={handleValueUpdate}
                            onUpdateChannel={updateChannel}
                            onAddChannel={handleAddChannel}
                            onDeleteChannel={handleDeleteChannel}
                            onAcceptSuggestion={handleAcceptSuggestion}
                            deselectAllNodes={deselectAllNodes}
                            nodeId={node.id}
                        />

                        {/* VIDEOS LIST */}
                        <VideoList 
                            activeChannel={activeChannel}
                            onUpdateChannel={updateChannel}
                            onUpdatePoints={(pts) => handleValueUpdate({ disciplinePoints: pts })}
                            disciplinePoints={disciplinePoints}
                            t={t}
                            deselectAllNodes={deselectAllNodes}
                            addToast={addToast}
                            incomingVideoData={incomingVideoData}
                            refreshIncomingData={refreshIncomingData}
                            setJustEarned={setJustEarned}
                        />

                        {/* STATS FOOTER */}
                        <StatsPanel 
                            activeChannel={activeChannel}
                            onUpdateChannel={updateChannel}
                            channels={channels}
                            t={t}
                            addToast={addToast}
                            deselectAllNodes={deselectAllNodes}
                            onSaveToDisk={handleSaveToDisk}
                            onSaveToCatalog={handleSaveToCatalogWrapper}
                            onLoadFromFile={handleLoadFromFile}
                            nodeId={node.id}
                        />
                    </div>

                    {/* --- COLUMN 2: AI ADVICE --- */}
                    <div className="flex flex-col flex-1 h-full border-r border-gray-700 min-w-0 bg-gray-900/20">
                        {/* Header Controls */}
                        <div className="flex flex-col bg-gray-900 px-2 pt-2 pb-2 border-b border-gray-700 gap-2">
                            <div className="w-full">
                                 <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">{t('youtube_analytics.contextPrompt')}</label>
                                 <textarea
                                    value={contextPrompt}
                                    onChange={(e) => handleValueUpdate({ contextPrompt: e.target.value })}
                                    className="w-full bg-gray-800 text-xs rounded p-2 border border-gray-700 focus:border-emerald-500 outline-none text-white resize-y custom-scrollbar"
                                    placeholder={t('youtube_analytics.contextPlaceholder')}
                                    rows={2}
                                    onFocus={deselectAllNodes}
                                    onWheel={(e) => e.stopPropagation()}
                                 />
                            </div>
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

                    {/* --- COLUMN 3: TOOLS (Notes) --- */}
                    <div className="w-80 flex flex-col p-2 border-l border-gray-700 bg-gray-900/20 flex-shrink-0 gap-2 overflow-hidden">
                        {/* Daily Notes */}
                         <div className="flex flex-col bg-gray-900/30 rounded-md border border-gray-700/50 overflow-hidden h-[180px] flex-shrink-0">
                            <div className="flex justify-between items-center p-2 bg-gray-900/50 border-b border-gray-700/50">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('youtube_analytics.dailyNotes')}</h4>
                                <button onClick={handleAddNote} className="text-emerald-400 hover:text-emerald-300 bg-gray-800 rounded px-2 py-0.5 text-sm font-bold">+</button>
                            </div>
                            <div className="flex-grow overflow-y-auto custom-scrollbar p-2 space-y-2" onWheel={e => e.stopPropagation()}>
                                {globalNotes.map((note) => (
                                    <div key={note.id} className="bg-gray-800 rounded p-2 flex flex-col space-y-1 group">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-emerald-500 font-mono">{note.date}</span>
                                            <button onClick={() => handleDeleteNote(note.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                                        </div>
                                        <textarea
                                            value={note.content}
                                            onChange={(e) => handleUpdateNote(note.id, e.target.value)}
                                            className="w-full bg-transparent border border-transparent rounded text-xs text-gray-300 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 p-1 resize-y h-[60px] min-h-[60px] transition-colors outline-none"
                                            placeholder={t('node.content.notePlaceholder')}
                                            rows={3}
                                            onFocus={deselectAllNodes}
                                        />
                                    </div>
                                ))}
                                {globalNotes.length === 0 && <p className="text-center text-[10px] text-gray-600 mt-4">{t('youtube_analytics.noNotes')}</p>}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default YouTubeAnalyticsNode;
