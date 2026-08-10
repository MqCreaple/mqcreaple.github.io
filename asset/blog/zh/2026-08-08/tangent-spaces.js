// Tangent spaces at different points: two points p and q on a sphere, each
// with its tangent plane and one vector on that plane. Dragging a point
// moves it along the sphere (its tangent plane and vector follow), which
// illustrates that T_p M and T_q M are different vector spaces. Dragging
// elsewhere orbits the camera.
//
// Controls: drag a point to move it on the sphere, drag elsewhere to orbit,
// and buttons to randomize the points or reset the view.
export default async function (scene, camera, canvas, initialView, helpers) {
    const { THREE } = helpers;
    const cameraControls = helpers.cameraControls.createOrbit();

    // 1. White sphere (built-in).
    const sphereGeometry = new THREE.SphereGeometry(1, 96, 64);
    const sphere = new THREE.Mesh(
        sphereGeometry,
        new THREE.MeshPhongMaterial({ color: 0xffffff, side: THREE.DoubleSide }),
    );
    scene.add(sphere);
    const R = 1.0;

    // 2. Points p and q with tangent planes, vectors, and labels.
    const pointData = [
        { label: 'p', color: 0xef4444, cssColor: '#ef4444' },
        { label: 'q', color: 0x3b82f6, cssColor: '#3b82f6' },
    ];
    for (const d of pointData) {
        d.marker = new THREE.Mesh(
            new THREE.SphereGeometry(0.05, 20, 20),
            new THREE.MeshBasicMaterial({ color: d.color }),
        );
        scene.add(d.marker);

        d.plane = new THREE.Mesh(
            new THREE.PlaneGeometry(0.72, 0.72),
            new THREE.MeshBasicMaterial({
                color: d.color,
                transparent: true,
                opacity: 0.35,
                side: THREE.DoubleSide,
                depthWrite: false,
            }),
        );
        scene.add(d.plane);

        d.arrow = new THREE.ArrowHelper(
            new THREE.Vector3(0, 0, 1), new THREE.Vector3(), 0.5, d.color, 0.14, 0.08,
        );
        scene.add(d.arrow);

        d.label = helpers.makeTextSprite(d.label, d.cssColor);
        scene.add(d.label);
    }

    // 3. Tangent frame at a point: up = surface normal, forward = the
    //    projection of a reference direction onto the tangent plane.
    const refA = new THREE.Vector3(0, 0, 1);
    const refB = new THREE.Vector3(1, 0, 0);
    function placePoint(d, pos) {
        d.pos = pos.clone();
        d.marker.position.copy(pos);

        const up = pos.clone().normalize();
        let ref = refA.clone().addScaledVector(up, -refA.dot(up));
        if (ref.lengthSq() < 1e-6) {
            ref = refB.clone().addScaledVector(up, -refB.dot(up));
        }
        const forward = ref.normalize();

        d.plane.position.copy(pos);
        d.plane.lookAt(pos.clone().add(up));

        d.arrow.position.copy(pos);
        d.arrow.setDirection(forward);

        d.label.position.copy(pos).addScaledVector(up, 0.18);
    }

    function randomUnit() {
        const v = new THREE.Vector3();
        do {
            v.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
        } while (v.lengthSq() > 1 || v.lengthSq() < 1e-6);
        return v.normalize().multiplyScalar(R);
    }
    function randomize() {
        placePoint(pointData[0], randomUnit());
        let q;
        do { q = randomUnit(); } while (q.distanceTo(pointData[0].pos) < 0.6 * R);
        placePoint(pointData[1], q);
    }

    // 4. Drag a point along the sphere (raycast to the sphere); dragging
    //    elsewhere orbits (OrbitControls stays enabled).
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let selected = null;

    const updatePointer = (e) => {
        const rect = canvas.getBoundingClientRect();
        pointer.set(
            ((e.clientX - rect.left) / rect.width) * 2 - 1,
            -((e.clientY - rect.top) / rect.height) * 2 + 1,
        );
    };
    const onPointerDown = (e) => {
        updatePointer(e);
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObject(sphere, false);
        if (hits.length === 0) return;
        const hit = hits[0].point;
        let best = null;
        let bestDist = 0.25;
        for (const d of pointData) {
            const dist = hit.distanceTo(d.pos);
            if (dist < bestDist) { bestDist = dist; best = d; }
        }
        if (best) {
            selected = best;
            cameraControls.enabled = false; // suppress orbit while dragging the point
        }
    };
    const onPointerMove = (e) => {
        if (!selected) return;
        updatePointer(e);
        raycaster.setFromCamera(pointer, camera);
        const hits = raycaster.intersectObject(sphere, false);
        if (hits.length > 0) placePoint(selected, hits[0].point.clone());
    };
    const onPointerUp = () => {
        if (selected) {
            selected = null;
            cameraControls.enabled = true;
        }
    };
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    // 5. Camera + controls.
    const home = new THREE.Vector3(0, 0.6, 3.2);
    camera.position.copy(home);
    cameraControls.target.set(0, 0, 0);
    cameraControls.update();

    helpers.addControlWidget({
        type: 'button',
        label: 'Random Points',
        action: randomize,
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

    randomize();
}
