'use client';

import { BlockType } from '@/lib/voxel/types';
import { BLOCK_COLORS, BLOCK_NAMES } from '@/lib/voxel/constants';

export const PLACEABLE_BLOCKS = [
  BlockType.STONE,
  BlockType.DIRT,
  BlockType.GRASS,
  BlockType.WOOD,
  BlockType.LEAVES,
  BlockType.SAND,
  BlockType.GLASS,
  BlockType.LIGHT,
];

interface BlockPaletteProps {
  selected: BlockType;
  onSelect: (type: BlockType) => void;
}

export function BlockPalette({ selected, onSelect }: BlockPaletteProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10">
      {PLACEABLE_BLOCKS.map((type, i) => {
        const color = BLOCK_COLORS[type];
        const isSelected = type === selected;
        return (
          <button
            key={type}
            onClick={() => onSelect(type)}
            title={`${BLOCK_NAMES[type]} (${i + 1})`}
            className={`relative w-10 h-10 rounded-lg border-2 transition-all duration-150 hover:scale-110 ${
              isSelected
                ? 'border-white shadow-lg shadow-white/20 scale-110'
                : 'border-white/20 hover:border-white/40'
            }`}
            style={{
              backgroundColor: `rgb(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255})`,
            }}
          >
            <span className="absolute top-0.5 right-1 text-[9px] font-mono text-white/60 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
              {i + 1}
            </span>
          </button>
        );
      })}
    </div>
  );
}
