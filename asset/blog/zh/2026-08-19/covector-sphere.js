// Covector field on a sphere.
//
// A smooth scalar function f is generated as the restriction of an analytical
// R^3 function F(x,y,z) = sum_i A_i sin(k_i . (x,y,z) + phi_i) to the unit
// sphere. The differential df_p is computed analytically by projecting the
// Euclidean gradient onto the tangent plane, then visualized as parallel
// level-set lines on a draggable tangent plane.
//
// Left sphere: colors show f(p). Right sphere: contour lines of f. The red
// marker on the right sphere can be dragged; the small tangent plane around it
// draws the covector df_p as parallel green lines.
export default async function (scene, camera, canvas, initialView, helpers) {
    const { THREE } = helpers;
    const cameraControls = helpers.cameraControls.createOrbit();

    const WAVE_COUNT = 5;
    const waves = [];

    function generateWaves() {
        const result = [];
        for (let i = 0; i < WAVE_COUNT; i++) {
            const k = new THREE.Vector3(
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
                Math.random() * 2 - 1,
            )
                .normalize()
                .multiplyScalar(1.0 + Math.random() * 2.0);
            result.push({
                k,
                amp: 0.4 + Math.random() * 0.6,
                phase: Math.random() * Math.PI * 2,
            });
        }
        return result;
    }

    function setWaves(newWaves) {
        waves.length = 0;
        waves.push(...newWaves);
        uniforms.uK.value = waves.map((w) => w.k);
        uniforms.uAmp.value = waves.map((w) => w.amp);
        uniforms.uPhase.value = waves.map((w) => w.phase);
        estimateRange();
    }

    function F(p) {
        let sum = 0;
        for (const w of waves) {
            sum += w.amp * Math.sin(p.dot(w.k) + w.phase);
        }
        return sum;
    }

    function gradF(p) {
        const g = new THREE.Vector3(0, 0, 0);
        for (const w of waves) {
            const c = Math.cos(p.dot(w.k) + w.phase);
            g.addScaledVector(w.k, w.amp * c);
        }
        return g;
    }

    const rightCenter = new THREE.Vector3(1.4, 0, 0);

    // Project the Euclidean gradient onto the tangent plane of the sphere at p.
    // The shader evaluates f on a unit sphere centered at the origin, so we use
    // the local point p - center to stay consistent with the rendered field.
    function surfaceGradient(p, center) {
        const localP = p.clone().sub(center);
        const g = gradF(localP);
        const n = localP.normalize();
        g.addScaledVector(n, -g.dot(n));
        return g;
    }

    let fMin = 0;
    let fMax = 0;
    let fRange = 1;

    function estimateRange() {
        let lo = Infinity;
        let hi = -Infinity;
        for (let i = 0; i < 2000; i++) {
            const phi = Math.acos(2 * Math.random() - 1);
            const theta = Math.random() * Math.PI * 2;
            const sample = new THREE.Vector3(
                Math.sin(phi) * Math.cos(theta),
                Math.sin(phi) * Math.sin(theta),
                Math.cos(phi),
            );
            const v = F(sample);
            lo = Math.min(lo, v);
            hi = Math.max(hi, v);
        }
        fRange = Math.max(hi - lo, 0.01);
        fMin = lo - 0.05 * fRange;
        fMax = hi + 0.05 * fRange;
        uniforms.uMinF.value = fMin;
        uniforms.uMaxF.value = fMax;
        contourUniforms.uContourStep.value = fRange / 8.0;
    }

    const uniforms = {
        uWaveCount: { value: WAVE_COUNT },
        uK: { value: [] },
        uAmp: { value: [] },
        uPhase: { value: [] },
        uMinF: { value: 0 },
        uMaxF: { value: 1 },
    };

    // Right sphere: contour lines on a light background.
    const contourUniforms = {
        uWaveCount: uniforms.uWaveCount,
        uK: uniforms.uK,
        uAmp: uniforms.uAmp,
        uPhase: uniforms.uPhase,
        uContourStep: { value: fRange / 8.0 },
        uContourWidth: { value: 0.04 },
        uContourColor: { value: new THREE.Color(0x222222) },
        uSphereColor: { value: new THREE.Color(0xf5f5f5) },
    };

    setWaves(generateWaves());

    // Shader snippets shared by both spheres.
    const fragmentHeader = `
        uniform int uWaveCount;
        uniform vec3 uK[${WAVE_COUNT}];
        uniform float uAmp[${WAVE_COUNT}];
        uniform float uPhase[${WAVE_COUNT}];

        varying vec3 vPosition;

        float F(vec3 p) {
            float sum = 0.0;
            for (int i = 0; i < ${WAVE_COUNT}; i++) {
                if (i >= uWaveCount) break;
                sum += uAmp[i] * sin(dot(p, uK[i]) + uPhase[i]);
            }
            return sum;
        }
    `;

    const vertexShader = `
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    const sphereGeometry = new THREE.SphereGeometry(1, 144, 96);

    // Left sphere: color mapped by f.
    const colorMaterial = new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader: `
            ${fragmentHeader}
            uniform float uMinF;
            uniform float uMaxF;

            // Polynomial approximation of the viridis colormap.
            vec3 viridis(float t) {
                const vec3 c0 = vec3(0.2777273272234177, 0.005407379545678997, 0.3340998053353062);
                const vec3 c1 = vec3(0.1050930431085774, 1.4046115499515331, 1.3845901625946858);
                const vec3 c2 = vec3(-0.3308618287255563, 0.2148475593827136, 0.09509516302823659);
                const vec3 c3 = vec3(-4.634230498983486, -5.799100973351585, -19.33244095627987);
                const vec3 c4 = vec3(6.228269936347081, 14.17993336680509, 56.69055260068105);
                const vec3 c5 = vec3(4.776384997670288, -13.74514537774601, -65.35395263337237);
                const vec3 c6 = vec3(-5.435455855934631, 4.645852612178925, 26.3124352495832);
                return c0 + t * (c1 + t * (c2 + t * (c3 + t * (c4 + t * (c5 + t * c6)))));
            }

            void main() {
                vec3 p = normalize(vPosition);
                float f = F(p);
                float t = clamp((f - uMinF) / (uMaxF - uMinF), 0.0, 1.0);
                gl_FragColor = vec4(viridis(t), 1.0);
            }
        `,
    });

    const leftSphere = new THREE.Mesh(sphereGeometry, colorMaterial);
    leftSphere.position.set(-1.4, 0, 0);
    scene.add(leftSphere);


    const contourMaterial = new THREE.ShaderMaterial({
        uniforms: contourUniforms,
        vertexShader,
        fragmentShader: `
            ${fragmentHeader}
            uniform float uContourStep;
            uniform float uContourWidth;
            uniform vec3 uContourColor;
            uniform vec3 uSphereColor;

            vec3 gradF(vec3 p) {
                vec3 g = vec3(0.0);
                for (int i = 0; i < ${WAVE_COUNT}; i++) {
                    if (i >= uWaveCount) break;
                    float c = cos(dot(p, uK[i]) + uPhase[i]);
                    g += uAmp[i] * uK[i] * c;
                }
                return g;
            }

            void main() {
                vec3 p = normalize(vPosition);
                float f = F(p);
                float n = f / uContourStep;
                float frac = fract(n);
                float d = min(frac, 1.0 - frac);

                // Scale distance by gradient magnitude so contour lines have
                // approximately uniform screen thickness regardless of slope.
                vec3 gf = gradF(p);
                float gradLen = length(gf) / uContourStep;
                gradLen = max(gradLen, 1e-4);

                float line = 1.0 - smoothstep(0.0, uContourWidth, d / gradLen * 8.0);
                vec3 color = mix(uSphereColor, uContourColor, line);
                gl_FragColor = vec4(color, 1.0);
            }
        `,
    });

    const rightSphere = new THREE.Mesh(sphereGeometry.clone(), contourMaterial);
    rightSphere.position.set(1.4, 0, 0);
    scene.add(rightSphere);

    // Draggable marker and tangent-plane covector visualization.
    const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0xff3333, depthTest: false }),
    );
    scene.add(marker);

    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.7, 0.7),
        new THREE.MeshBasicMaterial({
            color: 0xff3333,
            transparent: true,
            opacity: 0.18,
            side: THREE.DoubleSide,
            depthWrite: false,
        }),
    );
    scene.add(plane);

    const lineGroup = new THREE.Group();
    scene.add(lineGroup);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x006400, linewidth: 2 });

    let p = new THREE.Vector3(0.6, 0.5, 0.6).normalize().add(rightCenter);

    function updateCovector(pos) {
        p.copy(pos);
        const n = p.clone().sub(rightCenter).normalize();
        const g = surfaceGradient(p, rightCenter);
        const gLen = g.length();

        marker.position.copy(p);
        plane.position.copy(p);
        plane.lookAt(p.clone().add(n));

        lineGroup.clear();

        if (gLen < 1e-6) return;

        const e1 = g.clone().normalize();
        const e2 = new THREE.Vector3().crossVectors(n, e1).normalize();

        const halfSize = 0.32;
        const spacing = 0.1 / gLen;
        const kMax = Math.ceil(halfSize / spacing);

        for (let k = -kMax; k <= kMax; k++) {
            const a = k * spacing;
            if (Math.abs(a) > halfSize + 1e-6) continue;
            const p0 = p.clone().addScaledVector(e1, a).addScaledVector(e2, -halfSize);
            const p1 = p.clone().addScaledVector(e1, a).addScaledVector(e2, halfSize);
            const geometry = new THREE.BufferGeometry().setFromPoints([p0, p1]);
            const line = new THREE.Line(geometry, lineMaterial);
            lineGroup.add(line);
        }
    }

    updateCovector(p);

    // Drag the red marker along the right sphere; drag elsewhere orbits.
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let dragging = false;

    function updatePointer(e) {
        const rect = canvas.getBoundingClientRect();
        pointer.set(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1,
        );
    }

    function onPointerDown(e) {
        updatePointer(e);
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObject(rightSphere, false);
        if (hits.length === 0) return;
        dragging = true;
        cameraControls.enabled = false;
        updateCovector(hits[0].point);
    }

    function onPointerMove(e) {
        if (!dragging) return;
        updatePointer(e);
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObject(rightSphere, false);
        if (hits.length > 0) updateCovector(hits[0].point);
    }

    function onPointerUp() {
        if (dragging) {
            dragging = false;
            cameraControls.enabled = true;
        }
    }

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    // Camera and controls.
    const home = new THREE.Vector3(0, 0.8, 4.2);
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
        type: 'button',
        label: 'New Function',
        action: () => {
            setWaves(generateWaves());
            updateCovector(p);
        },
    });
}
