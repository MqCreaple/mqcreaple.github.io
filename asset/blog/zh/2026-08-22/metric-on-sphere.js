// Metric on the unit sphere and its spherical-coordinate chart.
//
// The left object is the unit sphere S^2 and the right object is the flat
// chart U (subset of R^2). Both are white by default; the optional Earth
// texture (toggled by a checkbox) is applied to both. The chart is the image
// of the spherical coordinates (theta, phi): the rectangle's height is theta
// in [0, pi] and its
// width (twice the height) is phi in [0, 2 pi]. The chart's vertical axis is
// inverted (theta = 0 at the top, theta = pi at the bottom) so the path runs
// top-left to bottom-right, matching the sphere.
//
// The amber curve on both objects is the path gamma(t) = (theta = t,
// phi = 2 t). The two draggable markers always share the same (theta, phi)
// and can only be dragged along the path: dragging one moves the other. At
// each marker a small tangent space is drawn:
//   - red   arrow: d/d(theta)
//   - green arrow: d/d(phi)
//   - amber arrow: path tangent gamma'(t) = d/d(theta) + 2 d/d(phi)
//   - indigo curve: the unit-magnitude vectors under the metric
//     g = d(theta)^2 + sin^2(theta) d(phi)^2 -- a circle on the sphere's
//     tangent plane, and on the chart an ellipse that stretches along the
//     phi direction near the poles.
//
// Controls: drag a marker to move it along the path (both move together),
// drag elsewhere to orbit, scroll to zoom, buttons to reset the point or the
// view, and a checkbox to toggle the Earth texture on the sphere and the chart.
export default async function (scene, camera, canvas, initialView, helpers) {
    const { THREE } = helpers;

    // Point on the sphere given by the spherical coordinates (theta, phi).
    function spherePoint(theta, phi, radius, out = new THREE.Vector3()) {
        const st = Math.sin(theta);
        return out.set(-radius * st * Math.cos(phi), radius * Math.cos(theta), radius * st * Math.sin(phi));
    }
    const cameraControls = helpers.cameraControls.createOrbit();

    // -----------------------------------------------------------------
    // Constants
    // -----------------------------------------------------------------
    const SPHERE_RADIUS = 1;
    const PLANE_HEIGHT = 2.0;             // theta in [0, pi]
    const PLANE_WIDTH = 2 * PLANE_HEIGHT; // phi in [0, 2 pi], width = 2 x height
    const TANGENT_SCALE = 0.5;            // physical length of a unit coordinate vector
    const DISC_RADIUS = 0.6;              // radius / half-side of the tangent surface
    const TANGENT_Z = 0.02;               // plane-tangent offset above the chart (anti z-fighting)
    const MIN_THETA = 0.15;               // the chart excludes the poles
    const MAX_THETA = Math.PI - MIN_THETA;
    const MAX_ELLIPSE_SEMI = 3.0;         // cap for the chart ellipse near the poles
    const METRIC_SCALE = 1 / 4;           // metric shape drawn at the given scale
    const PATH_SAMPLES = 1024;            // samples for the closest-path projection

    const PATH_COLOR = 0xf59e0b;   // amber   -- the path
    const THETA_COLOR = 0xef4444;  // red     -- d/d(theta)
    const PHI_COLOR = 0x22c55e;    // green   -- d/d(phi)
    const METRIC_COLOR = 0x6366f1; // indigo  -- unit-magnitude set under g
    const MARKER_COLOR = 0x1f2937; // near black
    const GRID_COLOR = 0xcbd5e1;   // faint graticule / grid

    // -----------------------------------------------------------------
    // Sphere and chart
    // -----------------------------------------------------------------
    // The objects are white by default; an optional Earth texture (toggled by
    // a checkbox) makes the local chart / metric ellipse more intuitive. The
    // texture is equirectangular, so the chart plane (theta = 0 at the top,
    // phi left to right) shows it with the same orientation as the sphere.
    const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const planeMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    let earthTexture = null;
    if (typeof document !== 'undefined') {
        earthTexture = new THREE.TextureLoader().load(
            '/blog/zh/2026-08-22/earth.jpg',
            undefined,
            undefined,
            () => {
                // If the texture cannot be loaded, fall back to the plain
                // white objects.
                sphereMaterial.map = null;
                planeMaterial.map = null;
                sphereMaterial.needsUpdate = true;
                planeMaterial.needsUpdate = true;
            },
        );
        earthTexture.colorSpace = THREE.SRGBColorSpace;
    }
    sphereMaterial.map = earthTexture;
    planeMaterial.map = earthTexture;
    if (earthTexture) {
        sphereMaterial.needsUpdate = true;
        planeMaterial.needsUpdate = true;
    }

    const sphereMesh = new THREE.Mesh(
        new THREE.SphereGeometry(SPHERE_RADIUS, 96, 64),
        sphereMaterial,
    );
    const sphereContainer = new THREE.Group();
    sphereContainer.position.set(-2.4, 0, 0);
    sphereContainer.add(sphereMesh);
    scene.add(sphereContainer);

    const planeMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(PLANE_WIDTH, PLANE_HEIGHT),
        planeMaterial,
    );
    planeMesh.position.set(2.4, 0, 0);
    scene.add(planeMesh);

    // Faint graticule on the sphere (latitudes every 15 deg, meridians every
    // 30 deg) so the winding of the path is easy to follow.
    const graticuleMat = new THREE.LineBasicMaterial({ color: GRID_COLOR, transparent: true, opacity: 0.5 });
    const R_GRID = SPHERE_RADIUS + 0.002;
    for (let i = 1; i <= 11; i++) {
        const th = (i * Math.PI) / 12;
        const pts = [];
        for (let j = 0; j <= 96; j++) {
            const ph = (j / 96) * 2 * Math.PI;
            pts.push(spherePoint(th, ph, R_GRID, new THREE.Vector3()));
        }
        sphereContainer.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), graticuleMat));
    }
    for (let i = 0; i < 12; i++) {
        const ph = (i * Math.PI) / 6;
        const pts = [];
        for (let j = 0; j <= 96; j++) {
            const th = (j / 96) * 2 * Math.PI;
            pts.push(spherePoint(th, ph, R_GRID, new THREE.Vector3()));
        }
        sphereContainer.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), graticuleMat));
    }

    // Faint coordinate grid on the chart: fixed phi vertical lines every 30
    // deg and fixed theta horizontal lines every 15 deg, matching the sphere's
    // graticule (meridians every 30 deg, latitudes every 15 deg).
    const gridMat = new THREE.LineBasicMaterial({ color: GRID_COLOR, transparent: true, opacity: 0.5 });
    for (let i = 0; i <= 12; i++) {
        const ph = (i * Math.PI) / 6;
        const x = (ph / (2 * Math.PI) - 0.5) * PLANE_WIDTH;
        const pts = [new THREE.Vector3(x, -PLANE_HEIGHT / 2, 0.003), new THREE.Vector3(x, PLANE_HEIGHT / 2, 0.003)];
        planeMesh.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
    }
    for (let i = 0; i <= 12; i++) {
        const th = (i * Math.PI) / 12;
        const y = (0.5 - th / Math.PI) * PLANE_HEIGHT;
        const pts = [new THREE.Vector3(-PLANE_WIDTH / 2, y, 0.003), new THREE.Vector3(PLANE_WIDTH / 2, y, 0.003)];
        planeMesh.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), gridMat));
    }

    // Path on the sphere: gamma(t) = (theta = t, phi = 2 t).
    const pathMat = new THREE.LineBasicMaterial({ color: PATH_COLOR });
    const R_PATH = SPHERE_RADIUS + 0.004;
    const spherePathPts = [];
    for (let i = 0; i <= 256; i++) {
        const t = (i / 256) * Math.PI;
        spherePathPts.push(spherePoint(t, 2 * t, R_PATH, new THREE.Vector3()));
    }
    sphereContainer.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(spherePathPts), pathMat));

    // Path on the chart: the rectangle's main diagonal.
    planeMesh.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-PLANE_WIDTH / 2, PLANE_HEIGHT / 2, 0.005),
            new THREE.Vector3(PLANE_WIDTH / 2, -PLANE_HEIGHT / 2, 0.005),
        ]),
        pathMat,
    ));

    // -----------------------------------------------------------------
    // Markers and tangent spaces
    // -----------------------------------------------------------------
    const markerMat = new THREE.MeshBasicMaterial({ color: MARKER_COLOR });
    const sphereMarker = new THREE.Mesh(new THREE.SphereGeometry(0.045, 20, 20), markerMat);
    sphereContainer.add(sphereMarker);
    const planeMarker = new THREE.Mesh(new THREE.SphereGeometry(0.045, 20, 20), markerMat);
    planeMesh.add(planeMarker);

    const tangentMat = new THREE.MeshBasicMaterial({
        color: 0xe2e8f0, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false,
    });

    // Sphere tangent group: local X = phi direction, Y = theta direction,
    // Z = outward normal (set per update from the point's basis).
    const sphereTangent = new THREE.Group();
    sphereTangent.add(new THREE.Mesh(new THREE.PlaneGeometry(DISC_RADIUS * 2, DISC_RADIUS * 2), tangentMat));
    sphereContainer.add(sphereTangent);

    // Chart tangent group: lifted slightly above the chart plane to avoid
    // z-fighting. The chart's vertical axis is inverted (theta = 0 at the
    // top), so chart-local Y is the -theta direction.
    const planeTangent = new THREE.Group();
    planeTangent.add(new THREE.Mesh(new THREE.PlaneGeometry(DISC_RADIUS * 2, DISC_RADIUS * 2), tangentMat));
    planeMesh.add(planeTangent);

    // Tangent vectors (in the tangent frame: X = phi, Y = theta).
    function makeArrow(group, color) {
        const arrow = new THREE.ArrowHelper(
            new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0.01), 1, color, 0.14, 0.09,
        );
        group.add(arrow);
        return arrow;
    }
    const thetaArrow = makeArrow(sphereTangent, THETA_COLOR);
    const phiArrow = makeArrow(sphereTangent, PHI_COLOR);
    const pathArrow = makeArrow(sphereTangent, PATH_COLOR);
    const planeThetaArrow = makeArrow(planeTangent, THETA_COLOR);
    const planePhiArrow = makeArrow(planeTangent, PHI_COLOR);
    const planePathArrow = makeArrow(planeTangent, PATH_COLOR);

    // Metric shape: a unit circle that is scaled into the unit-magnitude set
    // (circle on the sphere, ellipse on the chart).
    const unitCirclePts = [];
    for (let i = 0; i < 96; i++) {
        const a = (i / 96) * 2 * Math.PI;
        unitCirclePts.push(new THREE.Vector3(Math.cos(a), Math.sin(a), 0.01));
    }
    const unitCircleGeo = new THREE.BufferGeometry().setFromPoints(unitCirclePts);
    const metricMat = new THREE.LineBasicMaterial({ color: METRIC_COLOR });
    const sphereMetric = new THREE.Line(unitCircleGeo, metricMat);
    sphereTangent.add(sphereMetric);
    const planeMetric = new THREE.Line(unitCircleGeo.clone(), metricMat);
    planeTangent.add(planeMetric);

    // -----------------------------------------------------------------
    // State and update
    // -----------------------------------------------------------------
    // The point is constrained to the path, so phi = 2 theta.
    let theta = Math.PI / 4;
    const sphereMarkerWorld = new THREE.Vector3();
    const planeMarkerWorld = new THREE.Vector3();

    function setArrow(arrow, direction, length) {
        arrow.setDirection(direction);
        const headLen = Math.min(0.13, length * 0.45);
        const headWid = Math.min(0.09, length * 0.3);
        arrow.setLength(length, headLen, headWid);
    }

    function updateVisuals() {
        const phi = 2 * theta;
        const s = TANGENT_SCALE;
        const st = Math.sin(theta);
        const ct = Math.cos(theta);

        // Sphere marker and tangent frame.
        const p = spherePoint(theta, phi, SPHERE_RADIUS);
        sphereMarker.position.copy(p);
        sphereMarkerWorld.copy(p).add(sphereContainer.position);

        const n = p.clone().normalize();
        // d/d(theta) and d/d(phi) / sin(theta) of the sphere parametrization
        // x = -sin(theta) cos(phi), which matches the textured SphereGeometry.
        const redDir = new THREE.Vector3(-ct * Math.cos(phi), -st, ct * Math.sin(phi)); // d/d(theta)
        const greenDir = new THREE.Vector3(Math.sin(phi), 0, Math.cos(phi));           // d/d(phi) / sin(theta)
        sphereTangent.position.copy(p);
        // Local frame: X = phi direction, Y = -theta direction, Z = outward normal.
        // (The mirrored parametrization makes the natural (phi, theta, normal)
        // frame left-handed, so Y is negated to keep a proper rotation; the red
        // and path arrows are drawn along -Y, like on the chart.)
        sphereTangent.quaternion.setFromRotationMatrix(
            new THREE.Matrix4().makeBasis(greenDir, redDir.clone().negate(), n),
        );

        // Chart marker and tangent frame (chart local X = phi, Y = -theta;
        // vertical axis inverted so the path runs top-left to bottom-right).
        const px = (phi / (2 * Math.PI) - 0.5) * PLANE_WIDTH;
        const py = (0.5 - theta / Math.PI) * PLANE_HEIGHT;
        planeMarker.position.set(px, py, TANGENT_Z);
        planeMarkerWorld.set(
            planeMesh.position.x + px,
            planeMesh.position.y + py,
            planeMesh.position.z + TANGENT_Z,
        );
        planeTangent.position.set(px, py, TANGENT_Z);
        planeTangent.quaternion.identity();

        // Tangent vectors. On the sphere d/d(phi) has physical length sin(theta);
        // on the chart the coordinate vectors are the unit ones.
        const sphGreenLen = s * st;
        const sphPathX = 2 * s * st; // 2 d/d(phi) along X
        const sphPathY = s;          // 1 d/d(theta) along -Y
        const sphPathLen = Math.hypot(sphPathX, sphPathY);
        setArrow(thetaArrow, new THREE.Vector3(0, -1, 0), s);
        setArrow(phiArrow, new THREE.Vector3(1, 0, 0), sphGreenLen);
        setArrow(pathArrow, new THREE.Vector3(sphPathX, -sphPathY, 0).normalize(), sphPathLen);

        const plnPathLen = s * Math.sqrt(5);
        // On the chart, +theta is chart-local -Y (the vertical axis is inverted).
        setArrow(planeThetaArrow, new THREE.Vector3(0, -1, 0), s);
        setArrow(planePhiArrow, new THREE.Vector3(1, 0, 0), s);
        setArrow(planePathArrow, new THREE.Vector3(2, -1, 0).normalize(), plnPathLen);

        // Metric: unit vectors under g = d(theta)^2 + sin^2(theta) d(phi)^2,
        // drawn scaled so it stays small on the tangent plane. A circle
        // of radius s on the sphere; on the chart an ellipse with semi-axes
        // (s / sin(theta) along phi, s along theta), capped near the poles so
        // the ellipse does not explode.
        sphereMetric.scale.set(s * METRIC_SCALE, s * METRIC_SCALE, 1);
        const semiPhi = Math.min(s / Math.max(st, 1e-6), MAX_ELLIPSE_SEMI);
        planeMetric.scale.set(semiPhi * METRIC_SCALE, s * METRIC_SCALE, 1);
    }

    // -----------------------------------------------------------------
    // Drag the marker along the path
    // -----------------------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const tmpV = new THREE.Vector3();
    let dragMode = null;

    function updatePointer(e) {
        const rect = canvas.getBoundingClientRect();
        pointer.set(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1,
        );
    }

    // Closest path parameter t to a point on the unit sphere: maximize
    // P(t) . p over the sampled path P(t) = (-sin t cos 2t, cos t, sin t sin 2t).
    function closestPathT(p) {
        let best = 0;
        let bestDot = -Infinity;
        for (let i = 0; i <= PATH_SAMPLES; i++) {
            const t = (i / PATH_SAMPLES) * Math.PI;
            const st = Math.sin(t);
            tmpV.set(-st * Math.cos(2 * t), Math.cos(t), st * Math.sin(2 * t));
            const d = tmpV.dot(p);
            if (d > bestDot) {
                bestDot = d;
                best = t;
            }
        }
        return best;
    }

    function onPointerDown(e) {
        updatePointer(e);
        raycaster.setFromCamera(pointer, camera);

        const sphHits = raycaster.intersectObject(sphereMesh, false);
        if (sphHits.length > 0 && sphHits[0].point.distanceTo(sphereMarkerWorld) < 0.3) {
            dragMode = 'sphere';
            cameraControls.enabled = false;
            return;
        }

        const plnHits = raycaster.intersectObject(planeMesh, false);
        if (plnHits.length > 0 && plnHits[0].point.distanceTo(planeMarkerWorld) < 0.35) {
            dragMode = 'plane';
            cameraControls.enabled = false;
        }
    }

    function onPointerMove(e) {
        if (!dragMode) return;
        updatePointer(e);
        raycaster.setFromCamera(pointer, camera);

        if (dragMode === 'sphere') {
            // Project the hit point onto the path, then clamp to the chart
            // domain (the poles are excluded).
            const hits = raycaster.intersectObject(sphereMesh, false);
            if (hits.length > 0) {
                const local = sphereContainer.worldToLocal(hits[0].point.clone()).normalize();
                theta = THREE.MathUtils.clamp(closestPathT(local), MIN_THETA, MAX_THETA);
                updateVisuals();
            }
        } else {
            // Project the hit point onto the chart's main diagonal (the path).
            const hits = raycaster.intersectObject(planeMesh, false);
            if (hits.length > 0) {
                const local = planeMesh.worldToLocal(hits[0].point.clone());
                const s = THREE.MathUtils.clamp(
                    ((local.x + PLANE_WIDTH / 2) * PLANE_WIDTH - (local.y - PLANE_HEIGHT / 2) * PLANE_HEIGHT)
                        / (PLANE_WIDTH * PLANE_WIDTH + PLANE_HEIGHT * PLANE_HEIGHT),
                    0,
                    1,
                );
                theta = THREE.MathUtils.clamp(s * Math.PI, MIN_THETA, MAX_THETA);
                updateVisuals();
            }
        }
    }

    function onPointerUp() {
        if (dragMode) {
            dragMode = null;
            cameraControls.enabled = true;
        }
    }

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    // -----------------------------------------------------------------
    // Camera and controls
    // -----------------------------------------------------------------
    const home = new THREE.Vector3(0, 0.7, 4.6);
    camera.position.copy(home);
    cameraControls.target.set(0, 0, 0);
    cameraControls.update();

    helpers.addControlWidget({
        type: 'checkbox',
        label: 'Earth Texture',
        checked: true,
        action: (checked) => {
            sphereMaterial.map = checked ? earthTexture : null;
            planeMaterial.map = checked ? earthTexture : null;
            sphereMaterial.needsUpdate = true;
            planeMaterial.needsUpdate = true;
        },
    });
    helpers.addControlWidget({
        type: 'button',
        label: 'Reset Point',
        action: () => {
            theta = Math.PI / 4;
            updateVisuals();
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

    updateVisuals();
}
