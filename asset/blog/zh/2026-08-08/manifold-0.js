// Manifold examples: sphere, torus, Moebius strip, and cow.
//
// Renders four compact 2D manifolds side by side: the body uses a lighter
// teal with smooth double-sided shading, and a wireframe overlay in the
// original teal color outlines the mesh. Each model is centered, normalized
// to a similar maximum dimension, and placed with equal spacing along x.
export default async function (scene, camera, canvas, initialView, helpers) {
    const cameraControls = helpers.cameraControls.createOrbit();
    const { THREE, OBJLoader, mergeVertices, mergeGeometries } = helpers;

    const models = [
        { url: '/blog/zh/2026-08-08/sphere.obj' },
        { url: '/blog/zh/2026-08-08/torus.obj' },
        { url: '/blog/zh/2026-08-08/mobius.obj' },
        { url: '/blog/zh/2026-08-08/cow.obj', scale: 1.35 },
    ];

    // Lighter teal body, double-sided (the Moebius strip is one-sided in the
    // literal sense), smooth shading.
    const bodyMaterial = new THREE.MeshPhongMaterial({
        color: 0xaefae4,
        side: THREE.DoubleSide,
        flatShading: false,
        shininess: 40,
    });

    // Wireframe overlay in the original teal color.
    const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x141414 });
    const wireframeOverlays = [];

    // Allow zooming in very close to the meshes.
    cameraControls.minDistance = 0.4;

    // Elevated front view that frames the whole row; Reset View restores it.
    const home = new THREE.Vector3(0, 1.2, 3.2);
    camera.position.copy(home);
    cameraControls.target.set(0, 0, 0);
    cameraControls.update();

    helpers.addControlWidget({
        type: 'button',
        label: 'Reset View',
        action: () => {
            camera.position.copy(home);
            cameraControls.target.set(0, 0, 0);
            cameraControls.update();
        },
    });

    helpers.addControlWidget({
        type: 'checkbox',
        label: 'Wireframe',
        checked: true,
        action: (checked) => {
            for (const overlay of wireframeOverlays) overlay.visible = checked;
        },
    });

    const results = await Promise.allSettled(
        models.map(async (model, index) => {
            const geometry = await loadModelGeometry(model.url, OBJLoader, mergeVertices, mergeGeometries);
            const mesh = new THREE.Mesh(geometry, bodyMaterial);
            placeModel(mesh, index, THREE, model.scale ?? 1);

            // Wireframe overlay shares the mesh transform (child of the mesh).
            const overlay = new THREE.LineSegments(
                new THREE.WireframeGeometry(mesh.geometry),
                wireframeMaterial,
            );
            mesh.add(overlay);
            wireframeOverlays.push(overlay);

            scene.add(mesh);
        }),
    );
    for (const result of results) {
        if (result.status === 'rejected') {
            console.error('manifold-0: failed to load model', result.reason);
        }
    }
}

// Normalize every model to the same maximum dimension and space their
// centers evenly.
const TARGET_SIZE = 1.0;
const SPACING = 1.6;

function placeModel(mesh, index, THREE, sizeScale = 1) {
    mesh.geometry.computeBoundingBox();
    const box = mesh.geometry.boundingBox;
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    const scale = (TARGET_SIZE * sizeScale) / Math.max(size.x, size.y, size.z);
    mesh.geometry.translate(-center.x, -center.y, -center.z);
    mesh.geometry.scale(scale, scale, scale);

    mesh.position.set((index - 1.5) * SPACING, 0, 0);
}

async function loadModelGeometry(url, OBJLoader, mergeVertices, mergeGeometries) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url} (${response.status})`);
    }

    const object = new OBJLoader().parse(await response.text());

    const meshes = [];
    object.traverse((child) => {
        if (child.isMesh) meshes.push(child);
    });
    if (meshes.length === 0) {
        throw new Error(`No mesh found in ${url}`);
    }

    let geometry;
    if (meshes.length === 1) {
        geometry = meshes[0].geometry;
    } else {
        geometry = mergeGeometries(meshes.map((m) => m.geometry), false);
    }

    // OBJLoader emits per-face duplicated vertices with per-face normals.
    // Drop them, re-index shared vertices, then recompute smooth normals.
    geometry.deleteAttribute('normal');
    geometry = mergeVertices(geometry, 1e-4);
    geometry.computeVertexNormals();
    return geometry;
}
