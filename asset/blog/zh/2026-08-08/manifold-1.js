// Counterexamples to manifolds, loaded from OBJ assets:
//   cross.obj - two perpendicular planes intersecting along their common
//               midline (the intersection line is non-manifold)
//   ring.obj  - a flat cylindrical ring whose thickness varies as
//               k*sin(theta/2), pinching to a point P at theta = 0, where two
//               triangles join at a single point (a non-manifold vertex)
// The last faces of each OBJ (marked by a "# red-faces: N" header) are the
// triangles adjacent to the non-manifold features and are highlighted red.
//
// Controls: drag to orbit, scroll to zoom, and a checkbox to toggle the
// wireframe overlay (same as manifold-0.js).
export default async function (scene, camera, canvas, initialView, helpers) {
    const { THREE, OBJLoader } = helpers;
    const cameraControls = helpers.cameraControls.createOrbit();

    const bodyMaterial = new THREE.MeshPhongMaterial({
        vertexColors: true,
        color: 0xffffff,
        side: THREE.DoubleSide,
        flatShading: false,
        shininess: 40,
    });

    // Wireframe overlay copied from manifold-0.js.
    const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x141414 });
    const wireframeOverlays = [];

    const addMesh = (geometry, x, rotationY = 0) => {
        const mesh = new THREE.Mesh(geometry, bodyMaterial);
        const overlay = new THREE.LineSegments(
            new THREE.WireframeGeometry(mesh.geometry),
            wireframeMaterial,
        );
        mesh.add(overlay);
        wireframeOverlays.push(overlay);
        mesh.position.x = x;
        mesh.rotation.y = rotationY;
        scene.add(mesh);
        return mesh;
    };

    // Load both counterexample meshes. The ring is rotated so its pinch point
    // P (with the red triangles) faces the camera.
    const results = await Promise.allSettled([
        loadColoredObj('/blog/zh/2026-08-08/cross.obj', THREE, OBJLoader).then(
            (geometry) => addMesh(geometry, -1.6),
        ),
        loadColoredObj('/blog/zh/2026-08-08/ring.obj', THREE, OBJLoader).then(
            (geometry) => addMesh(geometry, 1.6, -Math.PI / 2),
        ),
    ]);
    for (const result of results) {
        if (result.status === 'rejected') {
            console.error('manifold-1: failed to load a model', result.reason);
        }
    }

    // Orbit camera framing both objects from an elevated front view.
    const home = new THREE.Vector3(0, 0.8, 2.8);
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
}

// Loads an OBJ and colors its faces: the last `# red-faces: N` faces (per the
// OBJ header) are red (highlighting the non-manifold features), the rest are
// the base teal.
async function loadColoredObj(url, THREE, OBJLoader) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url} (${response.status})`);
    const text = await response.text();

    const redMatch = text.match(/^#\s*red-faces:\s*(\d+)\s*$/m);
    const redCount = redMatch ? parseInt(redMatch[1], 10) : 0;

    const object = new OBJLoader().parse(text);
    const meshes = [];
    object.traverse((child) => {
        if (child.isMesh) meshes.push(child);
    });
    if (meshes.length === 0) throw new Error(`No mesh found in ${url}`);

    let geometry = meshes[0].geometry;
    geometry.deleteAttribute('normal');
    geometry.computeVertexNormals();

    const count = geometry.attributes.position.count;
    const triCount = count / 3;
    const base = new THREE.Color(0xaefae4);
    const red = new THREE.Color(0xef4444);
    const colors = new Float32Array(count * 3);
    const redStart = Math.max(0, triCount - redCount);
    for (let t = 0; t < triCount; t++) {
        const c = t >= redStart ? red : base;
        for (let k = 0; k < 3; k++) {
            const i = (t * 3 + k) * 3;
            colors[i] = c.r;
            colors[i + 1] = c.g;
            colors[i + 2] = c.b;
        }
    }
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return geometry;
}
