import { z } from 'zod';
import { tool } from 'ai';

export const removeBlocksTool = tool({
  description: 'Remove blocks in a rectangular region by setting them to AIR. Use for clearing space, demolishing structures, or carving.',
  inputSchema: z.object({
    from: z.object({
      x: z.number().int(),
      y: z.number().int().min(0).max(63),
      z: z.number().int(),
    }).describe('Start corner of the region'),
    to: z.object({
      x: z.number().int(),
      y: z.number().int().min(0).max(63),
      z: z.number().int(),
    }).describe('End corner of the region'),
  }),
  execute: async ({ from, to }) => {
    const minX = Math.min(from.x, to.x);
    const maxX = Math.max(from.x, to.x);
    const minY = Math.min(from.y, to.y);
    const maxY = Math.max(from.y, to.y);
    const minZ = Math.min(from.z, to.z);
    const maxZ = Math.max(from.z, to.z);

    const blocks: { x: number; y: number; z: number }[] = [];
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          blocks.push({ x, y, z });
        }
      }
    }

    return {
      removed: blocks.length,
      region: { from: { x: minX, y: minY, z: minZ }, to: { x: maxX, y: maxY, z: maxZ } },
      blocks,
    };
  },
});
