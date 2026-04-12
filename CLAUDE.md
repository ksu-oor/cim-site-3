@AGENTS.md

# Amarillo - Voxel World Builder

CIM showcase site: a 3D voxel world with first-person exploration and an AI chat assistant that builds structures via natural language. Think Minecraft meets ChatGPT.

## Stack

- **Next.js 16** (App Router) / **React 19** / **TypeScript 5**
- **Three.js** via `@react-three/fiber` (r3f) + `@react-three/drei`
- **Zustand 5** for world state
- **AI SDK v6** (`ai`, `@ai-sdk/openai`, `@ai-sdk/react`) with tool calling
- **Tailwind CSS v4** / **Zod v4**
- **Immer** / **simplex-noise** for terrain generation

## Architecture

```
src/
  app/
    page.tsx             # Main page — client component, manages selected block + chat state
    layout.tsx           # Root layout
    api/chat/route.ts    # POST endpoint — streams AI responses with tool calls (gpt-4o)
  components/
    canvas/
      VoxelCanvas.tsx    # Three.js Canvas wrapper, pointer-lock FPS controls, DDA raycaster
      WorldRenderer.tsx  # Iterates chunks, renders ChunkMesh for each
      ChunkMesh.tsx      # Greedy-meshed geometry per chunk
      BlockPreview.tsx   # Wireframe highlight for targeted block
    ui/
      ChatPanel.tsx      # Sliding chat panel, processes tool results into world mutations
      HUD.tsx            # Crosshair + position display
      BlockPalette.tsx   # Bottom block selector bar (1-9 keys)
  lib/
    voxel/
      world-store.ts     # Zustand store — chunks Map, version counter, get/set/batch block ops
      chunk.ts           # Chunk class — flat Uint8Array (CHUNK_SIZE x CHUNK_HEIGHT x CHUNK_SIZE)
      types.ts           # BlockType enum (AIR=0..LIGHT=9), ChunkData, MeshData, etc.
      constants.ts       # CHUNK_SIZE=32, CHUNK_HEIGHT=64, SEA_LEVEL=20, RENDER_DISTANCE=3, colors
      mesher.ts          # Greedy meshing algorithm — builds positions/normals/indices/colors
      serializer.ts      # World save/load (if implemented)
      terrain-generator.ts  # Simplex-noise terrain gen
    tools/
      place-blocks.ts    # AI tool — place up to 500 blocks at absolute coords
      generate-structure.ts  # AI tool — build structure from base position + offsets (up to 2000 blocks)
      remove-blocks.ts   # AI tool — clear rectangular region to AIR
```

## Key Patterns

- **Chunk system**: World is divided into 32x64x32 chunks keyed by `"cx,cz"`. Blocks stored in flat `Uint8Array`.
- **Version-based re-renders**: `world-store.version` counter bumps on every mutation; components select `version` to trigger re-render without deep-comparing chunk data.
- **Dynamic imports for Three.js**: `VoxelCanvas` is loaded with `next/dynamic` + `ssr: false` to avoid SSR issues with WebGL.
- **Module-level refs for raycast**: `targetBlockRef` and `placePositionRef` live outside React to avoid per-frame setState.
- **AI tool execution**: Tools return block data from the server; `ChatPanel` processes tool results client-side by calling `useWorldStore.getState().setBlocks()`.
- **Keyboard shortcuts**: WASD movement, Space/Shift for up/down, 1-9 for block selection, T to open chat, Escape to close, left-click break, right-click place.
- **BlockType enum**: Numeric enum (0-9) used as array indices in chunk data and color lookups.

## Commands

```bash
npm run dev    # Start dev server
npm run build  # Production build
npm run lint   # ESLint
```

## Environment

- `OPENAI_API_KEY` — required for the chat AI
- `OPENAI_BASE_URL` — optional, override OpenAI endpoint
- Path alias: `@/*` maps to `./src/*`
