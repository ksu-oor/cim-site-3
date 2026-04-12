import { Chunk } from './chunk';
import { BlockType, MeshData } from './types';
import { CHUNK_SIZE, CHUNK_HEIGHT, BLOCK_COLORS, TRANSPARENT_BLOCKS } from './constants';

// Face directions: [axis, positive?, nx, ny, nz]
const FACES: [number, boolean, number, number, number][] = [
  [0, true,  1, 0, 0],  // +X
  [0, false, -1, 0, 0], // -X
  [1, true,  0, 1, 0],  // +Y
  [1, false, 0, -1, 0], // -Y
  [2, true,  0, 0, 1],  // +Z
  [2, false, 0, 0, -1], // -Z
];

function shouldRenderFace(block: BlockType, neighbor: BlockType): boolean {
  if (block === BlockType.AIR) return false;
  if (neighbor === BlockType.AIR) return true;
  if (TRANSPARENT_BLOCKS.has(neighbor) && !TRANSPARENT_BLOCKS.has(block)) return true;
  return false;
}

export function meshChunk(chunk: Chunk, getNeighborBlock?: (x: number, y: number, z: number) => BlockType): MeshData {
  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  let vertexCount = 0;

  // For each face direction, use greedy meshing
  for (const [axis, positive, nx, ny, nz] of FACES) {
    // Determine the two axes perpendicular to the face normal
    const u = (axis + 1) % 3;
    const v = (axis + 2) % 3;

    const dims = [CHUNK_SIZE, CHUNK_HEIGHT, CHUNK_SIZE];
    const uSize = dims[u];
    const vSize = dims[v];

    // Sweep across slices along the face axis
    for (let d = 0; d < dims[axis]; d++) {
      // Build a 2D mask of block types that need a face on this slice
      const mask = new Int16Array(uSize * vSize);

      for (let j = 0; j < vSize; j++) {
        for (let i = 0; i < uSize; i++) {
          const pos = [0, 0, 0];
          pos[axis] = d;
          pos[u] = i;
          pos[v] = j;

          const block = chunk.get(pos[0], pos[1], pos[2]);

          // Get neighbor block
          const nPos = [pos[0] + nx, pos[1] + ny, pos[2] + nz];
          let neighbor: BlockType;
          if (nPos[0] >= 0 && nPos[0] < CHUNK_SIZE &&
              nPos[1] >= 0 && nPos[1] < CHUNK_HEIGHT &&
              nPos[2] >= 0 && nPos[2] < CHUNK_SIZE) {
            neighbor = chunk.get(nPos[0], nPos[1], nPos[2]);
          } else if (getNeighborBlock) {
            neighbor = getNeighborBlock(nPos[0], nPos[1], nPos[2]);
          } else {
            neighbor = BlockType.AIR;
          }

          if (shouldRenderFace(block, neighbor)) {
            mask[i + j * uSize] = block;
          }
        }
      }

      // Greedy merge the mask into quads
      for (let j = 0; j < vSize; j++) {
        for (let i = 0; i < uSize;) {
          const blockType = mask[i + j * uSize];
          if (blockType === 0) { i++; continue; }

          // Find width
          let w = 1;
          while (i + w < uSize && mask[(i + w) + j * uSize] === blockType) w++;

          // Find height
          let h = 1;
          let done = false;
          while (j + h < vSize && !done) {
            for (let k = 0; k < w; k++) {
              if (mask[(i + k) + (j + h) * uSize] !== blockType) {
                done = true;
                break;
              }
            }
            if (!done) h++;
          }

          // Clear mask
          for (let dj = 0; dj < h; dj++) {
            for (let di = 0; di < w; di++) {
              mask[(i + di) + (j + dj) * uSize] = 0;
            }
          }

          // Emit quad
          const color = BLOCK_COLORS[blockType] || [1, 0, 1];
          // Apply simple face shading
          let shade = 1.0;
          if (ny === -1) shade = 0.5;      // bottom face
          else if (nx !== 0) shade = 0.7;   // side X
          else if (nz !== 0) shade = 0.8;   // side Z
          else if (ny === 1) shade = 1.0;    // top

          const shadedColor: [number, number, number] = [
            color[0] * shade,
            color[1] * shade,
            color[2] * shade,
          ];

          // Build 4 corners of the quad
          const du = [0, 0, 0];
          const dv = [0, 0, 0];
          du[u] = 1;
          dv[v] = 1;

          const base = [0, 0, 0];
          base[axis] = positive ? d + 1 : d;
          base[u] = i;
          base[v] = j;

          const corners = [
            [base[0], base[1], base[2]],
            [base[0] + du[0] * w, base[1] + du[1] * w, base[2] + du[2] * w],
            [base[0] + du[0] * w + dv[0] * h, base[1] + du[1] * w + dv[1] * h, base[2] + du[2] * w + dv[2] * h],
            [base[0] + dv[0] * h, base[1] + dv[1] * h, base[2] + dv[2] * h],
          ];

          for (const c of corners) {
            positions.push(c[0], c[1], c[2]);
            normals.push(nx, ny, nz);
            colors.push(shadedColor[0], shadedColor[1], shadedColor[2]);
          }

          // Two triangles, wind correctly based on face direction
          if (positive) {
            indices.push(vertexCount, vertexCount + 1, vertexCount + 2);
            indices.push(vertexCount, vertexCount + 2, vertexCount + 3);
          } else {
            indices.push(vertexCount, vertexCount + 2, vertexCount + 1);
            indices.push(vertexCount, vertexCount + 3, vertexCount + 2);
          }
          vertexCount += 4;

          i += w;
        }
      }
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint32Array(indices),
    colors: new Float32Array(colors),
  };
}
