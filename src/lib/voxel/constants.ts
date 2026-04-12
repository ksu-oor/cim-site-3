import { BlockType } from './types';

export const CHUNK_SIZE = 32;
export const CHUNK_HEIGHT = 64;
export const SEA_LEVEL = 20;
export const RENDER_DISTANCE = 3; // chunks (circular)

// RGB colors per block type
export const BLOCK_COLORS: Record<number, [number, number, number]> = {
  [BlockType.STONE]:  [0.50, 0.50, 0.52],
  [BlockType.DIRT]:   [0.55, 0.36, 0.22],
  [BlockType.GRASS]:  [0.30, 0.65, 0.20],
  [BlockType.WOOD]:   [0.55, 0.38, 0.20],
  [BlockType.LEAVES]: [0.18, 0.55, 0.15],
  [BlockType.WATER]:  [0.20, 0.40, 0.75],
  [BlockType.SAND]:   [0.85, 0.80, 0.55],
  [BlockType.GLASS]:  [0.80, 0.90, 0.95],
  [BlockType.LIGHT]:  [1.00, 0.95, 0.70],
};

export const BLOCK_NAMES: Record<number, string> = {
  [BlockType.AIR]:    'Air',
  [BlockType.STONE]:  'Stone',
  [BlockType.DIRT]:   'Dirt',
  [BlockType.GRASS]:  'Grass',
  [BlockType.WOOD]:   'Wood',
  [BlockType.LEAVES]: 'Leaves',
  [BlockType.WATER]:  'Water',
  [BlockType.SAND]:   'Sand',
  [BlockType.GLASS]:  'Glass',
  [BlockType.LIGHT]:  'Light',
};

export const TRANSPARENT_BLOCKS = new Set([BlockType.AIR, BlockType.GLASS, BlockType.WATER]);
