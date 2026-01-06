import { useState, useCallback, WheelEvent, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { Point } from '../types';

interface GestureState {
  startPoint: Point;
  startTranslate: Point;
  // For pinch-zoom
  initialDistance?: number;
  initialScale?: number;
}

export const useCanvas = (initialTransform: { scale: number; translate: Point } = { scale: 1, translate: { x: 0, y: 0 } }) => {
    const [viewTransform, setViewTransform] = useState(initialTransform);
    const [gestureState, setGestureState] = useState<GestureState | null>(null);
    const [pointerPosition, setPointerPosition] = useState<Point>({ x: 0, y: 0 });
    const [clientPointerPosition, setClientPointerPosition] = useState<Point>({ x: 0, y: 0 });

    const setZoom = useCallback((newScale: number, pivot: Point) => {
        const clampedScale = Math.max(0.2, Math.min(newScale, 2));

        const worldX = (pivot.x - viewTransform.translate.x) / viewTransform.scale;
        const worldY = (pivot.y - viewTransform.translate.y) / viewTransform.scale;

        const newTranslateX = pivot.x - worldX * clampedScale;
        const newTranslateY = pivot.y - worldY * clampedScale;

        setViewTransform({
            scale: clampedScale,
            translate: { x: newTranslateX, y: newTranslateY },
        });
    }, [viewTransform.scale, viewTransform.translate.x, viewTransform.translate.y, setViewTransform]);


    const handleWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        const zoomFactor = 1.1;
        const newScale = e.deltaY < 0 ? viewTransform.scale * zoomFactor : viewTransform.scale / zoomFactor;
        setZoom(newScale, { x: e.clientX, y: e.clientY });
    }, [viewTransform.scale, setZoom]);

    const startPanning = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
        setGestureState({
            startPoint: { x: e.clientX, y: e.clientY },
            startTranslate: viewTransform.translate,
        });
    }, [viewTransform.translate]);
    
    const stopPanning = useCallback(() => setGestureState(null), []);
    
    const pan = useCallback((e: globalThis.MouseEvent) => {
        if (!gestureState || gestureState.initialDistance) return;
        const dx = e.clientX - gestureState.startPoint.x;
        const dy = e.clientY - gestureState.startPoint.y;
        
        setViewTransform(current => ({
            ...current,
            translate: {
                x: gestureState.startTranslate.x + dx,
                y: gestureState.startTranslate.y + dy,
            }
        }));
    }, [gestureState, setViewTransform]);
    
    const updatePointerPosition = useCallback((e: { clientX: number, clientY: number }) => {
         const transformedPointerPos = {
            x: (e.clientX - viewTransform.translate.x) / viewTransform.scale,
            y: (e.clientY - viewTransform.translate.y) / viewTransform.scale,
        };
        setPointerPosition(transformedPointerPos);
        setClientPointerPosition({ x: e.clientX, y: e.clientY });
    }, [viewTransform]);

    const handleCanvasTouchStart = useCallback((e: ReactTouchEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (e.touches.length === 1) {
          setGestureState({
              startPoint: { x: e.touches[0].clientX, y: e.touches[0].clientY },
              startTranslate: viewTransform.translate,
          });
      } else if (e.touches.length === 2) {
          const dist = Math.hypot(
              e.touches[0].clientX - e.touches[1].clientX,
              e.touches[0].clientY - e.touches[1].clientY
          );
          const midpoint = {
              x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
              y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
          };
          setGestureState({
              startPoint: midpoint,
              startTranslate: viewTransform.translate,
              initialDistance: dist,
              initialScale: viewTransform.scale,
          });
      }
    }, [viewTransform.translate, viewTransform.scale]);

    const handleCanvasTouchMove = useCallback((e: ReactTouchEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!gestureState) return;

        if (e.touches.length === 1 && gestureState.initialDistance === undefined) {
            const dx = e.touches[0].clientX - gestureState.startPoint.x;
            const dy = e.touches[0].clientY - gestureState.startPoint.y;
            setViewTransform(current => ({
                ...current,
                translate: {
                    x: gestureState.startTranslate.x + dx,
                    y: gestureState.startTranslate.y + dy,
                }
            }));
        } else if (e.touches.length === 2 && gestureState.initialDistance !== undefined && gestureState.initialScale !== undefined) {
            const newDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const newCenter = {
                x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
            };

            const scale = (newDist / gestureState.initialDistance) * gestureState.initialScale;
            const clampedScale = Math.max(0.2, Math.min(scale, 2));

            const worldFingerCenterX = (gestureState.startPoint.x - gestureState.startTranslate.x) / gestureState.initialScale;
            const worldFingerCenterY = (gestureState.startPoint.y - gestureState.startTranslate.y) / gestureState.initialScale;
            
            const newTranslateX = newCenter.x - worldFingerCenterX * clampedScale;
            const newTranslateY = newCenter.y - worldFingerCenterY * clampedScale;

            setViewTransform({
                scale: clampedScale,
                translate: { x: newTranslateX, y: newTranslateY }
            });
        }
    }, [gestureState, setViewTransform]);

    const handleCanvasTouchEnd = useCallback((e: ReactTouchEvent<HTMLDivElement>) => {
        if (e.touches.length === 1) {
            setGestureState({
                startPoint: { x: e.touches[0].clientX, y: e.touches[0].clientY },
                startTranslate: viewTransform.translate,
            });
        } else {
            setGestureState(null);
        }
    }, [viewTransform.translate]);

    return {
        viewTransform,
        setViewTransform,
        isPanning: gestureState,
        pointerPosition,
        clientPointerPosition,
        handleWheel,
        startPanning,
        stopPanning,
        pan,
        updatePointerPosition,
        setZoom,
        handleCanvasTouchStart,
        handleCanvasTouchMove,
        handleCanvasTouchEnd,
    };
};
