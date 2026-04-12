'use client';

import { useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky, PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { WorldRenderer } from './WorldRenderer';
import { BlockPreview } from './BlockPreview';
import { BuildingLabels } from './BuildingLabels';
import { useWorldStore } from '@/lib/voxel/world-store';
import { BlockType } from '@/lib/voxel/types';
import { CHUNK_HEIGHT } from '@/lib/voxel/constants';

// Keyboard state tracked outside React for performance
const keys: Record<string, boolean> = {};

// Shared refs for raycast results — avoids React re-renders
const targetBlockRef = { current: null as [number, number, number] | null };
const placePositionRef = { current: null as [number, number, number] | null };

function PlayerController() {
  const { camera } = useThree();
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const isLocked = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keys[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.code] = false; };
    const handleLockChange = () => { isLocked.current = document.pointerLockElement !== null; };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('pointerlockchange', handleLockChange);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('pointerlockchange', handleLockChange);
    };
  }, []);

  useFrame((_, delta) => {
    if (!isLocked.current) return;

    const speed = 12;
    const dt = Math.min(delta, 0.1);
    const store = useWorldStore.getState();

    // Movement
    direction.current.set(0, 0, 0);
    if (keys['KeyW']) direction.current.z -= 1;
    if (keys['KeyS']) direction.current.z += 1;
    if (keys['KeyA']) direction.current.x -= 1;
    if (keys['KeyD']) direction.current.x += 1;

    direction.current.normalize();
    velocity.current.set(direction.current.x * speed, 0, direction.current.z * speed);

    const euler = new THREE.Euler(0, camera.rotation.y, 0, 'YXZ');
    velocity.current.applyEuler(euler);

    if (keys['Space']) velocity.current.y = speed;
    else if (keys['ShiftLeft']) velocity.current.y = -speed;
    else velocity.current.y = 0;

    camera.position.add(velocity.current.clone().multiplyScalar(dt));
    camera.position.y = Math.max(1, Math.min(camera.position.y, CHUNK_HEIGHT - 1));

    // DDA raycast for block targeting — writes to module-level refs, no setState
    const rayOrigin = camera.position;
    const rayDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const maxDist = 8;

    let hitPos: [number, number, number] | null = null;
    let placePos: [number, number, number] | null = null;

    let prevX = -999, prevY = -999, prevZ = -999;
    for (let t = 0; t < maxDist; t += 0.1) {
      const px = Math.floor(rayOrigin.x + rayDir.x * t);
      const py = Math.floor(rayOrigin.y + rayDir.y * t);
      const pz = Math.floor(rayOrigin.z + rayDir.z * t);

      if (px === prevX && py === prevY && pz === prevZ) continue;

      const block = store.getBlock(px, py, pz);
      if (block !== BlockType.AIR && block !== BlockType.WATER) {
        hitPos = [px, py, pz];
        placePos = [prevX, prevY, prevZ];
        break;
      }
      prevX = px; prevY = py; prevZ = pz;
    }

    targetBlockRef.current = hitPos;
    placePositionRef.current = placePos;
  });

  return null;
}

interface VoxelCanvasProps {
  selectedBlock: BlockType;
  onBlockPlace?: () => void;
  chatOpen?: boolean;
}

export function VoxelCanvas({ selectedBlock, onBlockPlace, chatOpen }: VoxelCanvasProps) {
  const controlsRef = useRef<any>(null);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (chatOpen) return;
    const store = useWorldStore.getState();

    if (e.button === 0 && targetBlockRef.current) {
      const [x, y, z] = targetBlockRef.current;
      store.setBlock(x, y, z, BlockType.AIR);
    } else if (e.button === 2 && placePositionRef.current) {
      const [x, y, z] = placePositionRef.current;
      store.setBlock(x, y, z, selectedBlock);
      onBlockPlace?.();
    }
  }, [selectedBlock, chatOpen, onBlockPlace]);

  return (
    <div
      className="w-full h-full"
      onClick={handleClick}
      onContextMenu={(e) => { e.preventDefault(); handleClick({ ...e, button: 2 } as React.MouseEvent); }}
    >
      <Canvas
        camera={{ fov: 70, near: 0.1, far: 1000, position: [8, 52, 38] }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        onCreated={({ gl, camera }) => {
          gl.setClearColor('#87CEEB');
          // Isometric-ish 3/4 view showing building facades
          camera.rotation.set(-0.75, 0.1, 0, 'YXZ');
        }}
      >
        <Sky sunPosition={[100, 80, 50]} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[50, 80, 30]} intensity={0.8} castShadow={false} />
        <fog attach="fog" args={['#87CEEB', 80, 160]} />

        <PointerLockControls ref={controlsRef} />
        <PlayerController />
        <WorldRenderer />
        <BuildingLabels />
        <BlockPreview targetRef={targetBlockRef} blockType={selectedBlock} />
      </Canvas>
    </div>
  );
}
