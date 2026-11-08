import { createPointerState, attachPointerDrag } from '../../shared/pointer-drag.js';

export const R = 2.15;
export const r = 0.78;
export const thetaDivisions = 12;
export const phiDivisions = 8;
const TAU = Math.PI * 2;

export function wrapAngle(value) {
    return ((value % TAU) + TAU) % TAU;
}

export function pointOnTorus(THREE, theta, phi, offset = 0) {
    const radial = R + (r + offset) * Math.cos(theta);
    return new THREE.Vector3(
        radial * Math.cos(phi),
        radial * Math.sin(phi),
        (r + offset) * Math.sin(theta),
    );
}

export function torusAngles(point) {
    const phi = Math.atan2(point.y, point.x);
    const radial = Math.hypot(point.x, point.y);
    return [wrapAngle(Math.atan2(point.z, radial - R)), wrapAngle(phi)];
}

export function jacobianVector(THREE, theta, phi, vTheta, vPhi) {
    const radial = R + r * Math.cos(theta);
    const dTheta = new THREE.Vector3(
        -r * Math.sin(theta) * Math.cos(phi),
        -r * Math.sin(theta) * Math.sin(phi),
        r * Math.cos(theta),
    );
    const dPhi = new THREE.Vector3(-radial * Math.sin(phi), radial * Math.cos(phi), 0);
    return dTheta.multiplyScalar(vTheta).addScaledVector(dPhi, vPhi);
}

function colorFor(THREE, theta, phi, alpha, beta, pattern, colors, checkerColor) {
    const a = wrapAngle(theta - alpha);
    const b = wrapAngle(phi - beta);
    if (pattern === 'wheel') {
        const color = new THREE.Color();
        // Phi supplies the full cyclic hue; theta cycles the brightness.
        const intensity = 0.5 + 0.5 * Math.cos(a);
        color.setHSL(b / TAU, 0.72, 0.30 + 0.34 * intensity);
        return color;
    }
    const i = Math.floor(a / TAU * thetaDivisions);
    const j = Math.floor(b / TAU * phiDivisions);
    return new THREE.Color((i + j) % 2 === 0 ? colors.surface : colors.accentStrong);
}

export function makeTorusSurface(THREE, root, colors, pattern = 'checker', alpha = 0, beta = 0) {
    const positions = [];
    const vertexColors = [];
    const segmentsTheta = thetaDivisions * 4;
    const segmentsPhi = phiDivisions * 6;
    const addVertex = (theta, phi, color) => {
        const p = pointOnTorus(THREE, theta, phi, 0.008);
        positions.push(p.x, p.y, p.z);
        vertexColors.push(color.r, color.g, color.b);
    };
    for (let i = 0; i < segmentsTheta; i++) {
        for (let j = 0; j < segmentsPhi; j++) {
            const t0 = TAU * i / segmentsTheta;
            const t1 = TAU * (i + 1) / segmentsTheta;
            const p0 = TAU * j / segmentsPhi;
            const p1 = TAU * (j + 1) / segmentsPhi;
            const color = colorFor(THREE, (t0 + t1) / 2, (p0 + p1) / 2, alpha, beta, pattern, colors);
            for (const [t, p] of [[t0, p0], [t1, p0], [t1, p1], [t0, p0], [t1, p1], [t0, p1]]) {
                addVertex(t, p, color);
            }
        }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(vertexColors, 3));
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
        vertexColors: true, side: THREE.DoubleSide, shininess: 45,
    }));
    mesh.userData.dispose = () => { geometry.dispose(); mesh.material.dispose(); };
    root.add(mesh);
    return mesh;
}

export function addGridCurves(THREE, root, colors) {
    const material = new THREE.LineBasicMaterial({ color: colors.text, transparent: true, opacity: 0.62 });
    for (let i = 0; i < thetaDivisions; i++) {
        const points = [];
        for (let k = 0; k <= 96; k++) points.push(pointOnTorus(THREE, TAU * k / 96, TAU * i / thetaDivisions));
        root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
    }
    for (let j = 0; j < phiDivisions; j++) {
        const points = [];
        for (let k = 0; k <= 96; k++) points.push(pointOnTorus(THREE, TAU * j / phiDivisions, TAU * k / 96));
        root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material));
    }
}

export function addSceneBasics(scene, camera, helpers) {
    const controls = helpers.cameraControls.createOrbit();
    scene.add(new helpers.THREE.HemisphereLight(0xffffff, 0x657080, 2.0));
    const light = new helpers.THREE.DirectionalLight(0xffffff, 2.2);
    light.position.set(4, 5, 7);
    scene.add(light);
    camera.position.set(6.4, 6.0, 8.4);
    controls.target.set(0, 0, 0);
    controls.update();
    controls.minDistance = 5;
    controls.maxDistance = 18;
    return controls;
}

export function addDraggableTorusPoint(THREE, scene, canvas, camera, controls, torus, colors, initial = [0, 0], onChange = () => {}, markerColor = colors.error) {
    const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.105, 20, 16),
        new THREE.MeshBasicMaterial({ color: markerColor, depthTest: false }),
    );
    marker.renderOrder = 5;
    scene.add(marker);
    const state = { theta: initial[0], phi: initial[1] };
    const place = () => {
        marker.position.copy(pointOnTorus(THREE, state.theta, state.phi, 0.09));
        onChange(state.theta, state.phi);
    };
    const { update } = createPointerState(THREE, canvas, camera);
    let dragging = false;
    attachPointerDrag(canvas, {
        onPointerDown(event) {
            if (event.pointerType === 'mouse' && event.button !== 0) return;
            const ray = update(event);
            const hit = ray.intersectObject(torus, false)[0];
            if (hit && hit.point.distanceTo(marker.position) < 0.34) {
                dragging = true;
                controls.enabled = false;
                canvas.style.cursor = 'grabbing';
                event.preventDefault();
                event.stopPropagation();
            }
        },
        onPointerMove(event) {
            const ray = update(event);
            if (!dragging) {
                canvas.style.cursor = ray.intersectObject(marker, false).length ? 'grab' : '';
                return;
            }
            const hit = ray.intersectObject(torus, false)[0];
            if (hit) {
                [state.theta, state.phi] = torusAngles(hit.point);
                place();
            }
            event.preventDefault();
            event.stopPropagation();
        },
        onPointerUp() {
            if (!dragging) return;
            dragging = false;
            controls.enabled = true;
            canvas.style.cursor = '';
        },
    });
    place();
    return { marker, state, place };
}
