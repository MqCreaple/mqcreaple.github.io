import { loadObjGeometry, normalizeGeometry } from './obj-loader.js';

// Loads cow.obj, merges duplicate vertices, computes smooth vertex normals,
// then centers and scales the mesh so its maximum dimension equals `scale`.
export async function loadCowGeometry(THREE, OBJLoader, mergeVertices, scale) {
  const geometry = await loadObjGeometry('/3d/cow.obj', OBJLoader, { mergeVertices });
  return normalizeGeometry(geometry, THREE, { targetSize: scale });
}
