// SO(3) near the identity: a radius-pi rotation-vector ball and a Rubik's cube.
//
// The left point is a rotation vector omega in so(3). Its three small arrows
// drag the point along the coordinate axes. The cube on the right applies
// R(omega) = exp([omega]_x). At |omega| = pi, omega and -omega represent the
// same rotation, so both points are shown. Dragging the antipodal point back
// inside the ball selects that branch and removes the original point.

import { createPointerState, attachPointerDrag } from '../../shared/pointer-drag.js';
import { makeTextSprite } from '../../shared/text-sprite.js';

export default function (scene, camera, canvas, initialView, helpers) {
    const { THREE } = helpers;
    const cameraControls = helpers.cameraControls.createOrbit();
    const colors = helpers.themeColors;

    const SPHERE_RADIUS = Math.PI;
    const SURFACE_EPSILON = 1e-3;
    const HANDLE_LENGTH = 0.72;
    const HANDLE_HIT_RADIUS = 0.11;
    const LEFT_CENTER = new THREE.Vector3(-4.0, 0, 0);
    const RIGHT_CENTER = new THREE.Vector3(4.25, 0, 0);

    const AXES = [
        { name: 'x', direction: new THREE.Vector3(1, 0, 0), color: 0xef4444 },
        { name: 'y', direction: new THREE.Vector3(0, 1, 0), color: 0x22c55e },
        { name: 'z', direction: new THREE.Vector3(0, 0, 1), color: 0x3b82f6 },
    ];
    const Y_AXIS = new THREE.Vector3(0, 1, 0);

    cameraControls.minDistance = 6;
    cameraControls.maxDistance = 30;

    const omega = new THREE.Vector3(0.55, -0.35, 0.45);

    // ---------------------------------------------------------------------
    // Left coordinate system: the radius-pi rotation-vector sphere.
    // ---------------------------------------------------------------------

    const leftRoot = new THREE.Group();
    leftRoot.position.copy(LEFT_CENTER);
    scene.add(leftRoot);

    const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(SPHERE_RADIUS, 48, 32),
        new THREE.MeshPhongMaterial({
            color: colors.surface,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide,
            depthWrite: false,
            shininess: 30,
        }),
    );
    leftRoot.add(sphere);

    const sphereGrid = new THREE.Mesh(
        new THREE.SphereGeometry(SPHERE_RADIUS * 1.001, 24, 16),
        new THREE.MeshBasicMaterial({
            color: colors.text,
            wireframe: true,
            transparent: true,
            opacity: 0.10,
            depthWrite: false,
        }),
    );
    leftRoot.add(sphereGrid);

    const leftAxes = new THREE.AxesHelper(SPHERE_RADIUS + 0.45);
    leftAxes.material.transparent = true;
    leftAxes.material.opacity = 0.22;
    leftAxes.material.depthWrite = false;
    leftRoot.add(leftAxes);

    addAxisLabels(THREE, leftRoot, SPHERE_RADIUS + 0.62, 0.72);

    const radiusLabel = makeTextSprite(THREE, '\u03c0', '#eab308');
    radiusLabel.scale.set(0.72, 0.36, 1);
    radiusLabel.position.set(SPHERE_RADIUS + 0.24, 0.28, 0);
    leftRoot.add(radiusLabel);

    // ---------------------------------------------------------------------
    // Two selectable points, each with three world-axis drag handles.
    // ---------------------------------------------------------------------

    function createPointVisual(color, labelText) {
        const visual = {
            color,
            group: new THREE.Group(),
            handles: [],
        };

        visual.marker = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 24, 24),
            new THREE.MeshBasicMaterial({ color }),
        );
        visual.group.add(visual.marker);

        for (let axisIndex = 0; axisIndex < AXES.length; axisIndex++) {
            const axis = AXES[axisIndex];
            const arrow = new THREE.ArrowHelper(
                axis.direction,
                new THREE.Vector3(),
                HANDLE_LENGTH,
                axis.color,
                0.16,
                0.09,
            );
            visual.group.add(arrow);

            const hit = new THREE.Mesh(
                new THREE.CylinderGeometry(
                    HANDLE_HIT_RADIUS,
                    HANDLE_HIT_RADIUS,
                    HANDLE_LENGTH,
                    10,
                ),
                new THREE.MeshBasicMaterial({
                    transparent: true,
                    opacity: 0,
                    depthWrite: false,
                    colorWrite: false,
                }),
            );
            hit.position.copy(axis.direction).multiplyScalar(HANDLE_LENGTH / 2);
            hit.quaternion.setFromUnitVectors(Y_AXIS, axis.direction);
            hit.userData.pointVisual = visual;
            hit.userData.axisIndex = axisIndex;
            visual.group.add(hit);
            visual.handles.push(hit);
        }

        const label = makeTextSprite(
            THREE,
            labelText,
            `#${color.toString(16).padStart(6, '0')}`,
        );
        label.scale.set(0.78, 0.39, 1);
        label.position.set(0, 0.30, 0);
        visual.group.add(label);
        visual.label = label;

        leftRoot.add(visual.group);
        return visual;
    }

    const primary = createPointVisual(0xeab308, '\u03c9');
    const antipode = createPointVisual(0x06b6d4, '-\u03c9');

    // ---------------------------------------------------------------------
    // Right coordinate system: a 3x3x3 Rubik's cube applying R(omega).
    // ---------------------------------------------------------------------

    const rightRoot = new THREE.Group();
    rightRoot.position.copy(RIGHT_CENTER);
    scene.add(rightRoot);

    const rightAxes = new THREE.AxesHelper(2.35);
    rightAxes.material.transparent = true;
    rightAxes.material.opacity = 0.22;
    rightAxes.material.depthWrite = false;
    rightRoot.add(rightAxes);

    addAxisLabels(THREE, rightRoot, 2.52, 0.72);

    const cube = createRubikCube(THREE);
    rightRoot.add(cube);

    const cubeFormulaLabel = makeTextSprite(THREE, 'R(\u03c9)', '#eab308');
    cubeFormulaLabel.scale.set(1.35, 0.68, 1);
    cubeFormulaLabel.position.set(0, 2.55, 0);
    rightRoot.add(cubeFormulaLabel);

    // ---------------------------------------------------------------------
    // State updates
    // ---------------------------------------------------------------------

    function rotationFromVector(vector) {
        const angle = vector.length();
        if (angle < 1e-8) return new THREE.Matrix4().identity();
        return new THREE.Matrix4().makeRotationAxis(vector.clone().normalize(), angle);
    }

    function updateVisuals() {
        primary.group.position.copy(omega);
        primary.group.visible = true;

        const onSurface = omega.length() >= SPHERE_RADIUS - SURFACE_EPSILON;
        antipode.group.position.copy(omega).negate();
        antipode.group.visible = onSurface;

        cube.quaternion.setFromRotationMatrix(rotationFromVector(omega));
    }

    // ---------------------------------------------------------------------
    // Drag a point along one coordinate axis.
    // ---------------------------------------------------------------------

    const { update: updatePointer } = createPointerState(THREE, canvas, camera);
    const direction = new THREE.Vector3();
    const offset = new THREE.Vector3();
    const pointWorld = new THREE.Vector3();
    let drag = null;

    function visibleHandles() {
        const result = [];
        for (const visual of [primary, antipode]) {
            if (visual.group.visible) result.push(...visual.handles);
        }
        return result;
    }

    // Closest parameter s on the line point + s * axisDirection.
    function closestLineParameter(point, axisDirection, ray) {
        direction.copy(axisDirection);
        offset.copy(point).sub(ray.origin);

        const a = direction.dot(direction);
        const b = direction.dot(ray.direction);
        const c = ray.direction.dot(ray.direction);
        const d = direction.dot(offset);
        const e = ray.direction.dot(offset);
        const denominator = a * c - b * b;
        if (Math.abs(denominator) < 1e-8) return 0;
        return (b * e - c * d) / denominator;
    }

    function clampAlongAxis(vector, axisIndex) {
        const axisName = AXES[axisIndex].name;
        const otherSquared = Math.max(
            0,
            vector.lengthSq() - vector[axisName] * vector[axisName],
        );
        const maxCoordinate = Math.sqrt(Math.max(0, SPHERE_RADIUS ** 2 - otherSquared));
        vector[axisName] = THREE.MathUtils.clamp(
            vector[axisName],
            -maxCoordinate,
            maxCoordinate,
        );
        return vector;
    }

    function onPointerDown(event) {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        const raycaster = updatePointer(event);
        const hits = raycaster.intersectObjects(visibleHandles(), false);
        if (hits.length === 0) return;

        const hit = hits[0].object;
        const visual = hit.userData.pointVisual;
        const axisIndex = hit.userData.axisIndex;
        visual.group.getWorldPosition(pointWorld);

        drag = {
            visual,
            axisIndex,
            startPoint: pointWorld.clone(),
            startVector: visual.group.position.clone(),
            startParameter: closestLineParameter(
                pointWorld,
                AXES[axisIndex].direction,
                raycaster.ray,
            ),
        };

        cameraControls.enabled = false;
        canvas.style.cursor = 'grabbing';
        event.preventDefault();
        event.stopPropagation();
    }

    function onPointerMove(event) {
        const raycaster = updatePointer(event);

        if (!drag) {
            canvas.style.cursor = raycaster.intersectObjects(visibleHandles(), false).length > 0
                ? 'grab'
                : '';
            return;
        }

        const parameter = closestLineParameter(
            drag.startPoint,
            AXES[drag.axisIndex].direction,
            raycaster.ray,
        );
        const axisName = AXES[drag.axisIndex].name;
        const point = drag.startVector.clone();
        point[axisName] += parameter - drag.startParameter;
        clampAlongAxis(point, drag.axisIndex);

        // The dragged branch becomes the active rotation vector. If the
        // antipode was moved inside the ball, this removes the old point.
        omega.copy(point);
        updateVisuals();
        event.preventDefault();
        event.stopPropagation();
    }

    function onPointerUp() {
        if (!drag) return;
        drag = null;
        cameraControls.enabled = true;
        canvas.style.cursor = '';
    }

    attachPointerDrag(canvas, {
        onPointerDown,
        onPointerMove,
        onPointerUp,
    });

    // ---------------------------------------------------------------------
    // Camera and controls
    // ---------------------------------------------------------------------

    const home = new THREE.Vector3(0, 4.1, 13.0);
    camera.position.copy(home);
    cameraControls.target.set(0, 0, 0);
    cameraControls.update();

    helpers.addControlWidget({
        type: 'button',
        label: '\u590d\u4f4d',
        action: () => {
            omega.set(0.55, -0.35, 0.45);
            updateVisuals();
        },
    });

    helpers.addControlWidget({
        type: 'button',
        label: '\u6062\u590d\u89c6\u89d2',
        action: () => {
            camera.position.copy(home);
            cameraControls.target.set(0, 0, 0);
            cameraControls.update();
        },
    });

    updateVisuals();
}

function addAxisLabels(THREE, root, length, spriteScale) {
    const labels = [
        { text: 'x', color: '#ef4444', position: new THREE.Vector3(length, 0, 0) },
        { text: 'y', color: '#22c55e', position: new THREE.Vector3(0, length, 0) },
        { text: 'z', color: '#3b82f6', position: new THREE.Vector3(0, 0, length) },
    ];

    for (const item of labels) {
        const label = makeTextSprite(THREE, item.text, item.color);
        label.scale.set(spriteScale, spriteScale / 2, 1);
        label.position.copy(item.position);
        root.add(label);
    }
}

function createRubikCube(THREE) {
    const cube = new THREE.Group();
    const cubieSize = 0.62;
    const step = 0.68;
    const stickerSize = 0.48;
    const bodyMaterial = new THREE.MeshPhongMaterial({
        color: 0x18211f,
        shininess: 45,
    });
    const stickerGeometry = new THREE.PlaneGeometry(stickerSize, stickerSize);
    const stickerMaterials = new Map([
        ['x+', new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide })],
        ['x-', new THREE.MeshBasicMaterial({ color: 0xf97316, side: THREE.DoubleSide })],
        ['y+', new THREE.MeshBasicMaterial({ color: 0xf8fafc, side: THREE.DoubleSide })],
        ['y-', new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })],
        ['z+', new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide })],
        ['z-', new THREE.MeshBasicMaterial({ color: 0x3b82f6, side: THREE.DoubleSide })],
    ]);

    const cubieGeometry = new THREE.BoxGeometry(cubieSize, cubieSize, cubieSize);
    const faces = [
        { axis: 'x', sign: 1, normal: new THREE.Vector3(1, 0, 0) },
        { axis: 'x', sign: -1, normal: new THREE.Vector3(-1, 0, 0) },
        { axis: 'y', sign: 1, normal: new THREE.Vector3(0, 1, 0) },
        { axis: 'y', sign: -1, normal: new THREE.Vector3(0, -1, 0) },
        { axis: 'z', sign: 1, normal: new THREE.Vector3(0, 0, 1) },
        { axis: 'z', sign: -1, normal: new THREE.Vector3(0, 0, -1) },
    ];

    for (let ix = -1; ix <= 1; ix++) {
        for (let iy = -1; iy <= 1; iy++) {
            for (let iz = -1; iz <= 1; iz++) {
                if (ix === 0 && iy === 0 && iz === 0) continue;

                const cubie = new THREE.Mesh(cubieGeometry, bodyMaterial);
                cubie.position.set(ix * step, iy * step, iz * step);
                cube.add(cubie);

                const indices = { x: ix, y: iy, z: iz };
                for (const face of faces) {
                    if (indices[face.axis] !== face.sign) continue;

                    const sticker = new THREE.Mesh(
                        stickerGeometry,
                        stickerMaterials.get(`${face.axis}${face.sign > 0 ? '+' : '-'}`),
                    );
                    sticker.position
                        .copy(face.normal)
                        .multiplyScalar(cubieSize / 2 + 0.006);
                    sticker.quaternion.setFromUnitVectors(
                        new THREE.Vector3(0, 0, 1),
                        face.normal,
                    );
                    cubie.add(sticker);
                }
            }
        }
    }

    return cube;
}
