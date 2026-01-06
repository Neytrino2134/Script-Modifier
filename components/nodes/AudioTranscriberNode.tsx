
import React, { useMemo, useRef, useState } from 'react';
import type { NodeContentProps } from '../../types';
import { fileToArrayBuffer, audioBufferToWav } from '../../utils/audioUtils';

interface TranscriptionSegment {
    startTime: string;
    endTime: string;
    text: string;
}

const AudioTranscriberNode: React.FC<NodeContentProps> = ({
    node,
    onValueChange,
    t,
    onTranscribeAudio,
    isTranscribingAudio,
    isStopping,
    onStopGeneration,
    deselectAllNodes,
    addToast,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isLoading = isTranscribingAudio;
    const [isDragOver, setIsDragOver] = useState(false);
    const [isConverting, setIsConverting] = useState(false);

    const parsedValue = useMemo(() => {
        try {
            const parsed = JSON.parse(node.value || '{}');
            return {
                audioBase64: parsed.audioBase64 || null,
                mimeType: parsed.mimeType || null,
                transcription: parsed.transcription || '', // Plain text for display
                segments: parsed.segments || [], // Hidden structured data for SRT
                fileName: parsed.fileName || null,
            };
        } catch {
            return { audioBase64: null, mimeType: null, transcription: '', segments: [], fileName: null };
        }
    }, [node.value]);

    const { audioBase64, transcription, fileName, segments } = parsedValue;
    
    const handleValueUpdate = (updates: Partial<typeof parsedValue>) => {
        onValueChange(node.id, JSON.stringify({ ...parsedValue, ...updates }));
    };

    const handleFile = async (file: File) => {
        if (file.type.startsWith('video/mp4')) {
            setIsConverting(true);
            try {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                const arrayBuffer = await fileToArrayBuffer(file);
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                const wavBlob = audioBufferToWav(audioBuffer);
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    const base64String = (e.target?.result as string).split(',')[1];
                    handleValueUpdate({
                        audioBase64: base64String,
                        mimeType: 'audio/wav',
                        fileName: file.name,
                        transcription: '',
                        segments: [],
                    });
                    setIsConverting(false);
                };
                 reader.onerror = () => {
                   setIsConverting(false);
                   addToast(t('error.fileReadError'), 'info'); 
                };
                reader.readAsDataURL(wavBlob);

            } catch (error) {
                console.error('Error converting video to audio:', error);
                addToast(t('error.videoConversionError'), 'info');
                setIsConverting(false);
            }
        } else if (file.type.startsWith('audio/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64String = (e.target?.result as string).split(',')[1];
                handleValueUpdate({
                    audioBase64: base64String,
                    mimeType: file.type,
                    fileName: file.name,
                    transcription: '',
                    segments: [],
                });
            };
            reader.readAsDataURL(file);
        } else {
             addToast(t('error.unsupportedFile'), 'info');
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        handleFile(file);
        if (event.target) {
            event.target.value = ''; // Reset file input
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleTranscribeClick = async () => {
         // Because we need to process the raw JSON response from the service which the generic hook might handle differently,
         // we might need to intercept the response.
         // However, assuming `onTranscribeAudio` calls the service and sets the node value:
         // The service `transcribeAudio` now returns a JSON string of segments.
         // We need the `useGeminiGeneration` hook to handle this.
         // Wait, `useGeminiGeneration` sets the node value directly with the result of `transcribeAudio`.
         // `transcribeAudio` returns a JSON string representing an array of segments.
         // So `node.value` becomes that string.
         // But `parsedValue` expects an object { audioBase64, transcription, ... }.
         // This implies `useGeminiGeneration` logic for `handleTranscribeAudio` needs to merge the result properly, 
         // OR we adapt here.
         
         // Looking at `useGeminiGeneration.ts` (implied from context):
         // It likely does: `const transcription = await transcribeAudio(...)` then `setNodes(... value: JSON.stringify({ ...currentVal, transcription }))`.
         // Since `transcribeAudio` now returns a JSON string of segments, `transcription` in the state will be that JSON string.
         
         // We need to parse that JSON string, extract the text for display, and keep the segments.
         // Since we can't easily change the hook logic from here without providing that file, we will adapt:
         // If `transcription` looks like a JSON array of segments, we parse it here and update the node value correctly to split it into `segments` and `plain text transcription`.
         
         onTranscribeAudio(node.id);
    };

    // Effect to normalize data after transcription if it comes back as raw segment JSON in the 'transcription' field
    useMemo(() => {
        if (transcription && typeof transcription === 'string' && transcription.trim().startsWith('[')) {
             try {
                 const potentialSegments = JSON.parse(transcription);
                 if (Array.isArray(potentialSegments) && potentialSegments.length > 0 && potentialSegments[0].startTime) {
                     // It is the raw segment data. Let's reformat the node value.
                     // We need to trigger an update. Since we can't call onValueChange inside render, we'll do it via a microtask or effect if this component re-renders.
                     // Actually, let's just parse it for display here, but we really should update the stored state for persistence.
                     // Better: check if `segments` is empty but `transcription` has JSON.
                     const plainText = potentialSegments.map((s: any) => s.text).join(' ');
                     // Call update asynchronously to avoid render loop
                     setTimeout(() => {
                         handleValueUpdate({
                             transcription: plainText,
                             segments: potentialSegments
                         });
                     }, 0);
                 }
             } catch (e) {
                 // Not JSON, just normal text
             }
        }
    }, [transcription]);


    const handleDownloadSRT = () => {
        // Construct SRT from segments
        let srtContent = '';
        const segs = (segments as TranscriptionSegment[]) || [];
        
        if (segs.length > 0) {
            srtContent = segs.map((s, index) => {
                // Ensure comma format for millisecons
                const start = s.startTime.replace('.', ',');
                const end = s.endTime.replace('.', ',');
                return `${index + 1}\n${start} --> ${end}\n${s.text}\n`;
            }).join('\n');
        } else {
             // Fallback if no segments but text exists (unlikely with new logic, but safe)
             // Create a dummy subtitle
             srtContent = `1\n00:00:00,000 --> 00:00:05,000\n${transcription}`;
        }

        const blob = new Blob([srtContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const name = fileName ? fileName.replace(/\.[^/.]+$/, "") : "transcription";
        a.download = `${name}.srt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement | HTMLTextAreaElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            const itemType = e.dataTransfer.items[0].type;
            if (itemType.startsWith('audio/') || itemType === 'video/mp4') {
                setIsDragOver(true);
            }
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement | HTMLTextAreaElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement | HTMLTextAreaElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const file = e.dataTransfer.files?.[0];
        if (file && (file.type.startsWith('audio/') || file.type === 'video/mp4')) {
            handleFile(file);
        }
    };

    return (
        <div 
            className={`flex flex-col h-full space-y-2 rounded-md transition-all duration-200 ${isDragOver ? 'ring-2 ring-emerald-400' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="audio/*,video/mp4"
                className="hidden"
            />
            
            {/* Top: Transcribe Button */}
             <button
                onClick={isLoading ? onStopGeneration : handleTranscribeClick}
                disabled={isStopping || !audioBase64 || isConverting}
                className={`w-full px-4 py-2 font-bold text-white rounded-md transition-colors duration-200 flex-shrink-0 ${
                    isStopping ? 'bg-yellow-600' : (isLoading ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-500')
                }`}
            >
                {isStopping ? t('node.action.stopping') : (isLoading ? t('node.content.transcribing') : t('node.content.transcribe'))}
            </button>

            {/* Middle: Text Area (Plain Text) */}
            <textarea
                value={transcription}
                onChange={(e) => handleValueUpdate({ transcription: e.target.value })}
                onMouseDown={e => e.stopPropagation()}
                onFocus={deselectAllNodes}
                placeholder={t('node.content.transcriptionPlaceholder')}
                className="w-full flex-grow p-2 bg-gray-700 border border-transparent rounded-md resize-none focus:border-emerald-500 focus:ring-0 focus:outline-none custom-scrollbar"
                onWheel={e => e.stopPropagation()}
            />
            
            {/* Bottom Section: Download & Upload */}
            <div className="flex flex-col gap-2 flex-shrink-0">
                 {transcription && (
                    <button
                        onClick={handleDownloadSRT}
                        className="w-full px-4 py-2 font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-700 transition-colors duration-200 flex items-center justify-center gap-2"
                        title={t('node.action.downloadSRT')}
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>{t('node.action.downloadSRT')}</span>
                    </button>
                )}
                
                <div className="flex flex-col gap-1">
                    <button
                        onClick={handleUploadClick}
                        disabled={isLoading || isConverting}
                        className="w-full px-4 py-2 font-semibold text-white bg-gray-600 hover:bg-gray-500 rounded-md disabled:bg-gray-700 transition-colors text-sm"
                    >
                        {isConverting ? t('node.content.convertingVideo') : t('node.content.uploadAudio')}
                    </button>
                    <div className="text-center text-[10px] text-gray-500 p-1 bg-gray-900/30 rounded truncate">
                        {isConverting ? <span className="animate-pulse">{t('node.content.convertingVideo')}</span> : (fileName ? `${t('node.content.audioLoaded')}: ${fileName}` : t('node.content.noAudioLoaded'))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AudioTranscriberNode;
