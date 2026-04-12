'use client';

import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { BLOCK_COLORS } from '@/lib/voxel/constants';
import { BlockType } from '@/lib/voxel/types';

interface BlockPreviewProps {
  targetRef: { current: [number, number, number] | null };
  blockType: BlockType;
}

export function BlockPreview({ targetRef, blockType }: BlockPreviewProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    const pos = targetRef.current;
    if (pos) {
      meshRef.current.visible = true;
      meshRef.current.position.set(pos[0] + 0.5, pos[1] + 0.5, pos[2] + 0.5);
    } else {
      meshRef.current.visible = false;
    }
  });

  const color = BLOCK_COLORS[blockType] || [1, 1, 1];

  return (
    <mesh ref={meshRef} visible={false}>
      <boxGeometry args={[1.01, 1.01, 1.01]} />
      <meshBasicMaterial
        ref={matRef}
        color={new THREE.Color(color[0], color[1], color[2])}
        transparent
        opacity={0.3}
        depthWrite={false}
      />
    </mesh>
  );
}
