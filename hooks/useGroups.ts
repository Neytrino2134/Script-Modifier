
import { useState, useCallback, useRef } from 'react';
import { Group, Node } from '../types';

export const useGroups = (initialGroups: Group[]) => {
    const [groups, setGroups] = useState<Group[]>(initialGroups);
    const groupIdCounter = useRef<number>(0);

    const addGroup = useCallback((nodesToGroup: Node[], title?: string) => {
        if (nodesToGroup.length === 0) return;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        nodesToGroup.forEach(node => {
            minX = Math.min(minX, node.position.x);
            minY = Math.min(minY, node.position.y);
            maxX = Math.max(maxX, node.position.x + node.width);
            const nodeHeight = node.isCollapsed ? 40 : node.height;
            maxY = Math.max(maxY, node.position.y + nodeHeight);
        });
        
        const padding = 30;
        const paddingTop = 70; // Increased top padding for header space. Header is ~40px, leaving ~30px of space.
        groupIdCounter.current++;
        const newGroup: Group = {
            id: `group-${groupIdCounter.current}-${Date.now()}`,
            title: title || `Group ${groupIdCounter.current}`,
            position: { x: minX - padding, y: minY - paddingTop },
            width: maxX - minX + padding * 2,
            height: (maxY - minY) + paddingTop + padding,
            nodeIds: nodesToGroup.map(n => n.id)
        };
        
        setGroups(current => [...current, newGroup]);
    }, []);
    
    const removeGroup = useCallback((groupId: string) => {
        setGroups(current => current.filter(g => g.id !== groupId));
    }, []);

    return {
        groups,
        setGroups,
        addGroup,
        removeGroup,
    };
};
