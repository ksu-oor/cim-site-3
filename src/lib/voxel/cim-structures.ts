import { BlockType } from './types';
import { SEA_LEVEL } from './constants';

// Each CIM cluster gets a themed building at a fixed world position.
// Positions are chosen at cardinal directions from spawn (16, ?, 16),
// spaced ~40 blocks apart so they're visible but don't overlap.

export interface PlacedBlock {
  x: number;
  y: number;
  z: number;
  type: BlockType;
}

interface CIMBuilding {
  name: string;
  /** Southwest corner (x, z) — y is determined by terrain */
  origin: [number, number];
  /** Generates blocks relative to a ground-level baseY */
  generate: (baseY: number) => PlacedBlock[];
}

function box(
  ox: number, oy: number, oz: number,
  sx: number, sy: number, sz: number,
  type: BlockType,
): PlacedBlock[] {
  const blocks: PlacedBlock[] = [];
  for (let x = ox; x < ox + sx; x++)
    for (let y = oy; y < oy + sy; y++)
      for (let z = oz; z < oz + sz; z++)
        blocks.push({ x, y, z, type });
  return blocks;
}

function hollowBox(
  ox: number, oy: number, oz: number,
  sx: number, sy: number, sz: number,
  wallType: BlockType,
): PlacedBlock[] {
  const blocks: PlacedBlock[] = [];
  for (let x = ox; x < ox + sx; x++)
    for (let y = oy; y < oy + sy; y++)
      for (let z = oz; z < oz + sz; z++) {
        const isWall =
          x === ox || x === ox + sx - 1 ||
          y === oy || y === oy + sy - 1 ||
          z === oz || z === oz + sz - 1;
        if (isWall) blocks.push({ x, y, z, type: wallType });
      }
  return blocks;
}

// Shared: stone platform + beacon tower on top of each building
function platform(y: number, sx: number, sz: number): PlacedBlock[] {
  // 2-block high stone platform extending 1 block beyond building footprint
  return box(-1, y - 1, -1, sx + 2, 2, sz + 2, BlockType.STONE);
}

function beacon(cx: number, y: number, cz: number, height: number): PlacedBlock[] {
  const b: PlacedBlock[] = [];
  // 1x1 glass tower with light on top
  for (let h = 0; h < height; h++) {
    b.push({ x: cx, y: y + h, z: cz, type: BlockType.GLASS });
  }
  b.push({ x: cx, y: y + height, z: cz, type: BlockType.LIGHT });
  return b;
}

// ─── Game Studio ─────────────────────────────────────────────────
// Tall wooden lodge with peaked roof and beacon tower
function gameStudio(baseY: number): PlacedBlock[] {
  const b: PlacedBlock[] = [];
  const y = baseY + 1;
  b.push(...platform(y, 9, 7));
  // Walls 8 blocks high
  b.push(...hollowBox(0, y + 1, 0, 9, 8, 7, BlockType.WOOD));
  // Windows on all sides (two rows)
  for (const wx of [2, 4, 6]) {
    for (const wy of [3, 5, 7]) {
      b.push({ x: wx, y: y + wy, z: 0, type: BlockType.GLASS });
      b.push({ x: wx, y: y + wy, z: 6, type: BlockType.GLASS });
    }
  }
  // Door
  b.push({ x: 4, y: y + 1, z: 0, type: BlockType.AIR });
  b.push({ x: 4, y: y + 2, z: 0, type: BlockType.AIR });
  b.push({ x: 4, y: y + 3, z: 0, type: BlockType.AIR });
  // Peaked roof (3 tiers)
  for (let rx = 0; rx < 9; rx++)
    for (let rz = 0; rz < 7; rz++)
      b.push({ x: rx, y: y + 9, z: rz, type: BlockType.WOOD });
  for (let rx = 1; rx < 8; rx++)
    for (let rz = 1; rz < 6; rz++)
      b.push({ x: rx, y: y + 10, z: rz, type: BlockType.WOOD });
  for (let rx = 2; rx < 7; rx++)
    for (let rz = 2; rz < 5; rz++)
      b.push({ x: rx, y: y + 11, z: rz, type: BlockType.WOOD });
  for (let rx = 3; rx < 6; rx++)
    for (let rz = 2; rz < 5; rz++)
      b.push({ x: rx, y: y + 12, z: rz, type: BlockType.WOOD });
  // Beacon tower from roof peak
  b.push(...beacon(4, y + 13, 3, 5));
  // Interior lights
  b.push({ x: 2, y: y + 7, z: 3, type: BlockType.LIGHT });
  b.push({ x: 6, y: y + 7, z: 3, type: BlockType.LIGHT });
  b.push({ x: 4, y: y + 4, z: 3, type: BlockType.LIGHT });
  return b;
}

// ─── Digital Twin ────────────────────────────────────────────────
// Tall glass & stone skyscraper with observation deck
function digitalTwin(baseY: number): PlacedBlock[] {
  const b: PlacedBlock[] = [];
  const y = baseY + 1;
  b.push(...platform(y, 7, 7));
  // Stone pillars at corners — 10 blocks high
  for (const [px, pz] of [[0, 0], [6, 0], [0, 6], [6, 6]] as const) {
    b.push(...box(px, y + 1, pz, 1, 10, 1, BlockType.STONE));
  }
  // Glass curtain walls — 10 blocks high
  for (let i = 1; i < 6; i++) {
    for (let h = 1; h <= 10; h++) {
      b.push({ x: i, y: y + h, z: 0, type: BlockType.GLASS });
      b.push({ x: i, y: y + h, z: 6, type: BlockType.GLASS });
      b.push({ x: 0, y: y + h, z: i, type: BlockType.GLASS });
      b.push({ x: 6, y: y + h, z: i, type: BlockType.GLASS });
    }
  }
  // Door
  b.push({ x: 3, y: y + 1, z: 0, type: BlockType.AIR });
  b.push({ x: 3, y: y + 2, z: 0, type: BlockType.AIR });
  b.push({ x: 3, y: y + 3, z: 0, type: BlockType.AIR });
  // Flat roof / observation deck
  b.push(...box(0, y + 11, 0, 7, 1, 7, BlockType.STONE));
  // Roof railing (stone pillars)
  for (let i = 0; i <= 6; i += 2) {
    b.push({ x: i, y: y + 12, z: 0, type: BlockType.STONE });
    b.push({ x: i, y: y + 12, z: 6, type: BlockType.STONE });
    b.push({ x: 0, y: y + 12, z: i, type: BlockType.STONE });
    b.push({ x: 6, y: y + 12, z: i, type: BlockType.STONE });
  }
  // Tall antenna/beacon
  b.push(...beacon(3, y + 12, 3, 7));
  // Interior lights (two floors)
  b.push({ x: 3, y: y + 5, z: 3, type: BlockType.LIGHT });
  b.push({ x: 3, y: y + 9, z: 3, type: BlockType.LIGHT });
  return b;
}

// ─── XR Healthcare ───────────────────────────────────────────────
// Tall white clinical tower with cross symbol
function xrHealthcare(baseY: number): PlacedBlock[] {
  const b: PlacedBlock[] = [];
  const y = baseY + 1;
  b.push(...platform(y, 8, 8));
  // Sand/white walls — 9 blocks high
  b.push(...hollowBox(0, y + 1, 0, 8, 9, 8, BlockType.SAND));
  // Windows (3 rows)
  for (const wx of [2, 5]) {
    for (const wy of [2, 5, 8]) {
      b.push({ x: wx, y: y + wy, z: 0, type: BlockType.GLASS });
      b.push({ x: wx, y: y + wy + 1, z: 0, type: BlockType.GLASS });
    }
  }
  // Wide door
  b.push({ x: 3, y: y + 1, z: 0, type: BlockType.AIR });
  b.push({ x: 3, y: y + 2, z: 0, type: BlockType.AIR });
  b.push({ x: 4, y: y + 1, z: 0, type: BlockType.AIR });
  b.push({ x: 4, y: y + 2, z: 0, type: BlockType.AIR });
  // Flat roof
  b.push(...box(0, y + 10, 0, 8, 1, 8, BlockType.SAND));
  // Cross symbol on front face (wood on sand, very visible)
  for (let dy = 5; dy <= 9; dy++)
    b.push({ x: 3, y: y + dy, z: 7, type: BlockType.WOOD });
  for (let dx = 1; dx <= 5; dx++)
    b.push({ x: dx, y: y + 7, z: 7, type: BlockType.WOOD });
  // Beacon tower
  b.push(...beacon(4, y + 11, 4, 6));
  // Interior lights
  b.push({ x: 4, y: y + 4, z: 4, type: BlockType.LIGHT });
  b.push({ x: 4, y: y + 8, z: 4, type: BlockType.LIGHT });
  return b;
}

// ─── Digital Humanities ──────────────────────────────────────────
// Tall library/gallery with stone base, wood upper, and tower
function digitalHumanities(baseY: number): PlacedBlock[] {
  const b: PlacedBlock[] = [];
  const y = baseY + 1;
  b.push(...platform(y, 7, 8));
  // Stone lower walls (4 blocks)
  b.push(...hollowBox(0, y + 1, 0, 7, 4, 8, BlockType.STONE));
  // Wood upper walls (5 blocks)
  b.push(...hollowBox(0, y + 5, 0, 7, 5, 8, BlockType.WOOD));
  // Large gallery windows on all sides
  for (let i = 1; i < 7; i++) {
    for (let h = 5; h <= 8; h++) {
      b.push({ x: 0, y: y + h, z: i, type: BlockType.GLASS });
      b.push({ x: 6, y: y + h, z: i, type: BlockType.GLASS });
    }
  }
  for (const wx of [2, 4]) {
    for (let h = 5; h <= 8; h++) {
      b.push({ x: wx, y: y + h, z: 0, type: BlockType.GLASS });
      b.push({ x: wx, y: y + h, z: 7, type: BlockType.GLASS });
    }
  }
  // Door
  b.push({ x: 3, y: y + 1, z: 0, type: BlockType.AIR });
  b.push({ x: 3, y: y + 2, z: 0, type: BlockType.AIR });
  b.push({ x: 3, y: y + 3, z: 0, type: BlockType.AIR });
  // Flat roof
  for (let rz = 0; rz < 8; rz++)
    for (let rx = 0; rx < 7; rx++)
      b.push({ x: rx, y: y + 10, z: rz, type: BlockType.WOOD });
  // Corner tower (2x2, rising above roof)
  b.push(...box(0, y + 10, 0, 2, 5, 2, BlockType.STONE));
  b.push({ x: 0, y: y + 15, z: 0, type: BlockType.LIGHT });
  b.push({ x: 1, y: y + 15, z: 1, type: BlockType.LIGHT });
  // Beacon
  b.push(...beacon(3, y + 11, 4, 6));
  // Interior lights
  b.push({ x: 3, y: y + 3, z: 4, type: BlockType.LIGHT });
  b.push({ x: 3, y: y + 8, z: 4, type: BlockType.LIGHT });
  return b;
}

// ─── Building registry ──────────────────────────────────────────

// Buildings placed on high terrain points visible from spawn.
// Terrain noise peaks at roughly these locations (above sea level 20).
// Buildings placed tightly on the central hill, guaranteed above sea level.
export const CIM_BUILDINGS: CIMBuilding[] = [
  { name: 'Game Studio',         origin: [-2,  -2], generate: gameStudio },
  { name: 'Digital Twin',        origin: [16,  -2], generate: digitalTwin },
  { name: 'XR Healthcare',       origin: [16,  16], generate: xrHealthcare },
  { name: 'Digital Humanities',   origin: [-2,  16], generate: digitalHumanities },
];

/**
 * Returns all blocks for CIM buildings that fall within the given chunk.
 * Call after terrain generation to overlay structures.
 */
export function getCIMBlocksForChunk(
  cx: number,
  cz: number,
  getTerrainHeight: (wx: number, wz: number) => number,
): PlacedBlock[] {
  const chunkMinX = cx * 32;
  const chunkMinZ = cz * 32;
  const chunkMaxX = chunkMinX + 32;
  const chunkMaxZ = chunkMinZ + 32;

  const allBlocks: PlacedBlock[] = [];

  // Fill central plaza connecting all 4 buildings
  // Buildings span from [-2,-2] to [26,26]. Plaza covers the full area.
  const plazaMinX = -4;
  const plazaMinZ = -4;
  const plazaMaxX = 28;
  const plazaMaxZ = 28;
  const plazaY = SEA_LEVEL + 2; // match minimum building baseY

  if (plazaMaxX >= chunkMinX && plazaMinX < chunkMaxX &&
      plazaMaxZ >= chunkMinZ && plazaMinZ < chunkMaxZ) {
    for (let wx = Math.max(plazaMinX, chunkMinX); wx < Math.min(plazaMaxX, chunkMaxX); wx++) {
      for (let wz = Math.max(plazaMinZ, chunkMinZ); wz < Math.min(plazaMaxZ, chunkMaxZ); wz++) {
        const naturalHeight = getTerrainHeight(wx, wz);
        if (naturalHeight < plazaY) {
          for (let y = naturalHeight + 1; y <= plazaY; y++) {
            allBlocks.push({ x: wx, y, z: wz, type: y === plazaY ? BlockType.GRASS : BlockType.STONE });
          }
        }
      }
    }
  }

  // Stone paths in a cross pattern connecting the 4 buildings
  // Horizontal path (east-west) at z=6..8, vertical path (north-south) at x=11..13
  const pathY = plazaY + 1;
  for (let wx = Math.max(plazaMinX, chunkMinX); wx < Math.min(plazaMaxX, chunkMaxX); wx++) {
    for (let wz = Math.max(plazaMinZ, chunkMinZ); wz < Math.min(plazaMaxZ, chunkMaxZ); wz++) {
      const onHorizontal = wz >= 6 && wz <= 8;
      const onVertical = wx >= 11 && wx <= 13;
      if (onHorizontal || onVertical) {
        allBlocks.push({ x: wx, y: pathY, z: wz, type: BlockType.STONE });
      }
    }
  }

  // Central monument at path intersection (x=12, z=7)
  const monX = 12, monZ = 7;
  if (monX >= chunkMinX && monX < chunkMaxX && monZ >= chunkMinZ && monZ < chunkMaxZ) {
    // Stone base 3x3
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const wx = monX + dx, wz = monZ + dz;
        if (wx >= chunkMinX && wx < chunkMaxX && wz >= chunkMinZ && wz < chunkMaxZ) {
          allBlocks.push({ x: wx, y: pathY + 1, z: wz, type: BlockType.STONE });
        }
      }
    }
    // Stone pillar 4 blocks high
    for (let h = 2; h <= 5; h++) {
      allBlocks.push({ x: monX, y: pathY + h, z: monZ, type: BlockType.STONE });
    }
    // Glass cap + light on top
    allBlocks.push({ x: monX, y: pathY + 6, z: monZ, type: BlockType.GLASS });
    allBlocks.push({ x: monX, y: pathY + 7, z: monZ, type: BlockType.LIGHT });
  }

  for (const building of CIM_BUILDINGS) {
    const [bx, bz] = building.origin;
    // Quick bounding check — buildings are at most 12x12 (including platform overhang)
    if (bx + 12 < chunkMinX || bx - 2 > chunkMaxX) continue;
    if (bz + 12 < chunkMinZ || bz - 2 > chunkMaxZ) continue;

    const baseY = Math.max(getTerrainHeight(bx + 3, bz + 3), SEA_LEVEL + 2); // center of building, always above water
    const blocks = building.generate(baseY);

    // Fill terrain beneath elevated buildings (stone + dirt + grass pillar)
    // Platform extends 1 block beyond footprint on each side (-1 to sx+1)
    for (let dx = -2; dx <= 12; dx++) {
      for (let dz = -2; dz <= 12; dz++) {
        const wx = bx + dx;
        const wz = bz + dz;
        if (wx < chunkMinX || wx >= chunkMaxX || wz < chunkMinZ || wz >= chunkMaxZ) continue;
        const naturalHeight = getTerrainHeight(wx, wz);
        if (naturalHeight < baseY) {
          // Fill gap between natural terrain and platform with stone
          for (let y = naturalHeight + 1; y <= baseY; y++) {
            allBlocks.push({ x: wx, y, z: wz, type: y === baseY ? BlockType.GRASS : BlockType.STONE });
          }
        }
      }
    }

    // Offset to world coords and filter to this chunk
    for (const block of blocks) {
      const wx = bx + block.x;
      const wz = bz + block.z;
      if (wx >= chunkMinX && wx < chunkMaxX && wz >= chunkMinZ && wz < chunkMaxZ) {
        allBlocks.push({ x: wx, y: block.y, z: wz, type: block.type });
      }
    }
  }

  return allBlocks;
}
