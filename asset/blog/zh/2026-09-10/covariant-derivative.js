// Covariant derivative / parallel transport on the paraboloid
// z = -c (x^2 + y^2), with c = 0.4.
//
// Path: the latitude circle
//   gamma(theta) = (r0 cos theta, r0 sin theta, -c r0^2).
// Vector field: the tangent-plane projection of the constant ambient field
//   V(x, y) = e_x - (e_x . n) n,
//   n = (2cx, 2cy, 1) / sqrt(1 + 4c^2 (x^2 + y^2)).
// Parallel transport along the path is analytic: in the orthonormal frame
// (T, e1 = T x n), the components rotate by phi = (theta - theta0) / S with
// S = sqrt(1 + 4 c^2 r0^2).  See parallel-transport.py for the derivation
// and numerical verification.
import { createPointerState, attachPointerDrag } from '../../shared/pointer-drag.js';
import { makeTextSprite } from '../../shared/text-sprite.js';

export default async function (scene, camera, canvas, initialView, helpers) {
    const { THREE } = helpers;
    const cameraControls = helpers.cameraControls.createOrbit();

    const C = 0.4;
    const SURFACE_RADIUS = 1.5;
    const R0 = 0.9;
    const THETA_MIN = -2.0;
    const THETA_MAX = 2.0;
    const THETA_SELECTED = 0.0;
    const S = Math.sqrt(1 + 4 * C * C * R0 * R0);
    const ARROW_SCALE = 0.3;
    const MAX_ARROW_LENGTH = 0.34;
    const MIN_ARROW_LENGTH = 0.015;

    const vectorColor = new THREE.Color(helpers.themeColors.accent);
    const highlightColor = new THREE.Color(helpers.themeColors.error);
    const deltaColor = new THREE.Color(0xf59e0b);

    function makeLabel(text, cssColor, scale = 0.4) {
        const sprite = makeTextSprite(THREE, text, cssColor);
        sprite.scale.set(1.5 * scale, 0.75 * scale, 1);
        return sprite;
    }

    function surfacePoint(theta) {
        return new THREE.Vector3(
            R0 * Math.cos(theta),
            R0 * Math.sin(theta),
            -C * R0 * R0,
        );
    }

    function surfaceNormal(x, y) {
        const s = Math.sqrt(1 + 4 * C * C * (x * x + y * y));
        return new THREE.Vector3((2 * C * x) / s, (2 * C * y) / s, 1 / s);
    }

    function fieldVector(x, y) {
        const s2 = 1 + 4 * C * C * (x * x + y * y);
        return new THREE.Vector3(
            1 - (4 * C * C * x * x) / s2,
            -(4 * C * C * x * y) / s2,
            (-2 * C * x) / s2,
        );
    }

    function tangent(theta) {
        return new THREE.Vector3(-Math.sin(theta), Math.cos(theta), 0);
    }

    function e1(theta) {
        // T x n for the downward paraboloid.
        return new THREE.Vector3(Math.cos(theta), Math.sin(theta), -2 * C * R0).divideScalar(S);
    }

    function parallelTransport(theta0, theta1) {
        const t0 = tangent(theta0);
        const e10 = e1(theta0);
        const p0 = surfacePoint(theta0);
        const v0 = fieldVector(p0.x, p0.y);
        const a0 = v0.dot(t0);
        const b0 = v0.dot(e10);
        const phi = (theta1 - theta0) / S;
        const a = a0 * Math.cos(phi) - b0 * Math.sin(phi);
        const b = a0 * Math.sin(phi) + b0 * Math.cos(phi);
        const t1 = tangent(theta1);
        const e11 = e1(theta1);
        return new THREE.Vector3()
            .addScaledVector(t1, a)
            .addScaledVector(e11, b);
    }

    function arrowLength(vector) {
        return Math.min(vector.length() * ARROW_SCALE, MAX_ARROW_LENGTH);
    }

    function setArrow(arrow, origin, vector, color) {
        const length = arrowLength(vector);
        if (length < MIN_ARROW_LENGTH) {
            arrow.visible = false;
            return;
        }
        arrow.position.copy(origin);
        arrow.setDirection(vector.clone().normalize());
        arrow.setLength(length, length * 0.35, length * 0.22);
        arrow.setColor(color);
        arrow.visible = true;
    }

    // -----------------------------------------------------------------
    // Paraboloid surface
    // -----------------------------------------------------------------
    const surfaceGeometry = buildSurfaceGeometry(THREE, C, SURFACE_RADIUS);
    const surfaceMaterial = new THREE.MeshPhongMaterial({
        color: helpers.themeColors.accentSoft,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        shininess: 40,
    });
    const surface = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
    scene.add(surface);

    const wireframe = new THREE.LineSegments(
        new THREE.WireframeGeometry(surfaceGeometry),
        new THREE.LineBasicMaterial({ color: helpers.themeColors.text }),
    );
    wireframe.visible = false;
    scene.add(wireframe);

    // -----------------------------------------------------------------
    // Path gamma and its label
    // -----------------------------------------------------------------
    const PATH_SEGMENTS = 128;
    const pathPositions = [];
    for (let i = 0; i <= PATH_SEGMENTS; i++) {
        const theta = THETA_MIN + (THETA_MAX - THETA_MIN) * (i / PATH_SEGMENTS);
        pathPositions.push(surfacePoint(theta));
    }
    const pathLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pathPositions),
        new THREE.LineBasicMaterial({ color: helpers.themeColors.muted }),
    );
    scene.add(pathLine);

    const gammaAngle = 1.2;
    const gammaLabel = makeLabel('γ', helpers.themeColors.muted);
    gammaLabel.position
        .copy(surfacePoint(gammaAngle))
        .addScaledVector(
            new THREE.Vector3(Math.cos(gammaAngle), Math.sin(gammaAngle), 0),
            0.3,
        );
    scene.add(gammaLabel);

    // -----------------------------------------------------------------
    // Vector field values sampled along the path
    // -----------------------------------------------------------------
    const fieldArrows = new THREE.Group();
    scene.add(fieldArrows);
    const PATH_VECTOR_COUNT = 14;
    for (let i = 0; i <= PATH_VECTOR_COUNT; i++) {
        const theta = THETA_MIN + (THETA_MAX - THETA_MIN) * (i / PATH_VECTOR_COUNT);
        const point = surfacePoint(theta);
        const field = fieldVector(point.x, point.y);
        const length = arrowLength(field);
        if (length < MIN_ARROW_LENGTH) continue;
        const color = Math.abs(theta - THETA_SELECTED) < 1e-6 ? highlightColor : vectorColor;
        fieldArrows.add(
            new THREE.ArrowHelper(
                field.clone().normalize(),
                point,
                length,
                color,
                length * 0.35,
                length * 0.22,
            ),
        );
    }

    const xAngle = -1.4;
    const xLabel = makeLabel('X', helpers.themeColors.accent);
    xLabel.position
        .copy(surfacePoint(xAngle))
        .addScaledVector(
            new THREE.Vector3(Math.cos(xAngle), Math.sin(xAngle), 0),
            0.28,
        )
        .add(new THREE.Vector3(0, 0, 0.08));
    scene.add(xLabel);

    const selectedMarker = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 20, 20),
        new THREE.MeshBasicMaterial({ color: highlightColor }),
    );
    selectedMarker.position.copy(surfacePoint(THETA_SELECTED));
    scene.add(selectedMarker);

    // -----------------------------------------------------------------
    // Draggable tangent point: tangent plane, transported vector, field
    // value, and the difference vector Delta X.
    // -----------------------------------------------------------------
    const tangentGroup = new THREE.Group();
    scene.add(tangentGroup);

    const dragMarker = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 20, 20),
        new THREE.MeshBasicMaterial({ color: highlightColor }),
    );
    tangentGroup.add(dragMarker);

    const tangentPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.55, 0.55),
        new THREE.MeshBasicMaterial({
            color: vectorColor,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide,
            depthWrite: false,
        }),
    );
    tangentGroup.add(tangentPlane);

    const transportedArrow = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(),
        0.1,
        highlightColor,
        0.035,
        0.02,
    );
    tangentGroup.add(transportedArrow);

    const fieldArrowAtPoint = new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(),
        0.1,
        vectorColor,
        0.035,
        0.02,
    );
    tangentGroup.add(fieldArrowAtPoint);

    const deltaArrow = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(),
        0.1,
        deltaColor,
        0.035,
        0.02,
    );
    tangentGroup.add(deltaArrow);

    const deltaLabel = makeLabel('ΔX', '#f59e0b');
    tangentGroup.add(deltaLabel);

    function placeAtTheta(theta) {
        const clamped = Math.min(Math.max(theta, THETA_MIN), THETA_MAX);
        const point = surfacePoint(clamped);
        const normal = surfaceNormal(point.x, point.y);
        const field = fieldVector(point.x, point.y);
        const transported = parallelTransport(THETA_SELECTED, clamped);

        dragMarker.position.copy(point);
        tangentPlane.position.copy(point);
        tangentPlane.lookAt(point.clone().add(normal));
        setArrow(fieldArrowAtPoint, point, field, vectorColor);
        setArrow(transportedArrow, point, transported, highlightColor);
        // At the selected point the field value and its parallel transport
        // coincide, so keep only the highlighted transported arrow visible.
        if (Math.abs(clamped - THETA_SELECTED) < 1e-9) {
            fieldArrowAtPoint.visible = false;
        }

        const fieldLength = arrowLength(field);
        const transportedLength = arrowLength(transported);
        const canShowDelta = fieldLength >= MIN_ARROW_LENGTH && transportedLength >= MIN_ARROW_LENGTH;
        if (!canShowDelta) {
            deltaArrow.visible = false;
            deltaLabel.visible = false;
            return;
        }

        const fieldTip = point.clone().addScaledVector(field.clone().normalize(), fieldLength);
        const transportedTip = point
            .clone()
            .addScaledVector(transported.clone().normalize(), transportedLength);
        const delta = fieldTip.clone().sub(transportedTip);
        const deltaLength = delta.length();
        if (deltaLength < MIN_ARROW_LENGTH) {
            deltaArrow.visible = false;
            deltaLabel.visible = false;
            return;
        }

        const deltaDirection = delta.clone().normalize();
        deltaArrow.position.copy(transportedTip);
        deltaArrow.setDirection(deltaDirection);
        deltaArrow.setLength(deltaLength, deltaLength * 0.35, deltaLength * 0.22);
        deltaArrow.setColor(deltaColor);
        deltaArrow.visible = true;

        const midpoint = transportedTip.clone().add(fieldTip).multiplyScalar(0.5);
        const side = new THREE.Vector3().crossVectors(deltaDirection, normal).normalize();
        deltaLabel.position.copy(midpoint).addScaledVector(side, 0.16);
        deltaLabel.visible = true;
    }

    placeAtTheta(THETA_SELECTED);

    // -----------------------------------------------------------------
    // Drag the tangent point along the path
    // -----------------------------------------------------------------
    const { update: updatePointer } = createPointerState(THREE, canvas, camera);
    let dragging = false;

    const pickTheta = (event) => {
        const hits = updatePointer(event).intersectObject(surface, false);
        if (hits.length === 0) return null;
        const hit = hits[0];
        const theta = Math.atan2(hit.point.y, hit.point.x);
        if (surfacePoint(theta).distanceTo(hit.point) > 0.35) return null;
        return theta;
    };

    const onPointerDown = (event) => {
        const theta = pickTheta(event);
        if (theta === null) return;
        dragging = true;
        cameraControls.enabled = false;
        placeAtTheta(theta);
    };
    const onPointerMove = (event) => {
        if (!dragging) return;
        const theta = pickTheta(event);
        if (theta !== null) placeAtTheta(theta);
    };
    const onPointerUp = () => {
        dragging = false;
        cameraControls.enabled = true;
    };
    attachPointerDrag(canvas, { onPointerDown, onPointerMove, onPointerUp });

    // -----------------------------------------------------------------
    // Controls and camera
    // -----------------------------------------------------------------
    helpers.addControlWidget({
        type: 'checkbox',
        label: 'Field Vectors',
        checked: true,
        action: (checked) => {
            fieldArrows.visible = checked;
        },
    });
    helpers.addControlWidget({
        type: 'checkbox',
        label: 'Tangent Plane',
        checked: true,
        action: (checked) => {
            tangentGroup.visible = checked;
        },
    });
    helpers.addControlWidget({
        type: 'checkbox',
        label: 'Wireframe',
        checked: false,
        action: (checked) => {
            wireframe.visible = checked;
        },
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

    const home = new THREE.Vector3(0, 1.6, 3.4);
    camera.position.copy(home);
    cameraControls.target.set(0, 0, 0);
    cameraControls.minDistance = 1.4;
    cameraControls.update();
}

// Parametrizes the downward paraboloid over a disk of `radius`.
function buildSurfaceGeometry(THREE, c, radius) {
    const radialSegments = 40;
    const angularSegments = 96;
    const vertices = [];
    const indices = [];

    for (let i = 0; i <= radialSegments; i++) {
        const r = radius * (i / radialSegments);
        for (let j = 0; j <= angularSegments; j++) {
            const theta = 2 * Math.PI * (j / angularSegments);
            const x = r * Math.cos(theta);
            const y = r * Math.sin(theta);
            const z = -c * (x * x + y * y);
            vertices.push(x, y, z);
        }
    }

    for (let i = 0; i < radialSegments; i++) {
        for (let j = 0; j < angularSegments; j++) {
            const a = i * (angularSegments + 1) + j;
            const b = a + 1;
            const d = a + angularSegments + 1;
            const e = d + 1;
            indices.push(a, d, b, b, d, e);
        }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
}
