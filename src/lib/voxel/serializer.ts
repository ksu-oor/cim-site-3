import { BlockType } from './types';
import { BLOCK_NAMES, CHUNK_HEIGHT } from './constants';
import { useWorldStore } from './world-store';

export function serializeNearby(playerX: number, playerY: number, playerZ: number, radius: number = 16): string {
  const store = useWorldStore.getState();
  const blockCounts = new Map<BlockType, number>();
  let surfaceHeight = 0;
  let highestPoint = 0;

  // Scan nearby area
  for (let dx = -radius; dx <= radius; dx++) {
    for (let dz = -radius; dz <= radius; dz++) {
      const wx = Math.floor(playerX) + dx;
      const wz = Math.floor(playerZ) + dz;

      // Find surface height at this column
      for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
        const block = store.getBlock(wx, y, wz);
        if (block !== BlockType.AIR) {
          if (dx === 0 && dz === 0) surfaceHeight = y;
          if (y > highestPoint) highestPoint = y;
          blockCounts.set(block, (blockCounts.get(block) || 0) + 1);
          break;
        }
      }
    }
  }

  // Build description
  const lines: string[] = [];
  lines.push(`Player position: (${Math.floor(playerX)}, ${Math.floor(playerY)}, ${Math.floor(playerZ)})`);
  lines.push(`Ground level at player: ${surfaceHeight}`);
  lines.push(`Highest point nearby: ${highestPoint}`);
  lines.push('');
  lines.push('Surface block distribution:');

  const sorted = [...blockCounts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [type, count] of sorted) {
    const name = BLOCK_NAMES[type] || `Block(${type})`;
    lines.push(`  ${name}: ${count} blocks`);
  }

  // Describe terrain features in cardinal directions
  const directions = [
    { name: 'North', dx: 0, dz: -radius },
    { name: 'South', dx: 0, dz: radius },
    { name: 'East', dx: radius, dz: 0 },
    { name: 'West', dx: -radius, dz: 0 },
  ];

  lines.push('');
  lines.push('Terrain in each direction:');
  for (const dir of directions) {
    const wx = Math.floor(playerX) + dir.dx;
    const wz = Math.floor(playerZ) + dir.dz;
    let dirHeight = 0;
    let surfaceBlock = BlockType.AIR;
    for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
      const block = store.getBlock(wx, y, wz);
      if (block !== BlockType.AIR) {
        dirHeight = y;
        surfaceBlock = block;
        break;
      }
    }
    const blockName = BLOCK_NAMES[surfaceBlock] || 'unknown';
    const diff = dirHeight - surfaceHeight;
    const slope = diff > 3 ? 'uphill' : diff < -3 ? 'downhill' : 'flat';
    lines.push(`  ${dir.name}: ${blockName} surface, height ${dirHeight} (${slope})`);
  }

  return lines.join('\n');
}
