// Metric compatibility of parallel transport on the unit sphere.
//
// A draggable point p lies on the sphere. Its tangent plane contains a
// red/green orthonormal basis. As the point is dragged, both vectors are
// parallel transported along the great circle connecting the previous and
// current points. On S^2 the Levi-Civita parallel transport along a great
// circle is rotation about p_prev x p_current by the arc angle; this is an
// isometry of R^3, so it preserves lengths and angles exactly. A final
// tangent projection and Gram-Schmidt pass removes only floating-point drift.
//
// The dragged trajectory is retained in a fixed-size ring buffer. Points
// sampled every SNAPSHOT_INTERVAL units of spherical arc length receive a
// smaller copy of the transported tangent frame.
//
// Controls: drag near the point to move it, drag elsewhere to orbit,
// scroll to zoom, and buttons to reset the point or camera.
import { createPointerState, attachPointerDrag } from '../../shared/pointer-drag.js';

export default async function (scene, camera, canvas, initialView, helpers) {
    const { THREE } = helpers;
    const cameraControls = helpers.cameraControls.createOrbit();

    const SPHERE_RADIUS = 1;
    const PLANE_SIZE = 0.72;
    const ARROW_LENGTH = 0.48;
    const SNAPSHOT_ARROW_SCALE = 0.25;
    const SNAPSHOT_PLANE_SIZE = 0.34;
    const SNAPSHOT_INTERVAL = 0.45;
    const MAX_TRAJECTORY_POINTS = 4096;
    const TRAJECTORY_OFFSET = 0.012;

    const RED = 0xef4444;
    const GREEN = 0x22c55e;
    const MARKER_COLOR = 0x1f2937;

    // -----------------------------------------------------------------
    // Sphere
    // -----------------------------------------------------------------
    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(SPHERE_RADIUS, 96, 64),
        new THREE.MeshPhongMaterial({
            color: helpers.themeColors.accentSoft,
            side: THREE.DoubleSide,
        }),
    );
    scene.add(sphere);

    // -----------------------------------------------------------------
    // Recorded trajectory
    // -----------------------------------------------------------------
    const trajectoryRing = new Float32Array(MAX_TRAJECTORY_POINTS * 3);
    const trajectoryPositions = new THREE.Float32BufferAttribute(
        new Float32Array(MAX_TRAJECTORY_POINTS * 3),
        3,
    );
    const trajectoryGeometry = new THREE.BufferGeometry();
    trajectoryGeometry.setAttribute('position', trajectoryPositions);
    trajectoryGeometry.setDrawRange(0, 0);
    const trajectoryLine = new THREE.Line(
        trajectoryGeometry,
        new THREE.LineBasicMaterial({ color: helpers.themeColors.muted }),
    );
    trajectoryLine.frustumCulled = false;
    scene.add(trajectoryLine);

    let trajectoryStart = 0;
    let trajectoryCount = 0;
    let trajectoryNext = 0;

    function syncTrajectoryBuffer() {
        const destination = trajectoryPositions.array;
        for (let i = 0; i < trajectoryCount; i++) {
            const source = (trajectoryStart + i) % MAX_TRAJECTORY_POINTS;
            const sourceOffset = source * 3;
            const destinationOffset = i * 3;
            destination[destinationOffset] = trajectoryRing[sourceOffset];
            destination[destinationOffset + 1] = trajectoryRing[sourceOffset + 1];
            destination[destinationOffset + 2] = trajectoryRing[sourceOffset + 2];
        }
        trajectoryPositions.clearUpdateRanges();
        if (trajectoryCount > 0) {
            trajectoryPositions.addUpdateRange(0, trajectoryCount * 3);
        }
        trajectoryPositions.needsUpdate = true;
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
        trajectoryPositions.needsUpdate = true;
    }

    // -----------------------------------------------------------------
    // Current tangent frame
    // -----------------------------------------------------------------
    const tangentGroup = new THREE.Group();
    scene.add(tangentGroup);

    const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 20, 20),
        new THREE.MeshBasicMaterial({ color: MARKER_COLOR }),
    );
    tangentGroup.add(marker);

    const tangentPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE),
        new THREE.MeshBasicMaterial({
            color: 0xe2e8f0,
            transparent: true,
            opacity: 0.42,
            side: THREE.DoubleSide,
            depthWrite: false,
        }),
    );
    tangentGroup.add(tangentPlane);

    const redArrow = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(),
        ARROW_LENGTH,
        RED,
        ARROW_LENGTH * 0.28,
        ARROW_LENGTH * 0.16,
    );
    tangentGroup.add(redArrow);

    const greenArrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(),
        ARROW_LENGTH,
        GREEN,
        ARROW_LENGTH * 0.28,
        ARROW_LENGTH * 0.16,
    );
    tangentGroup.add(greenArrow);

    // -----------------------------------------------------------------
    // Snapshots
    // -----------------------------------------------------------------
    const snapshotsGroup = new THREE.Group();
    scene.add(snapshotsGroup);

    const snapshotMarkerGeometry = new THREE.SphereGeometry(0.025, 16, 16);
    const snapshotMarkerMaterial = new THREE.MeshBasicMaterial({ color: MARKER_COLOR });
    const snapshotPlaneGeometry = new THREE.PlaneGeometry(SNAPSHOT_PLANE_SIZE, SNAPSHOT_PLANE_SIZE);
    const snapshotPlaneMaterial = new THREE.MeshBasicMaterial({
        color: 0xe2e8f0,
        transparent: true,
        opacity: 0.32,
        side: THREE.DoubleSide,
        depthWrite: false,
    });
    const snapshotArrowLength = ARROW_LENGTH * SNAPSHOT_ARROW_SCALE;

    function addSnapshot(point, basis1, basis2, normal) {
        const group = new THREE.Group();

        const marker = new THREE.Mesh(snapshotMarkerGeometry, snapshotMarkerMaterial);
        marker.position.copy(point);
        group.add(marker);

        const plane = new THREE.Mesh(snapshotPlaneGeometry, snapshotPlaneMaterial);
        plane.position.copy(point);
        plane.lookAt(point.clone().add(normal));
        group.add(plane);

        group.add(
            new THREE.ArrowHelper(
                basis1.clone().normalize(),
                point,
                snapshotArrowLength,
                RED,
                snapshotArrowLength * 0.35,
                snapshotArrowLength * 0.22,
            ),
        );
        group.add(
            new THREE.ArrowHelper(
                basis2.clone().normalize(),
                point,
                snapshotArrowLength,
                GREEN,
                snapshotArrowLength * 0.35,
                snapshotArrowLength * 0.22,
            ),
        );

        snapshotsGroup.add(group);
    }

    function clearSnapshots() {
        while (snapshotsGroup.children.length > 0) {
            snapshotsGroup.remove(snapshotsGroup.children[0]);
        }
    }

    // -----------------------------------------------------------------
    // Parallel transport state and update
    // -----------------------------------------------------------------
    const initialPoint = new THREE.Vector3(SPHERE_RADIUS, 0, 0);
    const initialBasis1 = new THREE.Vector3(0, 0, 1);
    const initialBasis2 = new THREE.Vector3(0, 1, 0);

    let currentPoint = new THREE.Vector3();
    let basis1 = new THREE.Vector3();
    let basis2 = new THREE.Vector3();
    let distanceSinceSnapshot = 0;

    function projectTangent(vector, normal, out) {
        return out
            .copy(vector)
            .addScaledVector(normal, -vector.dot(normal));
    }

    function parallelTransportVector(vector, from, to) {
        const start = from.clone().normalize();
        const end = to.clone().normalize();
        const angle = Math.acos(THREE.MathUtils.clamp(start.dot(end), -1, 1));

        if (angle < 1e-12) return vector.clone();

        let axis = new THREE.Vector3().crossVectors(start, end);
        if (axis.lengthSq() < 1e-12) {
            const fallback = Math.abs(start.y) < 0.9
                ? new THREE.Vector3(0, 1, 0)
                : new THREE.Vector3(1, 0, 0);
            axis.crossVectors(start, fallback).normalize();
        } else {
            axis.normalize();
        }

        return vector.clone().applyAxisAngle(axis, angle);
    }

    function transportGivenBasis(first, second, from, to) {
        const end = to.clone().normalize();
        let nextBasis1 = parallelTransportVector(first, from, to);
        let nextBasis2 = parallelTransportVector(second, from, to);

        nextBasis1 = projectTangent(nextBasis1, end, new THREE.Vector3()).normalize();
        nextBasis2 = projectTangent(nextBasis2, end, new THREE.Vector3());
        nextBasis2.addScaledVector(nextBasis1, -nextBasis2.dot(nextBasis1)).normalize();

        return { nextBasis1, nextBasis2 };
    }

    function setFrame(point, nextBasis1, nextBasis2) {
        currentPoint.copy(point);
        basis1.copy(nextBasis1);
        basis2.copy(nextBasis2);

        const normal = point.clone().normalize();
        marker.position.copy(point);
        tangentPlane.position.copy(point);
        tangentPlane.lookAt(point.clone().add(normal));
        redArrow.position.copy(point);
        redArrow.setDirection(nextBasis1);
        greenArrow.position.copy(point);
        greenArrow.setDirection(nextBasis2);
    }

    function sphericalSlerp(from, to, t) {
        const angle = from.angleTo(to);
        if (angle < 1e-12) return from.clone();
        const sinAngle = Math.sin(angle);
        const a = Math.sin((1 - t) * angle) / sinAngle;
        const b = Math.sin(t * angle) / sinAngle;
        return from.clone().multiplyScalar(a).addScaledVector(to, b).normalize();
    }

    function recordPathSegment(
        previousPoint,
        point,
        previousBasis1,
        previousBasis2,
    ) {
        const offsetPoint = point
            .clone()
            .addScaledVector(point.clone().normalize(), TRAJECTORY_OFFSET);
        appendTrajectoryPoint(offsetPoint);

        const stepDistance = previousPoint.angleTo(point);
        distanceSinceSnapshot += stepDistance;
        if (distanceSinceSnapshot < SNAPSHOT_INTERVAL || stepDistance <= 0) return;

        const overshoot = distanceSinceSnapshot - SNAPSHOT_INTERVAL;
        const t = Math.min(Math.max(1 - overshoot / stepDistance, 0), 1);
        const samplePoint = sphericalSlerp(previousPoint, point, t).multiplyScalar(SPHERE_RADIUS);
        const sampleFrame = transportGivenBasis(
            previousBasis1,
            previousBasis2,
            previousPoint,
            samplePoint,
        );
        addSnapshot(
            samplePoint,
            sampleFrame.nextBasis1,
            sampleFrame.nextBasis2,
            samplePoint.clone().normalize(),
        );
        distanceSinceSnapshot -= SNAPSHOT_INTERVAL;
    }

    function movePointTo(worldPoint) {
        const point = worldPoint.clone().normalize().multiplyScalar(SPHERE_RADIUS);
        if (point.distanceTo(currentPoint) < 1e-12) return;

        const previousPoint = currentPoint.clone();
        const previousBasis1 = basis1.clone();
        const previousBasis2 = basis2.clone();
        const { nextBasis1, nextBasis2 } = transportGivenBasis(
            basis1,
            basis2,
            currentPoint,
            point,
        );
        setFrame(point, nextBasis1, nextBasis2);
        recordPathSegment(previousPoint, point, previousBasis1, previousBasis2);
    }

    function resetPoint() {
        setFrame(initialPoint.clone(), initialBasis1.clone(), initialBasis2.clone());
        clearTrajectory();
        clearSnapshots();
        distanceSinceSnapshot = 0;

        appendTrajectoryPoint(
            initialPoint
                .clone()
                .addScaledVector(initialPoint.clone().normalize(), TRAJECTORY_OFFSET),
        );
        addSnapshot(
            initialPoint,
            initialBasis1,
            initialBasis2,
            initialPoint.clone().normalize(),
        );
    }

    resetPoint();

    // -----------------------------------------------------------------
    // Drag the point around the sphere
    // -----------------------------------------------------------------
    const { update: updatePointer } = createPointerState(THREE, canvas, camera);
    let dragging = false;

    const onPointerDown = (event) => {
        const hits = updatePointer(event).intersectObject(sphere, false);
        if (hits.length === 0) return;
        if (hits[0].point.distanceTo(currentPoint) > 0.35) return;

        dragging = true;
        cameraControls.enabled = false;
        movePointTo(hits[0].point);
    };

    const onPointerMove = (event) => {
        if (!dragging) return;
        const hits = updatePointer(event).intersectObject(sphere, false);
        if (hits.length > 0) movePointTo(hits[0].point);
    };

    const onPointerUp = () => {
        if (!dragging) return;
        dragging = false;
        cameraControls.enabled = true;
    };

    attachPointerDrag(canvas, { onPointerDown, onPointerMove, onPointerUp });

    // -----------------------------------------------------------------
    // Camera and controls
    // -----------------------------------------------------------------
    const home = new THREE.Vector3(2.2, 1.2, 2.8);
    camera.position.copy(home);
    cameraControls.target.set(0, 0, 0);
    cameraControls.update();

    helpers.addControlWidget({
        type: 'checkbox',
        label: 'Tangent Space',
        checked: true,
        action: (checked) => {
            tangentGroup.visible = checked;
        },
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
        label: 'Snapshots',
        checked: true,
        action: (checked) => {
            snapshotsGroup.visible = checked;
        },
    });
    helpers.addControlWidget({
        type: 'button',
        label: 'Reset Point',
        action: resetPoint,
    });
    helpers.addControlWidget({
        type: 'button',
        label: 'Reset View',
        action: () => {
            camera.position.copy(home);
            cameraControls.target.set(0, 0, 0);
            cameraControls.update();
        },
    });
}
