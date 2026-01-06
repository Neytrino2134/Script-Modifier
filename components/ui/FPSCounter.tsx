
import React, { useState, useEffect, useRef } from 'react';

const FPSCounter: React.FC = () => {
  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const animationFrameIdRef = useRef<number>(0);

  useEffect(() => {
    const loop = (time: number) => {
      frameCountRef.current++;
      if (time - lastTimeRef.current > 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastTimeRef.current = time;
      }
      animationFrameIdRef.current = requestAnimationFrame(loop);
    };

    animationFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, []);

  return (
    <div className="absolute top-2 right-2 z-20 pointer-events-none bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-700">
      <div className="font-mono text-2xl font-bold text-emerald-400 select-none">
        {fps} FPS
      </div>
    </div>
  );
};

export default FPSCounter;
