// Scalar and vector fields on a manifold, demonstrated on the cow surface.
//
// Left cow: a scalar field sampled from 3D simplex noise at every vertex and
// colored through the Viridis colormap.
// Right cow: three channels of 3D simplex noise form a smooth vector field;
// each vector is projected onto the vertex tangent plane and drawn as an
// arrow at a farthest-point-sampled subset of vertices. Arrow length is
// proportional to the projected magnitude, capped at a maximum length.
// The cow is translucent so hidden arrows stay visible; a draggable point
// shows the tangent plane and tangent vector at the picked surface location.
//
// cow.obj has no per-vertex normals, so the loader computes smooth vertex
// normals with BufferGeometry.computeVertexNormals() before projecting.
import { loadCowGeometry } from '../../shared/cow-loader.js';
import { createPointerState, attachPointerDrag } from '../../shared/pointer-drag.js';

export default async function (scene, camera, canvas, initialView, helpers) {
    const { THREE, OBJLoader, mergeVertices } = helpers;
    const cameraControls = helpers.cameraControls.createOrbit();

    const COW_SCALE = 2.25;
    const LEFT_X = -1.7;
    const RIGHT_X = 1.7;
    const MAX_ARROWS = 1000;
    const MIN_ARROW_SPACING = 0.1;

    const geometry = await loadCowGeometry(THREE, OBJLoader, mergeVertices, COW_SCALE);
    const position = geometry.attributes.position;
    const normal = geometry.attributes.normal;
    const vertexCount = position.count;

    // -----------------------------------------------------------------
    // Left cow: scalar noise visualized with the Viridis colormap
    // -----------------------------------------------------------------
    const scalarNoise = helpers.createNoise3D();
    const scalarValues = new Float32Array(vertexCount);
    let minValue = Infinity;
    let maxValue = -Infinity;
    const tmp = new THREE.Vector3();
    for (let i = 0; i < vertexCount; i++) {
        tmp.fromBufferAttribute(position, i);
        const value = fbm(scalarNoise, tmp.x, tmp.y, tmp.z, 4, 0.5, 2, 0.55);
        scalarValues[i] = value;
        if (value < minValue) minValue = value;
        if (value > maxValue) maxValue = value;
    }
    const valueRange = maxValue - minValue || 1;

    const scalarGeometry = geometry.clone();
    const colors = new Float32Array(vertexCount * 3);
    const color = new THREE.Color();
    for (let i = 0; i < vertexCount; i++) {
        color.setStyle(helpers.interpolateViridis((scalarValues[i] - minValue) / valueRange));
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }
    scalarGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const scalarMaterial = new THREE.MeshPhongMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        shininess: 40,
    });
    const scalarCow = new THREE.Mesh(scalarGeometry, scalarMaterial);
    scalarCow.position.x = LEFT_X;
    scene.add(scalarCow);

    // -----------------------------------------------------------------
    // Right cow: vector noise projected onto each vertex tangent plane
    // -----------------------------------------------------------------
    const vectorNoises = [
        helpers.createNoise3D(),
        helpers.createNoise3D(),
        helpers.createNoise3D(),
    ];
    const tangents = new Float32Array(vertexCount * 3);
    const tangentMags = new Float32Array(vertexCount);
    const normalVec = new THREE.Vector3();
    const refUp = new THREE.Vector3(0, 1, 0);
    const refRight = new THREE.Vector3(1, 0, 0);
    const fallback = new THREE.Vector3();
    for (let i = 0; i < vertexCount; i++) {
        tmp.fromBufferAttribute(position, i);
        const vx = fbm(vectorNoises[0], tmp.x, tmp.y, tmp.z, 3, 0.5, 2, 0.5);
        const vy = fbm(vectorNoises[1], tmp.x, tmp.y, tmp.z, 3, 0.5, 2, 0.5);
        const vz = fbm(vectorNoises[2], tmp.x, tmp.y, tmp.z, 3, 0.5, 2, 0.5);
        normalVec.fromBufferAttribute(normal, i).normalize();

        const dot = vx * normalVec.x + vy * normalVec.y + vz * normalVec.z;
        let tx = vx - dot * normalVec.x;
        let ty = vy - dot * normalVec.y;
        let tz = vz - dot * normalVec.z;
        let lengthSq = tx * tx + ty * ty + tz * tz;
        let magnitude = Math.sqrt(lengthSq);
        if (lengthSq < 1e-8) {
            const ref = Math.abs(normalVec.y) < 0.9 ? refUp : refRight;
            fallback.crossVectors(normalVec, ref).normalize();
            tx = fallback.x;
            ty = fallback.y;
            tz = fallback.z;
            magnitude = 0;
        }
        tangentMags[i] = magnitude;
        const dirScale = magnitude > 0 ? magnitude : 1;
        tangents[i * 3] = tx / dirScale;
        tangents[i * 3 + 1] = ty / dirScale;
        tangents[i * 3 + 2] = tz / dirScale;
    }

    const vectorMaterial = new THREE.MeshPhongMaterial({
        color: helpers.themeColors.accentSoft,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        shininess: 40,
    });
    const vectorCow = new THREE.Mesh(geometry.clone(), vectorMaterial);
    vectorCow.position.x = RIGHT_X;
    scene.add(vectorCow);

    // Sample roughly equally spaced vertices and draw a tangent arrow at each.
    const arrowGroup = new THREE.Group();
    arrowGroup.position.x = RIGHT_X;
    const sampled = farthestPointSample(position, MAX_ARROWS, MIN_ARROW_SPACING);
    const vectorColor = new THREE.Color(helpers.themeColors.accent);
    const highlightColor = new THREE.Color(helpers.themeColors.error);
    const arrowColor = vectorColor;
    const MAX_ARROW_LENGTH = 0.1;
    const ARROW_SCALE = MAX_ARROW_LENGTH;
    const MIN_ARROW_LENGTH = 0.004;
    const arrowDir = new THREE.Vector3();
    const arrowOrigin = new THREE.Vector3();
    for (const index of sampled) {
        const rawLength = tangentMags[index] * ARROW_SCALE;
        if (rawLength < MIN_ARROW_LENGTH) continue;
        const arrowLength = Math.min(rawLength, MAX_ARROW_LENGTH);
        const arrowHead = arrowLength * 0.35;
        const arrowHeadWidth = arrowLength * 0.22;
        arrowOrigin.fromBufferAttribute(position, index);
        arrowDir.fromArray(tangents, index * 3);
        arrowGroup.add(
            new THREE.ArrowHelper(
                arrowDir,
                arrowOrigin,
                arrowLength,
                arrowColor,
                arrowHead,
                arrowHeadWidth,
            ),
        );
    }
    scene.add(arrowGroup);

    // Tangent-space visualization: a draggable point with its tangent plane
    // and one tangent vector, following the visual language of tangent-spaces.js.
    const tangentGroup = new THREE.Group();
    scene.add(tangentGroup);

    const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.07 * 0.25 * 0.5, 20, 20),
        new THREE.MeshBasicMaterial({ color: highlightColor }),
    );
    tangentGroup.add(marker);

    const tangentPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.7 * 0.5, 0.7 * 0.5),
        new THREE.MeshBasicMaterial({
            color: vectorColor,
            transparent: true,
            opacity: 0.22,
            side: THREE.DoubleSide,
            depthWrite: false,
        }),
    );
    tangentGroup.add(tangentPlane);

    const tangentArrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(),
        0.1,
        highlightColor,
        0.035,
        0.02,
    );
    tangentGroup.add(tangentArrow);

    function interpolateTangentAt(intersection, outNormal, outTangent) {
        const posAttr = geometry.attributes.position;
        const normAttr = geometry.attributes.normal;
        const ia = intersection.face.a;
        const ib = intersection.face.b;
        const ic = intersection.face.c;

        // The raycast hit point is in world space, while the triangle
        // vertices are local to the cow (which is translated by RIGHT_X).
        vectorCow.updateMatrixWorld();
        const localPoint = vectorCow.worldToLocal(intersection.point.clone());

        const va = new THREE.Vector3().fromBufferAttribute(posAttr, ia);
        const vb = new THREE.Vector3().fromBufferAttribute(posAttr, ib);
        const vc = new THREE.Vector3().fromBufferAttribute(posAttr, ic);
        const v0 = vb.sub(va);
        const v1 = vc.sub(va);
        const v2 = localPoint.sub(va);
        const d00 = v0.dot(v0);
        const d01 = v0.dot(v1);
        const d11 = v1.dot(v1);
        const d20 = v2.dot(v0);
        const d21 = v2.dot(v1);
        const denom = d00 * d11 - d01 * d01;
        const v = (d11 * d20 - d01 * d21) / denom;
        const w = (d00 * d21 - d01 * d20) / denom;
        const u = 1 - v - w;

        const na = new THREE.Vector3().fromBufferAttribute(normAttr, ia);
        const nb = new THREE.Vector3().fromBufferAttribute(normAttr, ib);
        const nc = new THREE.Vector3().fromBufferAttribute(normAttr, ic);
        outNormal
            .copy(na).multiplyScalar(u)
            .addScaledVector(nb, v)
            .addScaledVector(nc, w)
            .normalize();

        const ta = new THREE.Vector3().fromArray(tangents, ia * 3).multiplyScalar(tangentMags[ia]);
        const tb = new THREE.Vector3().fromArray(tangents, ib * 3).multiplyScalar(tangentMags[ib]);
        const tc = new THREE.Vector3().fromArray(tangents, ic * 3).multiplyScalar(tangentMags[ic]);
        outTangent
            .copy(ta).multiplyScalar(u)
            .addScaledVector(tb, v)
            .addScaledVector(tc, w);
    }

    function applyTangentVisualization(point, surfaceNormal, surfaceTangent) {
        marker.position.copy(point);
        tangentPlane.position.copy(point);
        tangentPlane.lookAt(point.clone().add(surfaceNormal));

        const magnitude = surfaceTangent.length();
        if (magnitude > 1e-6) {
            surfaceTangent.divideScalar(magnitude);
        } else {
            surfaceTangent.set(1, 0, 0);
        }
        tangentArrow.position.copy(point);
        tangentArrow.setDirection(surfaceTangent);
        const length = Math.min(magnitude * ARROW_SCALE, MAX_ARROW_LENGTH);
        if (length < MIN_ARROW_LENGTH) {
            tangentArrow.visible = false;
            return;
        }
        tangentArrow.setLength(length, length * 0.35, length * 0.22);
        tangentArrow.visible = true;
    }

    function updateTangent(intersection) {
        const surfaceNormal = new THREE.Vector3();
        const surfaceTangent = new THREE.Vector3();
        interpolateTangentAt(intersection, surfaceNormal, surfaceTangent);
        applyTangentVisualization(intersection.point, surfaceNormal, surfaceTangent);
    }

    function placeTangentAtVertex(index) {
        const surfacePoint = new THREE.Vector3()
            .fromBufferAttribute(position, index)
            .add(new THREE.Vector3(RIGHT_X, 0, 0));
        const surfaceNormal = new THREE.Vector3().fromBufferAttribute(normal, index).normalize();
        const surfaceTangent = new THREE.Vector3()
            .fromArray(tangents, index * 3)
            .multiplyScalar(tangentMags[index]);
        applyTangentVisualization(surfacePoint, surfaceNormal, surfaceTangent);
    }

    // Drag on the right cow to move the tangent point across the surface.
    const { update: updatePointer } = createPointerState(THREE, canvas, camera);
    let draggingTangent = false;

    const onPointerDown = (event) => {
        const hits = updatePointer(event).intersectObject(vectorCow, false);
        if (hits.length === 0) return;
        draggingTangent = true;
        cameraControls.enabled = false;
        updateTangent(hits[0]);
    };
    const onPointerMove = (event) => {
        if (!draggingTangent) return;
        const hits = updatePointer(event).intersectObject(vectorCow, false);
        if (hits.length > 0) updateTangent(hits[0]);
    };
    const onPointerUp = () => {
        draggingTangent = false;
        cameraControls.enabled = true;
    };
    attachPointerDrag(canvas, { onPointerDown, onPointerMove, onPointerUp });

    // Place the tangent point at a random cow vertex so it is guaranteed to
    // lie on the surface (raycasts from the initial camera can miss the cow).
    placeTangentAtVertex(sampled[Math.floor(Math.random() * sampled.length)]);

    // -----------------------------------------------------------------
    // Labels, controls, and camera
    // -----------------------------------------------------------------
    helpers.addControlWidget({
        type: 'checkbox',
        label: 'Arrows',
        checked: true,
        action: (checked) => {
            arrowGroup.visible = checked;
        },
    });
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
        label: 'Wireframe',
        checked: false,
        action: (checked) => {
            scalarMaterial.wireframe = checked;
            vectorMaterial.wireframe = checked;
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

    const home = new THREE.Vector3(0, 1.0, 3.2);
    camera.position.copy(home);
    cameraControls.target.set(0, 0, 0);
    cameraControls.minDistance = 2.2;
    cameraControls.update();
}

// Fractal Brownian motion over simplex noise, normalized to [-1, 1].
function fbm(noise, x, y, z, octaves, persistence, lacunarity, scale) {
    let value = 0;
    let amplitude = 1;
    let frequency = scale;
    let max = 0;
    for (let i = 0; i < octaves; i++) {
        value += amplitude * noise(x * frequency, y * frequency, z * frequency);
        max += amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
    }
    return value / max;
}

// Greedy farthest point sampling over vertex positions. Each new point is the
// vertex farthest from every previously selected point, so the result is
// roughly uniformly spaced; sampling stops at `maxPoints` or `minSpacing`.
function farthestPointSample(position, maxPoints, minSpacing) {
    const array = position.array;
    const count = position.count;
    const dist = new Float32Array(count).fill(Infinity);
    const selected = [];
    const spacingSq = minSpacing * minSpacing;
    let current = 0;

    for (let k = 0; k < maxPoints; k++) {
        selected.push(current);
        const x0 = array[current * 3];
        const y0 = array[current * 3 + 1];
        const z0 = array[current * 3 + 2];
        for (let i = 0; i < count; i++) {
            const dx = array[i * 3] - x0;
            const dy = array[i * 3 + 1] - y0;
            const dz = array[i * 3 + 2] - z0;
            const d = dx * dx + dy * dy + dz * dz;
            if (d < dist[i]) dist[i] = d;
        }

        let best = -1;
        let bestDist = -1;
        for (let i = 0; i < count; i++) {
            if (dist[i] > bestDist) {
                bestDist = dist[i];
                best = i;
            }
        }
        if (best === -1 || bestDist < spacingSq) break;
        current = best;
    }
    return selected;
}
