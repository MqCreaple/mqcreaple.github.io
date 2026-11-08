import { createPointerState, attachPointerDrag } from '../../shared/pointer-drag.js';
import { makeTextSprite } from '../../shared/text-sprite.js';

export default function (scene, camera, canvas, initialView, helpers) {
    const { THREE } = helpers;
    const titleColor = helpers.themeColors.text;
    const controls = helpers.cameraControls.createOrbit();
    controls.minDistance = 12;
    controls.maxDistance = 32;

    const contentRoot = new THREE.Group();
    contentRoot.scale.setScalar(2);
    scene.add(contentRoot);

    const stationX = [-5.12, 0, 5.12];
    const axisLength = 2.1;
    const alphaColor = 0xef4444;
    const betaColor = 0x3b82f6;
    const sumColor = 0xeab308;
    const bchColor = 0xa855f7;
    const alpha = new THREE.Vector3(0.85, 0.25, 0.1);
    const beta = new THREE.Vector3(0.15, 0.75, 0.35);
    const alphaRoot = new THREE.Group();
    alphaRoot.position.x = stationX[0];
    contentRoot.add(alphaRoot);

    const sumRoot = new THREE.Group();
    sumRoot.position.x = stationX[1];
    contentRoot.add(sumRoot);

    const bchRoot = new THREE.Group();
    bchRoot.position.x = stationX[2];
    contentRoot.add(bchRoot);

    const axisRoots = [alphaRoot, sumRoot, bchRoot];
    for (const root of axisRoots) {
        const axes = new THREE.AxesHelper(axisLength);
        axes.material.transparent = true;
        axes.material.opacity = 0.5;
        axes.material.depthWrite = false;
        root.add(axes);
    }

    addPanelTitle(THREE, alphaRoot, '\u03b1, \u03b2', titleColor);
    addPanelTitle(THREE, sumRoot, '\u03b1 + \u03b2', titleColor);
    addPanelTitle(THREE, bchRoot, 'BCH', titleColor);

    const alphaArrow = makeArrow(THREE, alphaRoot, alphaColor);
    const betaArrow = makeArrow(THREE, alphaRoot, betaColor);
    const sumArrow = makeArrow(THREE, sumRoot, sumColor);
    const bchArrow = makeArrow(THREE, bchRoot, bchColor);
    const alphaHandle = makeHandle(THREE, alphaRoot, alphaColor);
    const betaHandle = makeHandle(THREE, alphaRoot, betaColor);
    alphaHandle.userData.vector = alpha;
    betaHandle.userData.vector = beta;
    const alphaLabel = makeVectorLabel(THREE, alphaRoot, '\u03b1', alphaColor);
    const betaLabel = makeVectorLabel(THREE, alphaRoot, '\u03b2', betaColor);
    const sumLabel = makeVectorLabel(THREE, sumRoot, '\u03b1 + \u03b2', sumColor, 1.8);
    const bchLabel = makeVectorLabel(
        THREE, bchRoot, '\u03b1 + \u03b2 + \u00bd\u03b1\u00d7\u03b2', bchColor, 2.5,
    );

    const cubes = [
        makeOrientationCube(THREE, alphaRoot),
        makeOrientationCube(THREE, sumRoot),
        makeOrientationCube(THREE, bchRoot),
    ];

    const sum = new THREE.Vector3();
    const bch = new THREE.Vector3();
    const cross = new THREE.Vector3();
    const identity = new THREE.Quaternion();
    const alphaRotation = new THREE.Quaternion();
    const betaRotation = new THREE.Quaternion();
    const partialRotation = new THREE.Quaternion();
    const sumRotation = new THREE.Quaternion();
    const bchRotation = new THREE.Quaternion();
    let rotated = false;
    const animation = { amount: 0, target: 0 };

    function rotationFromVector(vector) {
        const angle = vector.length();
        if (angle < 1e-8) return new THREE.Quaternion();
        return new THREE.Quaternion().setFromAxisAngle(vector.clone().normalize(), angle);
    }

    function updateVectors() {
        sum.copy(alpha).add(beta);
        cross.crossVectors(alpha, beta);
        bch.copy(sum).addScaledVector(cross, 0.5);

        setArrow(alphaArrow, alpha);
        setArrow(betaArrow, beta);
        setArrow(sumArrow, sum);
        setArrow(bchArrow, bch);
        alphaHandle.position.copy(alpha);
        betaHandle.position.copy(beta);
        placeLabel(alphaLabel, alpha);
        placeLabel(betaLabel, beta);
        placeLabel(sumLabel, sum);
        placeLabel(bchLabel, bch);

        setRotationTargets();
        updateCubePoses();
    }

    function setRotationTargets() {
        alphaRotation.copy(rotationFromVector(alpha));
        betaRotation.copy(rotationFromVector(beta));
        sumRotation.copy(rotationFromVector(sum));
        bchRotation.copy(rotationFromVector(bch));
    }

    function updateCubePoses() {
        // The first half of the timeline applies beta. The second half applies
        // alpha to that result, so both stages take half as long as either
        // single-stage animation on the other cubes.
        if (animation.amount <= 0.5) {
            cubes[0].quaternion.copy(identity).slerp(betaRotation, animation.amount * 2);
        } else {
            partialRotation.copy(identity).slerp(alphaRotation, (animation.amount - 0.5) * 2);
            cubes[0].quaternion.copy(partialRotation).multiply(betaRotation);
        }
        cubes[1].quaternion.copy(identity).slerp(sumRotation, animation.amount);
        cubes[2].quaternion.copy(identity).slerp(bchRotation, animation.amount);
    }

    const cameraHome = new THREE.Vector3(0, 8.5, 19.5);
    camera.position.copy(cameraHome);
    controls.target.set(0, 0, 0);
    controls.update();

    helpers.onFrame((dt) => {
        const difference = animation.target - animation.amount;
        if (Math.abs(difference) > 1e-4) {
            animation.amount += Math.sign(difference) * Math.min(Math.abs(difference), dt * 1.5);
            updateCubePoses();
        } else if (animation.amount !== animation.target) {
            animation.amount = animation.target;
            updateCubePoses();
        }
    });

    const { update: updatePointer } = createPointerState(THREE, canvas, camera);
    const dragPlane = new THREE.Plane();
    let drag = null;

    function onPointerDown(event) {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        const raycaster = updatePointer(event);
        const hit = raycaster.intersectObjects([alphaHandle, betaHandle], false)[0];
        if (!hit) return;

        const vector = hit.object.userData.vector;
        const tip = hit.object.position.clone();
        alphaRoot.localToWorld(tip);
        dragPlane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()), tip);
        const startHit = raycaster.ray.intersectPlane(dragPlane, new THREE.Vector3());
        if (!startHit) return;

        drag = {
            vector,
            startTip: hit.object.position.clone(),
            startHitLocal: alphaRoot.worldToLocal(startHit.clone()),
        };
        controls.enabled = false;
        canvas.setPointerCapture?.(event.pointerId);
        canvas.style.cursor = 'grabbing';
        event.preventDefault();
        event.stopPropagation();
    }

    function onPointerMove(event) {
        const raycaster = updatePointer(event);
        if (!drag) {
            canvas.style.cursor = raycaster.intersectObjects([alphaHandle, betaHandle], false).length
                ? 'grab'
                : '';
            return;
        }

        const hit = raycaster.ray.intersectPlane(dragPlane, new THREE.Vector3());
        if (!hit) return;
        const delta = alphaRoot.worldToLocal(hit).sub(drag.startHitLocal);
        drag.vector.copy(drag.startTip).add(delta);
        clampVector(drag.vector, 2.2);
        updateVectors();
        event.preventDefault();
        event.stopPropagation();
    }

    function onPointerUp(event) {
        if (!drag) return;
        drag = null;
        controls.enabled = true;
        canvas.releasePointerCapture?.(event.pointerId);
        canvas.style.cursor = '';
    }

    attachPointerDrag(canvas, { onPointerDown, onPointerMove, onPointerUp });

    helpers.addControlWidget({
        type: 'button',
        label: '\u65cb\u8f6c / \u590d\u4f4d',
        action: () => {
            rotated = !rotated;
            animation.target = rotated ? 1 : 0;
        },
    });
    helpers.addControlWidget({
        type: 'button',
        label: '\u590d\u4f4d\u89c6\u89d2',
        action: () => {
            camera.position.copy(cameraHome);
            controls.target.set(0, 0, 0);
            controls.update();
        },
    });

    updateVectors();
}

function makeArrow(THREE, root, color) {
    const arrow = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, color, 0.2, 0.11,
    );
    root.add(arrow);
    return arrow;
}

function setArrow(arrow, vector) {
    const length = vector.length();
    arrow.visible = length > 1e-5;
    if (!arrow.visible) return;
    arrow.setDirection(vector.clone().normalize());
    arrow.setLength(length, Math.min(0.24, length * 0.28), Math.min(0.13, length * 0.16));
}

function makeHandle(THREE, root, color) {
    const handle = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 20, 16),
        new THREE.MeshBasicMaterial({ color, depthTest: false }),
    );
    handle.renderOrder = 8;
    root.add(handle);
    return handle;
}

function makeVectorLabel(THREE, root, text, color, scale = 1.2) {
    const label = makeTextSprite(THREE, text, `#${color.toString(16).padStart(6, '0')}`);
    label.scale.set(scale, scale / 2, 1);
    root.add(label);
    return label;
}

function placeLabel(label, vector) {
    label.position.copy(vector);
    if (vector.lengthSq() > 1e-8) label.position.addScaledVector(vector.clone().normalize(), 0.18);
    else label.position.y += 0.18;
}

function addPanelTitle(THREE, root, text, color) {
    const title = makeTextSprite(THREE, text, color);
    title.scale.set(2.4, 1.2, 1);
    title.position.set(0, 2.9, 0);
    root.add(title);
}

function makeOrientationCube(THREE, root) {
    const group = new THREE.Group();
    root.add(group);

    const side = 0.95;
    const body = new THREE.Mesh(
        new THREE.BoxGeometry(side, side, side),
        new THREE.MeshPhongMaterial({
            color: 0x334155,
            transparent: true,
            opacity: 0.82,
            shininess: 45,
        }),
    );
    body.userData.nonInteractive = true;
    group.add(body);

    const faces = [
        { normal: new THREE.Vector3(1, 0, 0), color: 0xef4444 },
        { normal: new THREE.Vector3(-1, 0, 0), color: 0xf97316 },
        { normal: new THREE.Vector3(0, 1, 0), color: 0xf8fafc },
        { normal: new THREE.Vector3(0, -1, 0), color: 0xfacc15 },
        { normal: new THREE.Vector3(0, 0, 1), color: 0x22c55e },
        { normal: new THREE.Vector3(0, 0, -1), color: 0x3b82f6 },
    ];

    for (const face of faces) {
        const triangle = new THREE.Mesh(
            makeTriangleGeometry(THREE, side * 0.58),
            new THREE.MeshBasicMaterial({ color: face.color, side: THREE.DoubleSide }),
        );
        triangle.position.copy(face.normal).multiplyScalar(side / 2 + 0.008);
        triangle.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), face.normal);
        triangle.userData.nonInteractive = true;
        group.add(triangle);
    }
    return group;
}

function makeTriangleGeometry(THREE, size) {
    const geometry = new THREE.BufferGeometry();
    const half = size / 2;
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([
        -half, -half, 0,
        half, -half, 0,
        0, half, 0,
    ], 3));
    geometry.computeVertexNormals();
    return geometry;
}

function clampVector(vector, maxLength) {
    const length = vector.length();
    if (length > maxLength) vector.multiplyScalar(maxLength / length);
}
