'use client';

import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useWorldStore, chunkKey } from '@/lib/voxel/world-store';
import { meshChunk } from '@/lib/voxel/mesher';
import { CHUNK_SIZE } from '@/lib/voxel/constants';

interface ChunkMeshProps {
  cx: number;
  cz: number;
}

export function ChunkMesh({ cx, cz }: ChunkMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);
  const key = chunkKey(cx, cz);
  const lastVersionRef = useRef(-1);

  // Only re-mesh when this chunk is actually dirty — checked per-frame, no React re-render
  useFrame(() => {
    const store = useWorldStore.getState();
    const chunk = store.chunks.get(key);
    if (!chunk || !chunk.dirty) return;

    // Build new geometry
    const getNeighborBlock = (lx: number, y: number, lz: number) => {
      const wx = cx * CHUNK_SIZE + lx;
      const wz = cz * CHUNK_SIZE + lz;
      return store.getBlock(wx, y, wz);
    };

    const meshData = meshChunk(chunk, getNeighborBlock);
    store.markClean(key);

    // Dispose old geometry
    if (geometryRef.current) {
      geometryRef.current.dispose();
      geometryRef.current = null;
    }

    if (meshData.positions.length === 0) {
      if (meshRef.current) meshRef.current.visible = false;
      return;
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(meshData.positions, 3));
    geom.setAttribute('normal', new THREE.BufferAttribute(meshData.normals, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(meshData.colors, 3));
    geom.setIndex(new THREE.BufferAttribute(meshData.indices, 1));
    geom.computeBoundingBox();

    geometryRef.current = geom;
    if (meshRef.current) {
      meshRef.current.geometry = geom;
      meshRef.current.visible = true;
    }
  });

  useEffect(() => {
    return () => {
      geometryRef.current?.dispose();
    };
  }, []);

  return (
    <mesh
      ref={meshRef}
      position={[cx * CHUNK_SIZE, 0, cz * CHUNK_SIZE]}
      frustumCulled
      visible={false}
    >
      <bufferGeometry />
      <meshLambertMaterial vertexColors />
    </mesh>
  );
}
