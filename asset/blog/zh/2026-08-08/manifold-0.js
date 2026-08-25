// Manifold examples: sphere, torus, Moebius strip, and cow.
//
// Renders four compact 2D manifolds side by side: the body uses a lighter
// teal with smooth double-sided shading, and a wireframe overlay in the
// original teal color outlines the mesh. Each model is centered, normalized
// to a similar maximum dimension, and placed with equal spacing along x.
import { loadObjGeometry, normalizeGeometry } from '../../shared/obj-loader.js';

export default async function (scene, camera, canvas, initialView, helpers) {
    const cameraControls = helpers.cameraControls.createOrbit();
    const { THREE, OBJLoader, mergeVertices, mergeGeometries } = helpers;

    const models = [
        { url: '/3d/sphere.obj' },
        { url: '/3d/torus.obj' },
        { url: '/3d/mobius.obj' },
        { url: '/3d/cow.obj', scale: 1.35 },
    ];

    // Lighter teal body, double-sided (the Moebius strip is one-sided in the
    // literal sense), smooth shading.
    const bodyMaterial = new THREE.MeshPhongMaterial({
        color: helpers.themeColors.accentSoft,
        side: THREE.DoubleSide,
        flatShading: false,
        shininess: 40,
    });

    // Wireframe overlay in the original teal color.
    const wireframeMaterial = new THREE.LineBasicMaterial({ color: helpers.themeColors.text });
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
            const geometry = await loadObjGeometry(model.url, OBJLoader, {
                mergeVertices,
                mergeGeometries,
            });
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
    normalizeGeometry(mesh.geometry, THREE, { targetSize: TARGET_SIZE * sizeScale });
    mesh.position.set((index - 1.5) * SPACING, 0, 0);
}
