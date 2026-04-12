import { z } from 'zod';
import { tool } from 'ai';
import { BlockType } from '@/lib/voxel/types';
import { BLOCK_NAMES } from '@/lib/voxel/constants';

export const placeBlocksTool = tool({
  description: 'Place one or more blocks at specified world coordinates. Use this for building structures, walls, floors, or any block placement.',
  inputSchema: z.object({
    blocks: z.array(z.object({
      x: z.number().int().describe('World X coordinate'),
      y: z.number().int().min(0).max(63).describe('World Y coordinate (0-63)'),
      z: z.number().int().describe('World Z coordinate'),
      type: z.nativeEnum(BlockType).describe('Block type to place'),
    })).min(1).max(500).describe('Array of blocks to place'),
  }),
  execute: async ({ blocks }) => {
    // Tool execution happens client-side via the store
    const typeCounts = new Map<BlockType, number>();
    for (const block of blocks) {
      typeCounts.set(block.type, (typeCounts.get(block.type) || 0) + 1);
    }

    const summary = [...typeCounts.entries()]
      .map(([type, count]) => `${count} ${BLOCK_NAMES[type]}`)
      .join(', ');

    return { placed: blocks.length, summary, blocks };
  },
});
