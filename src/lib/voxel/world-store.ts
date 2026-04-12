import { create } from 'zustand';
import { BlockType, ChunkKey } from './types';
import { Chunk } from './chunk';
import { CHUNK_SIZE, CHUNK_HEIGHT } from './constants';

function chunkKey(cx: number, cz: number): ChunkKey {
  return `${cx},${cz}`;
}

function worldToChunk(wx: number, wz: number): { cx: number; cz: number; lx: number; lz: number } {
  const cx = Math.floor(wx / CHUNK_SIZE);
  const cz = Math.floor(wz / CHUNK_SIZE);
  const lx = ((wx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
  const lz = ((wz % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
  return { cx, cz, lx, lz };
}

interface WorldState {
  chunks: Map<ChunkKey, Chunk>;
  dirtyChunks: Set<ChunkKey>;
  version: number; // bumped on mutation to trigger re-renders

  getChunk(cx: number, cz: number): Chunk | undefined;
  ensureChunk(cx: number, cz: number): Chunk;
  getBlock(x: number, y: number, z: number): BlockType;
  setBlock(x: number, y: number, z: number, type: BlockType): void;
  setBlocks(blocks: { x: number; y: number; z: number; type: BlockType }[]): void;
  markClean(key: ChunkKey): void;
  removeChunk(cx: number, cz: number): void;
}

export const useWorldStore = create<WorldState>((set, get) => ({
  chunks: new Map(),
  dirtyChunks: new Set(),
  version: 0,

  getChunk(cx, cz) {
    return get().chunks.get(chunkKey(cx, cz));
  },

  ensureChunk(cx, cz) {
    const key = chunkKey(cx, cz);
    const existing = get().chunks.get(key);
    if (existing) return existing;
    const chunk = new Chunk();
    get().chunks.set(key, chunk);
    get().dirtyChunks.add(key);
    set({ version: get().version + 1 });
    return chunk;
  },

  getBlock(x, y, z) {
    if (y < 0 || y >= CHUNK_HEIGHT) return BlockType.AIR;
    const { cx, cz, lx, lz } = worldToChunk(x, z);
    const chunk = get().chunks.get(chunkKey(cx, cz));
    return chunk ? chunk.get(lx, y, lz) : BlockType.AIR;
  },

  setBlock(x, y, z, type) {
    if (y < 0 || y >= CHUNK_HEIGHT) return;
    const { cx, cz, lx, lz } = worldToChunk(x, z);
    const key = chunkKey(cx, cz);
    const chunk = get().chunks.get(key);
    if (!chunk) return;
    chunk.set(lx, y, lz, type);
    get().dirtyChunks.add(key);
    set({ version: get().version + 1 });
  },

  setBlocks(blocks) {
    const state = get();
    for (const { x, y, z, type } of blocks) {
      if (y < 0 || y >= CHUNK_HEIGHT) continue;
      const { cx, cz, lx, lz } = worldToChunk(x, z);
      const key = chunkKey(cx, cz);
      const chunk = state.chunks.get(key);
      if (!chunk) continue;
      chunk.set(lx, y, lz, type);
      state.dirtyChunks.add(key);
    }
    set({ version: state.version + 1 });
  },

  markClean(key) {
    const chunk = get().chunks.get(key);
    if (chunk) {
      chunk.dirty = false;
      get().dirtyChunks.delete(key);
    }
  },

  removeChunk(cx, cz) {
    const key = chunkKey(cx, cz);
    get().chunks.delete(key);
    get().dirtyChunks.delete(key);
    set({ version: get().version + 1 });
  },
}));

export { chunkKey, worldToChunk };
