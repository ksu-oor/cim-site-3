import { z } from 'zod';
import { tool } from 'ai';
import { BlockType } from '@/lib/voxel/types';
import { BLOCK_NAMES } from '@/lib/voxel/constants';

export const generateStructureTool = tool({
  description: 'Generate a complete structure (house, tower, bridge, wall, etc.) at the specified base position. Provide all blocks that make up the structure. Think about the structure in 3D — include floors, walls, roof, windows, doors as appropriate.',
  inputSchema: z.object({
    baseX: z.number().int().describe('X coordinate of the structure origin'),
    baseY: z.number().int().min(0).max(63).describe('Y coordinate of the structure base (ground level)'),
    baseZ: z.number().int().describe('Z coordinate of the structure origin'),
    description: z.string().describe('Brief description of the structure being built'),
    blocks: z.array(z.object({
      dx: z.number().int().describe('Offset from baseX'),
      dy: z.number().int().min(0).describe('Offset from baseY (upward)'),
      dz: z.number().int().describe('Offset from baseZ'),
      type: z.nativeEnum(BlockType).describe('Block type'),
    })).min(1).max(2000).describe('Blocks as offsets from base position'),
  }),
  execute: async ({ baseX, baseY, baseZ, description, blocks: offsets }) => {
    const blocks = offsets.map(({ dx, dy, dz, type }) => ({
      x: baseX + dx,
      y: baseY + dy,
      z: baseZ + dz,
      type,
    }));

    const typeCounts = new Map<BlockType, number>();
    for (const block of blocks) {
      typeCounts.set(block.type, (typeCounts.get(block.type) || 0) + 1);
    }

    const materials = [...typeCounts.entries()]
      .map(([type, count]) => `${count} ${BLOCK_NAMES[type]}`)
      .join(', ');

    return {
      built: blocks.length,
      description,
      base: { x: baseX, y: baseY, z: baseZ },
      materials,
      blocks,
    };
  },
});
