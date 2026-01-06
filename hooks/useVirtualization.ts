
import { useState, useLayoutEffect, useMemo } from 'react';
import { Node, Connection, Point } from '../types';

const HEADER_HEIGHT = 40;

export const useVirtualization = (
    nodes: Node[],
    connections: Connection[],
    viewTransform: { scale: number; translate: Point }
) => {
    const [containerSize, setContainerSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    // Отслеживаем изменение размера окна (для Ultrawide и ресайза)
    useLayoutEffect(() => {
        const updateSize = () => {
            setContainerSize({ width: window.innerWidth, height: window.innerHeight });
        };
        
        window.addEventListener('resize', updateSize);
        // Вызываем сразу, чтобы инициализировать правильные размеры
        updateSize();
        
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    const { visibleNodes, visibleConnections } = useMemo(() => {
        // Буфер в пикселях экрана. 
        // 1000px обеспечивает плавность при скролле на больших мониторах и предотвращает "мигание" по краям.
        const BUFFER = 1000;

        // 1. Вычисляем видимую область в мировых координатах (координаты узлов)
        // Формула: WorldCoord = (ScreenCoord - Translate) / Scale
        
        // Левая верхняя точка (с учетом буфера)
        const minX = (-BUFFER - viewTransform.translate.x) / viewTransform.scale;
        const minY = (-BUFFER - viewTransform.translate.y) / viewTransform.scale;
        
        // Правая нижняя точка (с учетом размера экрана и буфера)
        const maxX = (containerSize.width + BUFFER - viewTransform.translate.x) / viewTransform.scale;
        const maxY = (containerSize.height + BUFFER - viewTransform.translate.y) / viewTransform.scale;

        const visibleNodeSet = new Set<string>();
        const vNodes: Node[] = [];

        // 2. Фильтруем узлы
        for (const node of nodes) {
             const nodeWidth = node.width;
             // Если узел свернут, его высота равна высоте заголовка, иначе полной высоте
             const nodeHeight = node.isCollapsed ? HEADER_HEIGHT : node.height;
             
             const nodeRight = node.position.x + nodeWidth;
             const nodeBottom = node.position.y + nodeHeight;

             // Проверка пересечения прямоугольников (AABB check)
             // (NodeLeft < ViewRight) && (NodeRight > ViewLeft) && (NodeTop < ViewBottom) && (NodeBottom > ViewTop)
             if (node.position.x < maxX && 
                 nodeRight > minX && 
                 node.position.y < maxY && 
                 nodeBottom > minY) {
                 
                 vNodes.push(node);
                 visibleNodeSet.add(node.id);
             }
        }

        // 3. Фильтруем соединения
        // Рендерим соединение, если ХОТЯ БЫ ОДИН из узлов (начало или конец) виден.
        // Это позволяет линиям "уходить за экран" плавно, а не исчезать.
        const vConnections = connections.filter(conn => {
            return visibleNodeSet.has(conn.fromNodeId) || visibleNodeSet.has(conn.toNodeId);
        });

        return { visibleNodes: vNodes, visibleConnections: vConnections };

    }, [nodes, connections, viewTransform, containerSize]);

    return { visibleNodes, visibleConnections };
};
