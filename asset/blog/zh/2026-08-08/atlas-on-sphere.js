// Atlas on the sphere: a white sphere (loaded from sphere.obj) covered by
// four charts, each with a flat counterpart offset from the sphere to
// illustrate the homeomorphism between the chart and a subset of R^2:
//   - red   : north polar cap (theta 0 .. pi/6)
//   - blue  : south polar cap (theta 5pi/6 .. pi)
//   - yellow: equatorial band (65N..65S), slightly over 180 deg of longitude
//   - green : equatorial band (65N..65S), the same but shifted by 180 deg
// Each chart and its flat counterpart share the same vertex grid (a one-to-one
// vertex correspondence). The sphere has no wireframe; the charts do. Each
// chart is shown/hidden with a checkbox (hidden by default).
//
// Controls: drag to orbit, scroll to zoom, and checkboxes to toggle charts.
export default async function (scene, camera, canvas, initialView, helpers) {
    const { THREE } = helpers;
    const cameraControls = helpers.cameraControls.createOrbit();

    // 1. White sphere (built-in, no wireframe).
    const sphereGeometry = new THREE.SphereGeometry(1, 96, 64);
    const sphere = new THREE.Mesh(
        sphereGeometry,
        new THREE.MeshPhongMaterial({ color: 0xffffff, side: THREE.DoubleSide }),
    );
    scene.add(sphere);

    // 2. Chart definitions (theta: polar angle from the north pole).
    const R = 1.0;            // sphere radius
    const R_SURFACE = 1.01;   // charts sit a hair above the sphere (no z-fighting)
    const OFFSET = 0.35;      // flat counterparts offset outward by this much
    const FLAT_RADIUS = 0.5;  // radius of the polar flat disks
    const FLAT_SCALE = 0.6;   // scale of the equatorial flat rectangles

    const charts = [
        {
            name: 'North Cap', color: 0xef4444, kind: 'cap', pole: 'north',
            theta: [0, Math.PI / 6], phi: [0, 2 * Math.PI], nTheta: 10, nPhi: 32,
        },
        {
            name: 'South Cap', color: 0x3b82f6, kind: 'cap', pole: 'south',
            theta: [(5 * Math.PI) / 6, Math.PI], phi: [0, 2 * Math.PI], nTheta: 10, nPhi: 32,
        },
        {
            name: 'Equator A', color: 0xfacc15, kind: 'band',
            theta: [(5 * Math.PI) / 36, (31 * Math.PI) / 36], phi: [0, (19 * Math.PI) / 18],
            nTheta: 12, nPhi: 24,
        },
        {
            name: 'Equator B', color: 0x22c55e, kind: 'band',
            theta: [(5 * Math.PI) / 36, (31 * Math.PI) / 36], phi: [Math.PI, Math.PI + (19 * Math.PI) / 18],
            nTheta: 12, nPhi: 24,
        },
    ];

    const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x141414 });

    // 3. Build each chart group (curved chart + flat counterpart, both with
    //    wireframes) and a checkbox to toggle it.
    for (const chart of charts) {
        const group = new THREE.Group();
        const { curvedGeo, flatGeo } = buildChartPair(
            THREE, chart, R, R_SURFACE, OFFSET, FLAT_RADIUS, FLAT_SCALE,
        );
        const material = new THREE.MeshPhongMaterial({
            color: chart.color,
            side: THREE.DoubleSide,
            flatShading: false,
            shininess: 40,
        });

        const curved = new THREE.Mesh(curvedGeo, material);
        curved.add(new THREE.LineSegments(new THREE.WireframeGeometry(curvedGeo), wireframeMaterial));
        group.add(curved);

        const flat = new THREE.Mesh(flatGeo, material);
        flat.add(new THREE.LineSegments(new THREE.WireframeGeometry(flatGeo), wireframeMaterial));
        group.add(flat);

        group.visible = false;
        scene.add(group);

        helpers.addControlWidget({
            type: 'checkbox',
            label: chart.name,
            checked: false,
            action: (checked) => {
                group.visible = checked;
            },
        });
    }

    // 4. Orbit camera framing the sphere.
    const home = new THREE.Vector3(0, 0.8, 3.0);
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
}

// Builds a chart's curved mesh (on the sphere) and its flat counterpart.
// Both meshes share the exact same vertex grid and index array, so there is a
// one-to-one correspondence between the vertices of the two meshes.
function buildChartPair(THREE, chart, R, RSurface, offset, flatRadius, flatScale) {
    const nTheta = chart.nTheta;
    const nPhi = chart.nPhi;
    const th0 = chart.theta[0], th1 = chart.theta[1];
    const ph0 = chart.phi[0], ph1 = chart.phi[1];
    const thc = (th0 + th1) / 2;
    const phc = (ph0 + ph1) / 2;

    // Chart center direction and two perpendicular in-plane directions.
    let center, eU, eV;
    if (chart.kind === 'cap') {
        center = chart.pole === 'north'
            ? new THREE.Vector3(0, 1, 0)
            : new THREE.Vector3(0, -1, 0);
        eU = new THREE.Vector3(1, 0, 0);
        eV = new THREE.Vector3(0, 0, 1);
    } else {
        center = new THREE.Vector3(
            Math.cos(phc) * Math.sin(thc),
            Math.cos(thc),
            Math.sin(phc) * Math.sin(thc),
        );
        eU = new THREE.Vector3(-Math.sin(phc), 0, Math.cos(phc));          // longitude
        eV = new THREE.Vector3(
            Math.cos(thc) * Math.cos(phc),
            -Math.sin(thc),
            Math.cos(thc) * Math.sin(phc),
        );                                                                 // latitude
    }

    const curvedPos = [];
    const flatPos = [];
    const tmp = new THREE.Vector3();
    for (let i = 0; i <= nTheta; i++) {
        const th = th0 + ((th1 - th0) * i) / nTheta;
        for (let j = 0; j <= nPhi; j++) {
            const ph = ph0 + ((ph1 - ph0) * j) / nPhi;
            const s = Math.sin(th);

            // Curved vertex: on the sphere.
            curvedPos.push(RSurface * s * Math.cos(ph), RSurface * Math.cos(th), RSurface * s * Math.sin(ph));

            // Flat vertex: map (th, ph) onto the flat counterpart.
            let U, V;
            if (chart.kind === 'cap') {
                const frac = chart.pole === 'north'
                    ? (th - th0) / (th1 - th0)   // 0 at the pole
                    : (th1 - th) / (th1 - th0);
                const r = flatRadius * frac;
                const ang = ph - phc;
                U = r * Math.cos(ang);
                V = r * Math.sin(ang);
            } else {
                U = flatScale * R * (ph - phc);
                V = flatScale * R * (th - thc);
            }
            tmp.copy(center).multiplyScalar(R + offset);
            tmp.addScaledVector(eU, U).addScaledVector(eV, V);
            flatPos.push(tmp.x, tmp.y, tmp.z);
        }
    }

    const indices = [];
    for (let i = 0; i < nTheta; i++) {
        for (let j = 0; j < nPhi; j++) {
            const a = i * (nPhi + 1) + j;
            const b = a + 1;
            const c = a + (nPhi + 1);
            const d = c + 1;
            indices.push(a, c, b, b, c, d);
        }
    }

    const curvedGeo = new THREE.BufferGeometry();
    curvedGeo.setAttribute('position', new THREE.Float32BufferAttribute(curvedPos, 3));
    curvedGeo.setIndex(indices);
    curvedGeo.computeVertexNormals();

    const flatGeo = new THREE.BufferGeometry();
    flatGeo.setAttribute('position', new THREE.Float32BufferAttribute(flatPos, 3));
    flatGeo.setIndex(indices);
    flatGeo.computeVertexNormals();

    return { curvedGeo, flatGeo };
}
