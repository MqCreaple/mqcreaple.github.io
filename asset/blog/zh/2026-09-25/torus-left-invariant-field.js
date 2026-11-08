import { createPointerState, attachPointerDrag } from '../../shared/pointer-drag.js';
import {
    addDraggableTorusPoint, addGridCurves, addSceneBasics, jacobianVector,
    makeTorusSurface, pointOnTorus, R, r, thetaDivisions, phiDivisions,
} from './torus-common.js';

const TAU = Math.PI * 2;

export default function (scene, camera, canvas, initialView, helpers) {
    const { THREE } = helpers;
    const colors = helpers.themeColors;
    const controls = addSceneBasics(scene, camera, helpers);
    const torus = makeTorusSurface(THREE, scene, colors, 'checker');
    addGridCurves(THREE, scene, colors);

    let vTheta = 0.42;
    let vPhi = 0.34;
    let shiftTheta = 0;
    let shiftPhi = 0;
    const baseArrows = [];
    const shiftedArrows = [];
    const vectorColor = 0xeab308;

    function makeFieldArrow(color, opacity = 1) {
        const arrow = new THREE.ArrowHelper(
            new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 0.6, color, 0.16, 0.09,
        );
        if (opacity < 1) {
            for (const material of [arrow.line.material, arrow.cone.material]) {
                material.transparent = true;
                material.opacity = opacity;
                material.depthWrite = false;
            }
        }
        scene.add(arrow);
        return arrow;
    }
    for (let i = 0; i < thetaDivisions; i++) {
        for (let j = 0; j < phiDivisions; j++) {
            baseArrows.push({ theta: TAU * i / thetaDivisions, phi: TAU * j / phiDivisions, arrow: makeFieldArrow(vectorColor) });
            shiftedArrows.push({ theta: TAU * i / thetaDivisions, phi: TAU * j / phiDivisions, arrow: makeFieldArrow(vectorColor, 0.55) });
        }
    }

    function updateArrow(item, theta, phi) {
        const start = pointOnTorus(THREE, theta, phi, 0.065);
        const vector = jacobianVector(THREE, theta, phi, vTheta, vPhi);
        const length = vector.length();
        item.arrow.position.copy(start);
        if (length < 1e-5) {
            item.arrow.visible = false;
            return;
        }
        item.arrow.visible = true;
        item.arrow.setDirection(vector.normalize());
        item.arrow.setLength(length * 0.74, Math.min(0.17, length * 0.28), Math.min(0.10, length * 0.16));
    }
    function updateField() {
        for (let k = 0; k < baseArrows.length; k++) {
            const base = baseArrows[k];
            const moved = shiftedArrows[k];
            updateArrow(base, base.theta, base.phi);
            updateArrow(moved, moved.theta + shiftTheta, moved.phi + shiftPhi);
        }
        vectorArrow.position.copy(identity);
        const tipOffset = new THREE.Vector3(0, (R + r) * vPhi, r * vTheta);
        const magnitude = tipOffset.length();
        vectorArrow.visible = magnitude > 1e-5;
        if (vectorArrow.visible) {
            vectorArrow.setDirection(tipOffset.normalize());
            vectorArrow.setLength(magnitude, 0.16, 0.09);
        }
        vectorTip.position.copy(identity).add(new THREE.Vector3(0, (R + r) * vPhi, r * vTheta));
    }

    const identity = pointOnTorus(THREE, 0, 0, 0.025);
    const tangentPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(2.5, 2.5),
        new THREE.MeshBasicMaterial({ color: colors.accentSoft, transparent: true, opacity: 0.36, side: THREE.DoubleSide, depthWrite: false }),
    );
    tangentPlane.position.copy(identity);
    tangentPlane.rotation.y = Math.PI / 2;
    scene.add(tangentPlane);

    const vectorArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), identity, 1, vectorColor, 0.16, 0.09);
    scene.add(vectorArrow);
    const vectorTip = new THREE.Mesh(
        new THREE.SphereGeometry(0.105, 18, 14),
        new THREE.MeshBasicMaterial({ color: vectorColor, depthTest: false }),
    );
    vectorTip.renderOrder = 6;
    scene.add(vectorTip);

    addDraggableTorusPoint(
        THREE, scene, canvas, camera, controls, torus, colors, [0, 0],
        (theta, phi) => { shiftTheta = theta; shiftPhi = phi; updateField(); },
        colors.error,
    );

    const { update: updatePointer } = createPointerState(THREE, canvas, camera);
    const plane = new THREE.Plane(new THREE.Vector3(1, 0, 0), -identity.x);
    let draggingTip = false;
    function planeHit(ray) {
        return ray.ray.intersectPlane(plane, new THREE.Vector3());
    }
    attachPointerDrag(canvas, {
        onPointerDown(event) {
            if (event.pointerType === 'mouse' && event.button !== 0) return;
            const ray = updatePointer(event);
            if (ray.intersectObject(vectorTip, false).length === 0) return;
            if (!planeHit(ray)) return;
            draggingTip = true;
            controls.enabled = false;
            canvas.style.cursor = 'grabbing';
            event.preventDefault();
            event.stopPropagation();
        },
        onPointerMove(event) {
            const ray = updatePointer(event);
            if (!draggingTip) {
                canvas.style.cursor = ray.intersectObject(vectorTip, false).length ? 'grab' : '';
                return;
            }
            const hit = planeHit(ray);
            if (!hit) return;
            const dy = hit.y - identity.y;
            const dz = hit.z - identity.z;
            vPhi = THREE.MathUtils.clamp(dy / (R + r), -0.65, 0.65);
            vTheta = THREE.MathUtils.clamp(dz / r, -0.65, 0.65);
            updateField();
            event.preventDefault();
            event.stopPropagation();
        },
        onPointerUp() {
            if (!draggingTip) return;
            draggingTip = false;
            controls.enabled = true;
            canvas.style.cursor = '';
        },
    });

    helpers.addControlWidget({
        type: 'button',
        label: '重置向量',
        action: () => { vTheta = 0.42; vPhi = 0.34; updateField(); },
    });
    helpers.addControlWidget({
        type: 'button',
        label: '重置点',
        action: () => { shiftTheta = 0; shiftPhi = 0; updateField(); },
    });
    updateField();
}
