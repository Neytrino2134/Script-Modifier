
import React, { useCallback, useState } from 'react';
import { Node, NodeType, Connection } from '../types';

export const useGeminiChainExecution = ({
    nodes,
    connections,
    setNodes,
    executionStopRequested,
    setError,
    generationHandlers,
    analysisHandlers,
    modificationHandlers,
}: {
    nodes: Node[];
    connections: Connection[];
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
    executionStopRequested: React.MutableRefObject<boolean>;
    setError: (error: string | null) => void;
    generationHandlers: { handleGenerateScript: (nodeId: string) => Promise<void>; };
    analysisHandlers: { handleAnalyzeScript: (nodeId: string) => Promise<void>; };
    modificationHandlers: { handleModifyScriptPrompts: (nodeId: string) => Promise<void>; };
}) => {
    const [executingNodeId, setExecutingNodeId] = useState<string | null>(null);
    const [isExecutingChain, setIsExecutingChain] = useState(false);
    const [stoppingNodes, setStoppingNodes] = useState(new Set<string>());

    const handleApplyAliasesForScriptAnalyzer = useCallback((analyzerNodeId: string) => {
        return new Promise<void>((resolve) => {
            setNodes(prevNodes => {
                const node = prevNodes.find(n => n.id === analyzerNodeId);
                if (!node || node.type !== NodeType.SCRIPT_ANALYZER) {
                    resolve();
                    return prevNodes;
                }
    
                let parsedValue;
                try {
                    parsedValue = JSON.parse(node.value || '{}');
                } catch {
                    resolve();
                    return prevNodes;
                }
    
                const { characters, scenes } = parsedValue;
                if (!characters || characters.length === 0 || !scenes) {
                    resolve();
                    return prevNodes;
                }
    
                const replacements = characters.map((char: any) => ({ from: char.originalName || char.name, to: char.index || char.alias }));
                const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
                const applyReplacements = (text: string | undefined): string => {
                    if (!text) return "";
                    let newText = text;
                    replacements.forEach(({ from, to }) => {
                        if (from && to) {
                            const escapedFrom = escapeRegExp(from);
                            const regex = new RegExp(`\\b${escapedFrom}\\b`, 'gi');
                            newText = newText.replace(regex, to);
                        }
                    });
                    return newText;
                };
    
                const newScenes = scenes.map((scene: any) => ({
                    ...scene,
                    frames: scene.frames.map((frame: any) => ({
                        ...frame,
                        description: applyReplacements(frame.description),
                        imagePrompt: applyReplacements(frame.imagePrompt),
                        environmentPrompt: applyReplacements(frame.environmentPrompt),
                        videoPrompt: applyReplacements(frame.videoPrompt),
                    }))
                }));

                const newCharacters = characters.map((char: any) => ({ ...char, imagePrompt: applyReplacements(char.imagePrompt) }));
                const newParsedValue = { ...parsedValue, characters: newCharacters, scenes: newScenes };
    
                const finalNodes = prevNodes.map(n => n.id === analyzerNodeId ? { ...n, value: JSON.stringify(newParsedValue) } : n);
                resolve();
                return finalNodes;
            });
        });
    }, [setNodes]);

    const handleApplyAliasesForCharacterGenerator = useCallback((generatorNodeId: string) => {
        return new Promise<void>((resolve) => {
            setNodes(prevNodes => {
                const node = prevNodes.find(n => n.id === generatorNodeId);
                if (!node || node.type !== NodeType.CHARACTER_GENERATOR) { resolve(); return prevNodes; }
                let parsedValue;
                try { parsedValue = JSON.parse(node.value || '{}'); } 
                catch { resolve(); return prevNodes; }

                const { characters } = parsedValue;
                if (!characters || characters.length === 0) { resolve(); return prevNodes; }

                const replacements = characters.map((char: any) => ({ from: char.originalName, to: char.index || char.alias }));
                const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                const applyReplacements = (text: string) => {
                    let newText = text;
                    replacements.forEach(({ from, to }) => {
                        if (from && to && from !== to) {
                            const escapedFrom = escapeRegExp(from);
                            const regex = new RegExp(`\\b${escapedFrom}\\b`, 'gi');
                            newText = newText.replace(regex, to);
                        }
                    });
                    return newText;
                };

                const newCharacters = characters.map((char: any) => ({
                    ...char,
                    fullDescription: applyReplacements(char.fullDescription),
                    prompt: applyReplacements(char.prompt),
                }));
                
                const newParsedValue = { ...parsedValue, characters: newCharacters };
    
                const finalNodes = prevNodes.map(n => n.id === generatorNodeId ? { ...n, value: JSON.stringify(newParsedValue) } : n);
                resolve();
                return finalNodes;
            });
        });
    }, [setNodes]);

    const handleExecuteFullChain = useCallback(async (finalizerNodeId: string) => {
        setError(null);
        setIsExecutingChain(true);
        executionStopRequested.current = false;
    
        const findUpstreamNode = (startNodeId: string, targetType: NodeType): Node | undefined => {
            let conn = connections.find(c => c.toNodeId === startNodeId);
            if (!conn) return undefined;
    
            let upstreamNode = nodes.find(n => n.id === conn!.fromNodeId);
            while (upstreamNode && upstreamNode.type === NodeType.REROUTE_DOT) {
                conn = connections.find(c => c.toNodeId === upstreamNode!.id);
                if (!conn) return undefined;
                upstreamNode = nodes.find(n => n.id === conn.fromNodeId);
            }
            return (upstreamNode && upstreamNode.type === targetType) ? upstreamNode : undefined;
        };
    
        try {
            setExecutingNodeId(finalizerNodeId);
            const analyzerNode = findUpstreamNode(finalizerNodeId, NodeType.SCRIPT_ANALYZER);
            if (!analyzerNode) throw new Error("Could not find a connected Script Analyzer node.");
    
            const generatorNode = findUpstreamNode(analyzerNode.id, NodeType.SCRIPT_GENERATOR);
            if (!generatorNode) throw new Error("Could not find a connected Script Generator node.");
    
            setExecutingNodeId(generatorNode.id);
            await generationHandlers.handleGenerateScript(generatorNode.id);
            if (executionStopRequested.current) throw new Error("Chain execution stopped.");
    
            setExecutingNodeId(analyzerNode.id);
            await analysisHandlers.handleAnalyzeScript(analyzerNode.id);
            if (executionStopRequested.current) throw new Error("Chain execution stopped.");
            
            await handleApplyAliasesForScriptAnalyzer(analyzerNode.id);
            if (executionStopRequested.current) throw new Error("Chain execution stopped.");
    
            setExecutingNodeId(finalizerNodeId);
            await modificationHandlers.handleModifyScriptPrompts(finalizerNodeId);
            if (executionStopRequested.current) throw new Error("Chain execution stopped.");
    
        } catch (e: any) {
            if (e.message !== "Chain execution stopped.") {
                setError(e.message || "An unknown error occurred during chain execution.");
            }
        } finally {
            setIsExecutingChain(false);
            setExecutingNodeId(null);
        }
    
    }, [nodes, connections, setError, setIsExecutingChain, setExecutingNodeId, executionStopRequested, generationHandlers, analysisHandlers, modificationHandlers, handleApplyAliasesForScriptAnalyzer]);

    const handleExecuteChain = useCallback(async (startNodeId: string) => {
        console.warn("Chain execution is not fully implemented.");
        setIsExecutingChain(true);
        setExecutingNodeId(startNodeId);
        executionStopRequested.current = false;
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (!executionStopRequested.current) {
            setIsExecutingChain(false);
            setExecutingNodeId(null);
        }
    }, [setIsExecutingChain, setExecutingNodeId, executionStopRequested]);

    const handleProcessChainForward = useCallback(async (nodeId: string) => {
        console.warn("Process chain forward is not fully implemented.");
    }, []);

    return {
        states: { executingNodeId, isExecutingChain, stoppingNodes },
        handleExecuteFullChain,
        handleExecuteChain,
        handleProcessChainForward,
        handleApplyAliasesForScriptAnalyzer,
        handleApplyAliasesForCharacterGenerator,
        stop: () => {
            setIsExecutingChain(false);
            setExecutingNodeId(null);
        }
    };
};
