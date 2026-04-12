import { BlockType } from './types';
import { CHUNK_SIZE, CHUNK_HEIGHT } from './constants';

export class Chunk {
  readonly blocks: Uint8Array;
  dirty = true;

  constructor(blocks?: Uint8Array) {
    this.blocks = blocks ?? new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT);
  }

  private index(x: number, y: number, z: number): number {
    return x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE;
  }

  get(x: number, y: number, z: number): BlockType {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
      return BlockType.AIR;
    }
    return this.blocks[this.index(x, y, z)] as BlockType;
  }

  set(x: number, y: number, z: number, type: BlockType): void {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
      return;
    }
    this.blocks[this.index(x, y, z)] = type;
    this.dirty = true;
  }
}
