'use client';

import { useRef, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useWorldStore, chunkKey } from '@/lib/voxel/world-store';
import { generateTerrain } from '@/lib/voxel/terrain-generator';
import { CHUNK_SIZE, RENDER_DISTANCE } from '@/lib/voxel/constants';
import { ChunkMesh } from './ChunkMesh';
import { ChunkKey } from '@/lib/voxel/types';

const MAX_CHUNKS_PER_FRAME = 1;

export function WorldRenderer() {
  const { camera } = useThree();
  const [visibleKeys, setVisibleKeys] = useState<{ cx: number; cz: number }[]>([]);
  const lastCameraChunkRef = useRef<string>('');
  const pendingGenRef = useRef<{ cx: number; cz: number }[]>([]);

  useFrame(() => {
    const ccx = Math.floor(camera.position.x / CHUNK_SIZE);
    const ccz = Math.floor(camera.position.z / CHUNK_SIZE);
    const cameraChunkKey = `${ccx},${ccz}`;
    const store = useWorldStore.getState();

    // Rebuild the needed-chunks list when camera moves to a new chunk
    if (cameraChunkKey !== lastCameraChunkRef.current) {
      lastCameraChunkRef.current = cameraChunkKey;

      const needed: { cx: number; cz: number }[] = [];
      const pending: { cx: number; cz: number }[] = [];

      for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++) {
        for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++) {
          // Circular distance check
          if (dx * dx + dz * dz > RENDER_DISTANCE * RENDER_DISTANCE + 1) continue;
          const cx = ccx + dx;
          const cz = ccz + dz;
          const key = chunkKey(cx, cz);
          if (store.chunks.has(key)) {
            needed.push({ cx, cz });
          } else {
            pending.push({ cx, cz });
          }
        }
      }

      // Sort pending by distance so closest chunks load first
      pending.sort((a, b) => {
        const da = (a.cx - ccx) ** 2 + (a.cz - ccz) ** 2;
        const db = (b.cx - ccx) ** 2 + (b.cz - ccz) ** 2;
        return da - db;
      });

      pendingGenRef.current = pending;
      setVisibleKeys(needed);
    }

    // Generate a limited number of pending chunks per frame
    let generated = 0;
    while (pendingGenRef.current.length > 0 && generated < MAX_CHUNKS_PER_FRAME) {
      const { cx, cz } = pendingGenRef.current.shift()!;
      const key = chunkKey(cx, cz);
      if (!store.chunks.has(key)) {
        const chunk = generateTerrain(cx, cz);
        store.chunks.set(key, chunk);
        store.dirtyChunks.add(key);
        generated++;
      }
    }

    // If we generated chunks, update visible list
    if (generated > 0) {
      const all: { cx: number; cz: number }[] = [];
      for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++) {
        for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++) {
          if (dx * dx + dz * dz > RENDER_DISTANCE * RENDER_DISTANCE + 1) continue;
          const cx = ccx + dx;
          const cz = ccz + dz;
          if (store.chunks.has(chunkKey(cx, cz))) {
            all.push({ cx, cz });
          }
        }
      }
      setVisibleKeys(all);
    }
  });

  return (
    <>
      {visibleKeys.map(({ cx, cz }) => (
        <ChunkMesh key={`${cx},${cz}`} cx={cx} cz={cz} />
      ))}
    </>
  );
}
