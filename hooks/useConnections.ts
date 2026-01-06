import { useState, useCallback } from 'react';
import { Connection, Point } from '../types';

export const useConnections = (initialConnections: Connection[]) => {
    const [connections, setConnections] = useState<Connection[]>(() => 
        initialConnections.map((c: any, i) => ({
            ...c,
            id: c.id || `initial-conn-${Date.now()}-${i}` 
        }))
    );

    const addConnection = useCallback((newConnection: Omit<Connection, 'id'> & { fromPointOffset?: Point }) => {
        setConnections(current => {
            // Prevent duplicate connections
            if (current.some(c => c.fromNodeId === newConnection.fromNodeId && c.toNodeId === newConnection.toNodeId && c.fromHandleId === newConnection.fromHandleId)) {
                return current;
            }
            const connectionWithId: Connection = {
                ...newConnection,
                id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            };
            return [...current, connectionWithId];
        });
    }, []);

    const removeConnectionsByNodeId = useCallback((nodeId: string) => {
        setConnections(current => current.filter(c => c.fromNodeId !== nodeId && c.toNodeId !== nodeId));
    }, []);

    const removeConnectionById = useCallback((connectionId: string) => {
        setConnections(current => current.filter(c => c.id !== connectionId));
    }, []);
    
    return {
        connections,
        setConnections,
        addConnection,
        removeConnectionsByNodeId,
        removeConnectionById
    };
};