'use client';

import { useEffect, useState } from 'react';
import { BLOCK_NAMES } from '@/lib/voxel/constants';
import { BlockType } from '@/lib/voxel/types';

interface HUDProps {
  selectedBlock: BlockType;
  playerPosition: [number, number, number];
}

export function HUD({ selectedBlock, playerPosition }: HUDProps) {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    const measure = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }
      requestAnimationFrame(measure);
    };
    const id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <>
      {/* Crosshair */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
        <div className="w-5 h-px bg-white/70" />
        <div className="w-px h-5 bg-white/70 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Top-left info */}
      <div className="fixed top-4 left-4 text-white/70 text-xs font-mono space-y-0.5 pointer-events-none select-none">
        <div>{fps} FPS</div>
        <div>
          {Math.floor(playerPosition[0])}, {Math.floor(playerPosition[1])},{' '}
          {Math.floor(playerPosition[2])}
        </div>
        <div>{BLOCK_NAMES[selectedBlock]}</div>
      </div>

    </>
  );
}
