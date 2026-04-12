export enum BlockType {
  AIR = 0,
  STONE = 1,
  DIRT = 2,
  GRASS = 3,
  WOOD = 4,
  LEAVES = 5,
  WATER = 6,
  SAND = 7,
  GLASS = 8,
  LIGHT = 9,
}

export interface ChunkData {
  blocks: Uint8Array;
  dirty: boolean;
}

export interface BlockPosition {
  x: number;
  y: number;
  z: number;
}

export interface ChunkPosition {
  cx: number;
  cz: number;
}

export type ChunkKey = `${number},${number}`;

export interface MeshData {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
  colors: Float32Array;
}
