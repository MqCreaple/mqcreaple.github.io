// Shared OBJ loading helpers for the interactive Three.js figures.
//
// These files are served as static public modules, so they never import bare
// package names. THREE and the loader/merge helpers are passed in by each
// scene script instead.

export async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url} (${response.status})`);
  return response.text();
}

export function parseObjGeometry(text, OBJLoader, { mergeVertices, mergeGeometries, tolerance = 1e-4 } = {}) {
  const object = new OBJLoader().parse(text);
  const meshes = [];
  object.traverse((child) => {
    if (child.isMesh) meshes.push(child);
  });
  if (meshes.length === 0) throw new Error('No mesh found in OBJ');

  let geometry;
  if (meshes.length === 1) {
    geometry = meshes[0].geometry;
  } else {
    if (!mergeGeometries) {
      throw new Error(`OBJ contains ${meshes.length} meshes; pass mergeGeometries`);
    }
    geometry = mergeGeometries(meshes.map((mesh) => mesh.geometry), false);
  }

  geometry.deleteAttribute('normal');
  if (mergeVertices) geometry = mergeVertices(geometry, tolerance);
  geometry.computeVertexNormals();
  return geometry;
}

export async function loadObjGeometry(url, OBJLoader, options = {}) {
  const text = await fetchText(url);
  return parseObjGeometry(text, OBJLoader, options);
}

// Centers the geometry and optionally scales its maximum dimension to a
// target size (or by an explicit factor).
export function normalizeGeometry(geometry, THREE, { targetSize, scale, center = true } = {}) {
  geometry.computeBoundingBox();
  if (center) geometry.center();

  if (targetSize === undefined && scale === undefined) return geometry;

  geometry.computeBoundingBox();
  const size = geometry.boundingBox.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const factor = targetSize !== undefined ? targetSize / maxDim : scale;
  geometry.scale(factor, factor, factor);
  geometry.computeBoundingBox();
  return geometry;
}
