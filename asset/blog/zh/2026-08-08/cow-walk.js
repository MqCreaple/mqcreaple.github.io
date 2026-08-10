// Cow manifold walk: a small character walks along (approximate) geodesics
// on the cow surface. The camera follows from behind, aligned with the local
// tangent plane, so the surface looks locally flat like a ground plane.
//
// Controls: W/A/S/D to move along two perpendicular tangent directions
// (forward/back and strafe), horizontal drag to rotate the character, and a
// checkbox to toggle a wireframe view of the cow.
export default async function (scene, camera, canvas, initialView, helpers) {
    const { THREE, OBJLoader, mergeVertices } = helpers;

    const COW_SCALE = 56;         // cow length after scaling
    const CAPSULE_RADIUS = 0.09;
    const CAPSULE_LENGTH = 0.35;
    // Height of the capsule center above the surface, so that the south
    // pole of the bottom hemisphere rests exactly on the surface.
    const CHARACTER_HEIGHT = CAPSULE_LENGTH / 2 + CAPSULE_RADIUS;
    const SPEED = 1.0;            // movement speed (units per second)
    const RAY_OFFSET = CHARACTER_HEIGHT * 2 + 0.3;

    // -----------------------------------------------------------------
    // 1. Cow mesh (large, centered, smooth normals for walking)
    // -----------------------------------------------------------------
    const cowGeometry = await loadCowGeometry(THREE, OBJLoader, mergeVertices, COW_SCALE);
    const cowMaterial = new THREE.MeshPhongMaterial({
        color: 0x5eead4,
        side: THREE.DoubleSide,
    });
    const cow = new THREE.Mesh(cowGeometry, cowMaterial);
    scene.add(cow);

    // -----------------------------------------------------------------
    // 2. Character: an upright capsule standing on the surface. Its long
    //    axis follows the group +Y, which is aligned with the surface
    //    normal each frame, so the south pole rests on the surface.
    // -----------------------------------------------------------------
    const character = new THREE.Group();
    const capsule = new THREE.Mesh(
        new THREE.CapsuleGeometry(CAPSULE_RADIUS, CAPSULE_LENGTH, 4, 12),
        new THREE.MeshPhongMaterial({ color: 0xf59e0b }),
    );
    character.add(capsule);
    scene.add(character);

    // -----------------------------------------------------------------
    // 3. Follow camera; horizontal drag rotates the character.
    // -----------------------------------------------------------------
    const controls = helpers.cameraControls.createPlayerFollowing(character, canvas);
    // A small near plane keeps cow surfaces close to the camera (between the
    // camera and the player) from being clipped; the far plane covers the
    // large cow.
    camera.near = 0.02;
    camera.far = 200;
    camera.updateProjectionMatrix();
    controls.distance = 2.4;
    controls.height = 0.9;
    controls.lookAhead = 0.7;

    // -----------------------------------------------------------------
    // 4. Input: WASD movement
    // -----------------------------------------------------------------
    const keys = new Set();
    const onKeyDown = (event) => keys.add(event.code);
    const onKeyUp = (event) => keys.delete(event.code);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // -----------------------------------------------------------------
    // 5. Walking on the surface
    // -----------------------------------------------------------------
    const raycaster = new THREE.Raycaster();

    helpers.onFrame((dt) => {
        dt = Math.min(dt, 0.05);

        const forward = character.getWorldDirection(new THREE.Vector3());
        const up = character.up;
        const right = new THREE.Vector3().crossVectors(forward, up).normalize();

        const move = new THREE.Vector3();
        if (keys.has('KeyW')) move.add(forward);
        if (keys.has('KeyS')) move.sub(forward);
        if (keys.has('KeyD')) move.add(right);
        if (keys.has('KeyA')) move.sub(right);

        if (move.lengthSq() > 0) {
            move.normalize().multiplyScalar(SPEED * dt);
            stepOnSurface(move);
        }
    });

    // Optional wireframe view of the cow (switches the solid for lines).
    helpers.addControlWidget({
        type: 'checkbox',
        label: 'Wireframe',
        checked: false,
        action: (checked) => {
            cowMaterial.wireframe = checked;
        },
    });

    // Reset puts the character back on the top of the cow.
    helpers.addControlWidget({
        type: 'button',
        label: 'Reset Position',
        action: () => resetPosition(),
    });

    resetPosition();

    // ---------------------------------------------------------------
    function resetPosition() {
        const origin = new THREE.Vector3(0, 40, 0);
        const direction = new THREE.Vector3(0, -1, 0);
        raycaster.set(origin, direction);
        const hits = raycaster.intersectObject(cow, false);
        if (hits.length === 0) return;

        const normal = new THREE.Vector3();
        smoothNormalAt(hits[0], cowGeometry, normal);

        character.up.copy(normal);
        character.position.copy(hits[0].point).addScaledVector(normal, CHARACTER_HEIGHT);

        // Initial heading: +X projected onto the tangent plane.
        const heading = new THREE.Vector3(1, 0, 0)
            .addScaledVector(normal, -new THREE.Vector3(1, 0, 0).dot(normal));
        if (heading.lengthSq() > 1e-8) {
            heading.normalize();
            character.lookAt(character.position.clone().add(heading));
        }

        // Snap the follow camera behind the character immediately.
        controls.update(1);
    }

    // Move one small step along the tangent plane, then project the new
    // position back onto the cow surface (a discrete geodesic step).
    function stepOnSurface(move) {
        const candidate = character.position.clone().add(move);
        const up = character.up;

        const fromAbove = raycastFrom(
            candidate.clone().addScaledVector(up, RAY_OFFSET),
            up.clone().negate(),
        );
        const fromBelow = raycastFrom(
            candidate.clone().addScaledVector(up, -RAY_OFFSET),
            up,
        );

        let hit = null;
        if (fromAbove && fromBelow) {
            hit = fromAbove.distance <= fromBelow.distance ? fromAbove : fromBelow;
        } else {
            hit = fromAbove || fromBelow;
        }
        if (!hit) return;

        const normal = new THREE.Vector3();
        smoothNormalAt(hit, cowGeometry, normal);

        character.up.copy(normal);
        character.position.copy(hit.point).addScaledVector(normal, CHARACTER_HEIGHT);

        // Keep the current heading in the new tangent plane.
        const forward = character.getWorldDirection(new THREE.Vector3());
        forward.addScaledVector(normal, -forward.dot(normal));
        if (forward.lengthSq() > 1e-8) {
            forward.normalize();
            character.lookAt(character.position.clone().add(forward));
        }
    }

    function raycastFrom(origin, direction) {
        raycaster.set(origin, direction);
        const hits = raycaster.intersectObject(cow, false);
        return hits.length > 0 ? hits[0] : null;
    }

    // Interpolates the smooth vertex normal at a raycast hit point (barycentric).
    function smoothNormalAt(intersection, geometry, out) {
        const pos = geometry.attributes.position;
        const norm = geometry.attributes.normal;
        const ia = intersection.face.a;
        const ib = intersection.face.b;
        const ic = intersection.face.c;

        const va = new THREE.Vector3().fromBufferAttribute(pos, ia);
        const vb = new THREE.Vector3().fromBufferAttribute(pos, ib);
        const vc = new THREE.Vector3().fromBufferAttribute(pos, ic);

        const v0 = vb.sub(va);
        const v1 = vc.sub(va);
        const v2 = intersection.point.clone().sub(va);

        const d00 = v0.dot(v0);
        const d01 = v0.dot(v1);
        const d11 = v1.dot(v1);
        const d20 = v2.dot(v0);
        const d21 = v2.dot(v1);
        const denom = d00 * d11 - d01 * d01;

        const v = (d11 * d20 - d01 * d21) / denom;
        const w = (d00 * d21 - d01 * d20) / denom;
        const u = 1 - v - w;

        const na = new THREE.Vector3().fromBufferAttribute(norm, ia);
        const nb = new THREE.Vector3().fromBufferAttribute(norm, ib);
        const nc = new THREE.Vector3().fromBufferAttribute(norm, ic);

        return out
            .set(0, 0, 0)
            .addScaledVector(na, u)
            .addScaledVector(nb, v)
            .addScaledVector(nc, w)
            .normalize();
    }
}

// Loads cow.obj, merges duplicate vertices, computes smooth normals, then
// centers the mesh and scales it so its maximum dimension equals `scale`.
async function loadCowGeometry(THREE, OBJLoader, mergeVertices, scale) {
    const response = await fetch('/blog/zh/2026-08-08/cow.obj');
    if (!response.ok) throw new Error(`Failed to fetch cow.obj (${response.status})`);

    const object = new OBJLoader().parse(await response.text());
    const meshes = [];
    object.traverse((child) => {
        if (child.isMesh) meshes.push(child);
    });
    if (meshes.length === 0) throw new Error('No mesh found in cow.obj');

    let geometry = meshes[0].geometry;
    geometry.deleteAttribute('normal');
    geometry = mergeVertices(geometry, 1e-4);
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();

    const center = new THREE.Vector3();
    geometry.boundingBox.getCenter(center);
    geometry.translate(-center.x, -center.y, -center.z);

    const size = geometry.boundingBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    geometry.scale(scale / maxDim, scale / maxDim, scale / maxDim);
    return geometry;
}
