// Cow manifold walk with a recorded geodesic trajectory.
//
// The player moves along (approximate) geodesics on the cow surface, and the
// builder follows from behind with the camera aligned to the local tangent
// plane. Every SAMPLE_INTERVAL units of path length, the scene records a
// sample point, draws a capped velocity arrow, and adds a translucent tangent
// plane there.
//
// Controls: W/A/S/D to move, horizontal drag to rotate, Space or the Toggle
// Camera button switches between the follow camera and a free orbit camera,
// plus toggles for the trajectory and sample markers.
import { loadCowGeometry } from '../../shared/cow-loader.js';

export default async function (scene, camera, canvas, initialView, helpers) {
    const { THREE, OBJLoader, mergeVertices } = helpers;

    const COW_SCALE = 56;         // cow length after scaling
    const CAPSULE_RADIUS = 0.09;
    const CAPSULE_LENGTH = 0.35;
    const CHARACTER_HEIGHT = CAPSULE_LENGTH / 2 + CAPSULE_RADIUS;
    const SPEED = 1.0;            // movement speed (units per second)
    const RAY_OFFSET = CHARACTER_HEIGHT * 2 + 0.3;

    const SAMPLE_INTERVAL = 1.0;
    const SAMPLE_PLANE_SIZE = 1.15;
    const ARROW_SCALE = 0.45;
    const MAX_ARROW_LENGTH = 0.45;
    const MIN_ARROW_LENGTH = 0.01;
    const VISUAL_OFFSET = 0.03;

    const vectorColor = new THREE.Color(helpers.themeColors.accent);
    const sampleColor = new THREE.Color(helpers.themeColors.error);

    // -----------------------------------------------------------------
    // 1. Cow mesh (large, centered, smooth normals for walking)
    // -----------------------------------------------------------------
    const cowGeometry = await loadCowGeometry(THREE, OBJLoader, mergeVertices, COW_SCALE);
    const cowMaterial = new THREE.MeshPhongMaterial({
        color: helpers.themeColors.accentSoft,
        side: THREE.DoubleSide,
    });
    const cow = new THREE.Mesh(cowGeometry, cowMaterial);
    scene.add(cow);

    // -----------------------------------------------------------------
    // 2. Recorded path and distance-based tangent-space samples
    // -----------------------------------------------------------------
    const MAX_TRAJECTORY_POINTS = 4096;
    const trajectoryRing = new Float32Array(MAX_TRAJECTORY_POINTS * 3);
    const trajectoryPositionAttribute = new THREE.Float32BufferAttribute(
        new Float32Array(MAX_TRAJECTORY_POINTS * 3),
        3,
    );
    const trajectoryGeometry = new THREE.BufferGeometry();
    trajectoryGeometry.setAttribute('position', trajectoryPositionAttribute);
    trajectoryGeometry.setDrawRange(0, 0);
    const trajectoryLine = new THREE.Line(
        trajectoryGeometry,
        new THREE.LineBasicMaterial({ color: helpers.themeColors.accent }),
    );
    trajectoryLine.frustumCulled = false;
    scene.add(trajectoryLine);

    const samplesGroup = new THREE.Group();
    scene.add(samplesGroup);

    const markerGeometry = new THREE.SphereGeometry(0.045, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: sampleColor });
    const planeGeometry = new THREE.PlaneGeometry(SAMPLE_PLANE_SIZE, SAMPLE_PLANE_SIZE);
    const planeMaterial = new THREE.MeshBasicMaterial({
        color: vectorColor,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
        depthWrite: false,
    });

    let distanceSinceLastSample = 0;
    let trajectoryStart = 0;
    let trajectoryCount = 0;
    let trajectoryNext = 0;

    function syncTrajectoryBuffer() {
        const destination = trajectoryPositionAttribute.array;
        for (let i = 0; i < trajectoryCount; i++) {
            const source = (trajectoryStart + i) % MAX_TRAJECTORY_POINTS;
            const sourceOffset = source * 3;
            const destinationOffset = i * 3;
            destination[destinationOffset] = trajectoryRing[sourceOffset];
            destination[destinationOffset + 1] = trajectoryRing[sourceOffset + 1];
            destination[destinationOffset + 2] = trajectoryRing[sourceOffset + 2];
        }
        trajectoryPositionAttribute.clearUpdateRanges();
        if (trajectoryCount > 0) {
            trajectoryPositionAttribute.addUpdateRange(0, trajectoryCount * 3);
        }
        trajectoryPositionAttribute.needsUpdate = true;
        trajectoryGeometry.setDrawRange(0, trajectoryCount);
    }

    function appendTrajectoryPoint(point) {
        const offset = trajectoryNext * 3;
        trajectoryRing[offset] = point.x;
        trajectoryRing[offset + 1] = point.y;
        trajectoryRing[offset + 2] = point.z;

        trajectoryNext = (trajectoryNext + 1) % MAX_TRAJECTORY_POINTS;
        if (trajectoryCount < MAX_TRAJECTORY_POINTS) {
            trajectoryCount++;
        } else {
            trajectoryStart = (trajectoryStart + 1) % MAX_TRAJECTORY_POINTS;
        }
        syncTrajectoryBuffer();
    }

    function clearTrajectory() {
        trajectoryStart = 0;
        trajectoryCount = 0;
        trajectoryNext = 0;
        trajectoryGeometry.setDrawRange(0, 0);
        trajectoryPositionAttribute.needsUpdate = true;
        while (samplesGroup.children.length > 0) {
            samplesGroup.remove(samplesGroup.children[0]);
        }
        distanceSinceLastSample = 0;
    }

    function addSample(surfacePoint, normal, velocityDirection) {
        const direction = velocityDirection.clone().normalize();
        if (direction.lengthSq() < 1e-12) return;

        const origin = surfacePoint.clone().addScaledVector(normal, VISUAL_OFFSET);
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.copy(origin);
        samplesGroup.add(marker);

        const tangentPlane = new THREE.Mesh(planeGeometry, planeMaterial);
        tangentPlane.position.copy(origin);
        tangentPlane.lookAt(origin.clone().add(normal));
        samplesGroup.add(tangentPlane);

        const length = Math.min(direction.length() * ARROW_SCALE, MAX_ARROW_LENGTH);
        if (length < MIN_ARROW_LENGTH) return;
        samplesGroup.add(
            new THREE.ArrowHelper(
                direction,
                origin,
                length,
                sampleColor,
                length * 0.35,
                length * 0.22,
            ),
        );
    }

    function addPathPoint(surfacePoint, normal) {
        appendTrajectoryPoint(
            surfacePoint.clone().addScaledVector(normal, VISUAL_OFFSET),
        );
    }

    function recordMovement(
        stepDistance,
        previousSurfacePoint,
        newSurfacePoint,
        previousNormal,
        newNormal,
        velocityDirection,
    ) {
        addPathPoint(newSurfacePoint, newNormal);
        distanceSinceLastSample += stepDistance;
        if (distanceSinceLastSample < SAMPLE_INTERVAL || stepDistance <= 0) return;

        const overshoot = distanceSinceLastSample - SAMPLE_INTERVAL;
        const t = Math.min(Math.max(1 - overshoot / stepDistance, 0), 1);
        const samplePoint = previousSurfacePoint.clone().lerp(newSurfacePoint, t);
        const sampleNormal = previousNormal.clone().lerp(newNormal, t).normalize();
        addSample(samplePoint, sampleNormal, velocityDirection);
        distanceSinceLastSample -= SAMPLE_INTERVAL;
    }

    // -----------------------------------------------------------------
    // 3. Character: an upright capsule standing on the surface
    // -----------------------------------------------------------------
    const character = new THREE.Group();
    const capsule = new THREE.Mesh(
        new THREE.CapsuleGeometry(CAPSULE_RADIUS, CAPSULE_LENGTH, 4, 12),
        new THREE.MeshPhongMaterial({ color: 0xf59e0b }),
    );
    character.add(capsule);
    scene.add(character);

    // -----------------------------------------------------------------
    // 4. Camera modes: follow the player, or orbit the cow freely
    // -----------------------------------------------------------------
    camera.near = 0.02;
    camera.far = 200;
    camera.updateProjectionMatrix();

    let cameraMode = 'follow';
    let playerControls = null;
    let orbitControls = null;

    function createPlayerFollowingCamera() {
        const controls = helpers.cameraControls.createPlayerFollowing(character, canvas);
        controls.distance = 2.4;
        controls.height = 0.9;
        controls.lookAhead = 0.7;
        return controls;
    }

    function activateFollowCamera() {
        if (cameraMode === 'follow' && playerControls) return;
        if (orbitControls) {
            orbitControls.dispose();
            orbitControls = null;
        }
        playerControls = createPlayerFollowingCamera();
        cameraMode = 'follow';
    }

    function activateFreeCamera() {
        if (cameraMode === 'free' && orbitControls) return;
        if (playerControls) {
            playerControls.dispose();
            playerControls = null;
        }
        orbitControls = helpers.cameraControls.createOrbit();
        cameraMode = 'free';
    }

    function toggleCamera() {
        if (cameraMode === 'follow') {
            activateFreeCamera();
        } else {
            activateFollowCamera();
        }
    }

    activateFollowCamera();

    // -----------------------------------------------------------------
    // 5. Input and frame loop
    // -----------------------------------------------------------------
    const keys = new Set();
    const onKeyDown = (event) => {
        if (event.code === 'Space') {
            event.preventDefault();
            if (!event.repeat) toggleCamera();
            return;
        }
        keys.add(event.code);
    };
    const onKeyUp = (event) => {
        if (event.code === 'Space') return;
        keys.delete(event.code);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

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
            const previousSurfacePoint = getSurfacePoint();
            const previousNormal = character.up.clone();
            if (stepOnSurface(move)) {
                const newSurfacePoint = getSurfacePoint();
                const newNormal = character.up.clone();
                const stepDistance = previousSurfacePoint.distanceTo(newSurfacePoint);
                recordMovement(
                    stepDistance,
                    previousSurfacePoint,
                    newSurfacePoint,
                    previousNormal,
                    newNormal,
                    move,
                );
            }
        }
    });

    helpers.addControlWidget({
        type: 'checkbox',
        label: 'Trajectory',
        checked: true,
        action: (checked) => {
            trajectoryLine.visible = checked;
        },
    });
    helpers.addControlWidget({
        type: 'checkbox',
        label: 'Samples',
        checked: true,
        action: (checked) => {
            samplesGroup.visible = checked;
        },
    });
    helpers.addControlWidget({
        type: 'checkbox',
        label: 'Wireframe',
        checked: false,
        action: (checked) => {
            cowMaterial.wireframe = checked;
        },
    });
    helpers.addControlWidget({
        type: 'button',
        label: 'Toggle Camera',
        action: () => toggleCamera(),
    });
    helpers.addControlWidget({
        type: 'button',
        label: 'Reset Position',
        action: () => resetPosition(),
    });

    resetPosition();

    function getSurfacePoint() {
        return character.position
            .clone()
            .addScaledVector(character.up, -CHARACTER_HEIGHT);
    }

    function resetPosition() {
        const origin = new THREE.Vector3(0, 40, 0);
        const direction = new THREE.Vector3(0, -1, 0);
        raycaster.set(origin, direction);
        const hits = raycaster.intersectObject(cow, false);
        if (hits.length === 0) return;

        clearTrajectory();

        const normal = new THREE.Vector3();
        smoothNormalAt(hits[0], cowGeometry, normal);

        character.up.copy(normal);
        character.position.copy(hits[0].point).addScaledVector(normal, CHARACTER_HEIGHT);

        const heading = new THREE.Vector3(1, 0, 0)
            .addScaledVector(normal, -new THREE.Vector3(1, 0, 0).dot(normal));
        if (heading.lengthSq() > 1e-8) {
            heading.normalize();
            character.lookAt(character.position.clone().add(heading));
        }

        const surfacePoint = getSurfacePoint();
        addPathPoint(surfacePoint, normal);
        addSample(surfacePoint, normal, heading);
        distanceSinceLastSample = 0;

        activateFollowCamera();
        playerControls.update(1);
    }

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
        if (!hit) return false;

        const normal = new THREE.Vector3();
        smoothNormalAt(hit, cowGeometry, normal);

        character.up.copy(normal);
        character.position.copy(hit.point).addScaledVector(normal, CHARACTER_HEIGHT);

        const forward = character.getWorldDirection(new THREE.Vector3());
        forward.addScaledVector(normal, -forward.dot(normal));
        if (forward.lengthSq() > 1e-8) {
            forward.normalize();
            character.lookAt(character.position.clone().add(forward));
        }
        return true;
    }

    function raycastFrom(origin, direction) {
        raycaster.set(origin, direction);
        const hits = raycaster.intersectObject(cow, false);
        return hits.length > 0 ? hits[0] : null;
    }

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
