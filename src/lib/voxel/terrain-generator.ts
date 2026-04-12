import { createNoise2D } from 'simplex-noise';
import { Chunk } from './chunk';
import { BlockType } from './types';
import { CHUNK_SIZE, CHUNK_HEIGHT, SEA_LEVEL } from './constants';
import { getCIMBlocksForChunk, CIM_BUILDINGS } from './cim-structures';

const noise2D = createNoise2D();

// No-tree zone: 16-block margin around each CIM building footprint
// Creates a large visible plaza/clearing so buildings stand out from any angle
function isNearBuilding(wx: number, wz: number): boolean {
  const margin = 16;
  for (const b of CIM_BUILDINGS) {
    const [bx, bz] = b.origin;
    // Buildings are at most 10x10
    if (wx >= bx - margin && wx <= bx + 10 + margin &&
        wz >= bz - margin && wz <= bz + 10 + margin) {
      return true;
    }
  }
  return false;
}

function fbm(x: number, z: number, octaves: number, persistence: number, scale: number): number {
  let value = 0;
  let amplitude = 1;
  let frequency = scale;
  let maxValue = 0;
  for (let i = 0; i < octaves; i++) {
    value += noise2D(x * frequency, z * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= 2;
  }
  return value / maxValue;
}

function terrainHeight(wx: number, wz: number): number {
  const continentalness = fbm(wx, wz, 4, 0.5, 0.005);
  const detail = fbm(wx, wz, 3, 0.5, 0.02);
  return Math.floor(SEA_LEVEL + continentalness * 16 + detail * 6);
}

export function generateTerrain(cx: number, cz: number): Chunk {
  const chunk = new Chunk();
  const baseX = cx * CHUNK_SIZE;
  const baseZ = cz * CHUNK_SIZE;

  for (let lx = 0; lx < CHUNK_SIZE; lx++) {
    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      const wx = baseX + lx;
      const wz = baseZ + lz;

      const height = terrainHeight(wx, wz);

      const clampedHeight = Math.min(height, CHUNK_HEIGHT - 1);

      for (let y = 0; y <= clampedHeight; y++) {
        if (y === 0) {
          chunk.set(lx, y, lz, BlockType.STONE);
        } else if (y < clampedHeight - 3) {
          chunk.set(lx, y, lz, BlockType.STONE);
        } else if (y < clampedHeight) {
          chunk.set(lx, y, lz, height <= SEA_LEVEL + 1 ? BlockType.SAND : BlockType.DIRT);
        } else {
          // Surface block
          if (height <= SEA_LEVEL + 1) {
            chunk.set(lx, y, lz, BlockType.SAND);
          } else {
            chunk.set(lx, y, lz, BlockType.GRASS);
          }
        }
      }

      // Fill water up to sea level
      for (let y = clampedHeight + 1; y <= SEA_LEVEL; y++) {
        chunk.set(lx, y, lz, BlockType.WATER);
      }

      // Scattered trees on grass above sea level (skip near CIM buildings)
      if (height > SEA_LEVEL + 2 && height < CHUNK_HEIGHT - 8 && !isNearBuilding(wx, wz)) {
        const treeNoise = noise2D(wx * 0.8, wz * 0.8);
        if (treeNoise > 0.7 && lx > 1 && lx < CHUNK_SIZE - 2 && lz > 1 && lz < CHUNK_SIZE - 2) {
          const trunkHeight = 4 + Math.floor(Math.abs(noise2D(wx * 3, wz * 3)) * 3);
          // Trunk
          for (let ty = 1; ty <= trunkHeight; ty++) {
            chunk.set(lx, clampedHeight + ty, lz, BlockType.WOOD);
          }
          // Leaves canopy
          const leafBase = clampedHeight + trunkHeight - 1;
          for (let dy = 0; dy <= 3; dy++) {
            const radius = dy < 3 ? 2 : 1;
            for (let dx = -radius; dx <= radius; dx++) {
              for (let dz = -radius; dz <= radius; dz++) {
                if (dx === 0 && dz === 0 && dy < 2) continue; // trunk space
                const nlx = lx + dx;
                const nlz = lz + dz;
                if (nlx >= 0 && nlx < CHUNK_SIZE && nlz >= 0 && nlz < CHUNK_SIZE) {
                  const ly = leafBase + dy;
                  if (ly < CHUNK_HEIGHT && chunk.get(nlx, ly, nlz) === BlockType.AIR) {
                    chunk.set(nlx, ly, nlz, BlockType.LEAVES);
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  // Overlay CIM project buildings
  const cimBlocks = getCIMBlocksForChunk(cx, cz, terrainHeight);
  for (const { x, y, z, type } of cimBlocks) {
    const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    if (y >= 0 && y < CHUNK_HEIGHT) {
      chunk.set(lx, y, lz, type);
    }
  }

  chunk.dirty = true;
  return chunk;
}
