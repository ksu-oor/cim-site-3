'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { BlockType } from '@/lib/voxel/types';
import { BlockPalette, PLACEABLE_BLOCKS } from '@/components/ui/BlockPalette';
import { HUD } from '@/components/ui/HUD';
import { ChatPanel } from '@/components/ui/ChatPanel';

// Dynamic import to avoid SSR issues with Three.js
const VoxelCanvas = dynamic(
  () => import('@/components/canvas/VoxelCanvas').then((mod) => ({ default: mod.VoxelCanvas })),
  { ssr: false },
);

export default function Page() {
  const [selectedBlock, setSelectedBlock] = useState<BlockType>(BlockType.STONE);
  const [chatOpen, setChatOpen] = useState(false);
  const [playerPosition, setPlayerPosition] = useState<[number, number, number]>([16, 30, 16]);
  const [locked, setLocked] = useState(false);
  const positionInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track pointer lock state for overlay
  useEffect(() => {
    const onChange = () => setLocked(document.pointerLockElement !== null);
    document.addEventListener('pointerlockchange', onChange);
    return () => document.removeEventListener('pointerlockchange', onChange);
  }, []);

  // Track player position for HUD and chat context
  useEffect(() => {
    positionInterval.current = setInterval(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return;
      const store = (canvas as HTMLCanvasElement & { __r3f?: { camera?: { position: { x: number; y: number; z: number } } } }).__r3f;
      if (store?.camera) {
        const { x, y, z } = store.camera.position;
        setPlayerPosition([x, y, z]);
      }
    }, 200);
    return () => {
      if (positionInterval.current) clearInterval(positionInterval.current);
    };
  }, []);

  // Toggle chat with T key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyT' && !chatOpen) {
        e.preventDefault();
        setChatOpen(true);
        document.exitPointerLock();
      } else if (e.code === 'Escape' && chatOpen) {
        setChatOpen(false);
      } else if (!chatOpen && e.code >= 'Digit1' && e.code <= 'Digit8') {
        const idx = parseInt(e.code.charAt(5)) - 1;
        if (idx >= 0 && idx < PLACEABLE_BLOCKS.length) {
          setSelectedBlock(PLACEABLE_BLOCKS[idx]);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [chatOpen]);

  const handleToggleChat = useCallback(() => {
    setChatOpen((prev) => {
      if (prev) return false;
      document.exitPointerLock();
      return true;
    });
  }, []);

  return (
    <main className="w-screen h-screen overflow-hidden bg-black cursor-crosshair">
      <VoxelCanvas selectedBlock={selectedBlock} chatOpen={chatOpen} />
      <HUD selectedBlock={selectedBlock} playerPosition={playerPosition} />
      <BlockPalette selected={selectedBlock} onSelect={setSelectedBlock} />
      <ChatPanel open={chatOpen} onToggle={handleToggleChat} playerPosition={playerPosition} />

      {/* Chat toggle button */}
      {!chatOpen && (
        <button
          onClick={handleToggleChat}
          className="fixed top-4 right-16 z-30 px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg text-white/60 hover:text-white/90 text-xs font-mono transition-colors"
        >
          T Chat
        </button>
      )}

      {/* Click-to-start overlay */}
      {!locked && !chatOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-4 pointer-events-none bg-black/30 backdrop-blur-sm rounded-2xl px-10 py-8">
            <h1 className="text-white text-2xl font-bold tracking-wide drop-shadow-lg">
              CIM Voxel World
            </h1>
            <p className="text-white/50 text-xs">Center for Interactive Media &middot; Kennesaw State University</p>
            <p className="text-white/70 text-sm mt-2">Click anywhere to explore</p>
            <div className="flex gap-6 justify-center text-white/40 text-xs font-mono">
              <span>WASD Move</span>
              <span>Space/Shift Up/Down</span>
              <span>T Chat</span>
            </div>
            <div className="flex gap-6 justify-center text-white/30 text-xs font-mono">
              <span>LClick Remove</span>
              <span>RClick Place</span>
              <span>1-9 Blocks</span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
