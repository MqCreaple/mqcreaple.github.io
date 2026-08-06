// AprilTag duality diagram — 具体三维对象定义
export default function (scene, camera, controls, initialView, addControl, helpers) {
    const { THREE, makeTextSprite, toggleLabels } = helpers;

    // 将三维点投影到 z = -1 平面
    function projectToPlaneZ(point, planeZ = -1) {
        const t = planeZ / point.z;
        return new THREE.Vector3(point.x * t, point.y * t, planeZ);
    }

    addControl({
        type: 'button',
        label: 'Reset View',
        action: () => helpers.resetView(),
    });

    // -----------------------------------------------------------------
    // 1. Coordinate axes (X: red, Y: green, Z: blue)
    // -----------------------------------------------------------------
    const axisLength = 0.25;
    const axesHelper = new THREE.AxesHelper(axisLength);
    scene.add(axesHelper);

    const labelOffset = 0.3;
    const xLabel = makeTextSprite('x', 'red');
    xLabel.position.set(axisLength + labelOffset, 0, 0);
    scene.add(xLabel);
    const yLabel = makeTextSprite('y', 'green');
    yLabel.position.set(0, axisLength + labelOffset, 0);
    scene.add(yLabel);
    const zLabel = makeTextSprite('z', 'blue');
    zLabel.position.set(0, 0, axisLength + labelOffset);
    scene.add(zLabel);

    // -----------------------------------------------------------------
    // 2. Image plane at z = -1
    // -----------------------------------------------------------------
    const cameraFx = 1145.436198765339;
    const cameraFy = 1142.22931058894;
    const cameraCx = 960;
    const cameraCy = 540;
    const imgW = cameraCx / cameraFx;
    const imgH = cameraCy / cameraFy;

    const imgPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(imgW * 2, imgH * 2),
        new THREE.MeshBasicMaterial({
            color: 0x808080,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.3,
        }),
    );
    imgPlane.position.z = -1;
    scene.add(imgPlane);

    // -----------------------------------------------------------------
    // 3. View frustum
    // -----------------------------------------------------------------
    const frustumCorners = [
        new THREE.Vector3(-imgW, -imgH, -1),
        new THREE.Vector3(imgW, -imgH, -1),
        new THREE.Vector3(imgW, imgH, -1),
        new THREE.Vector3(-imgW, imgH, -1),
    ];
    for (let i = 0; i < 4; i++) {
        const pts = [new THREE.Vector3(0, 0, 0), frustumCorners[i]];
        const line = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(pts),
            new THREE.LineDashedMaterial({ color: 0x000000, dashSize: 0.1, gapSize: 0.05 }),
        );
        line.computeLineDistances();
        scene.add(line);
    }

    // -----------------------------------------------------------------
    // 4. AprilTag
    // -----------------------------------------------------------------
    const tagCenter = new THREE.Vector3(0.2, -0.3, -3.0);
    const n = new THREE.Vector3().subVectors(
        new THREE.Vector3(0, 0, 0), tagCenter,
    ).normalize();

    let up = new THREE.Vector3(0, 0, 1);
    if (Math.abs(n.dot(up)) > 0.99) up.set(0, 1, 0);
    let u = new THREE.Vector3().crossVectors(n, up).normalize();
    let v = new THREE.Vector3().crossVectors(n, u).normalize();

    // Tilt ~7° around u
    const th = (7 * Math.PI) / 180;
    v = v.clone().multiplyScalar(Math.cos(th)).add(
        new THREE.Vector3().crossVectors(u, v).multiplyScalar(Math.sin(th)),
    );
    const nTag = new THREE.Vector3().crossVectors(u, v).normalize();
    if (nTag.dot(n) < 0) {
        nTag.negate();
        u.negate();
    }

    const tagHalf = 0.15;
    const tagLocal = [
        new THREE.Vector2(-tagHalf, -tagHalf),
        new THREE.Vector2(tagHalf, -tagHalf),
        new THREE.Vector2(tagHalf, tagHalf),
        new THREE.Vector2(-tagHalf, tagHalf),
    ];
    const tagCorners = tagLocal.map((pt) =>
        new THREE.Vector3().addVectors(
            tagCenter,
            new THREE.Vector3().addVectors(
                u.clone().multiplyScalar(pt.x),
                v.clone().multiplyScalar(pt.y),
            ),
        ),
    );

    function makeMesh(corners, color) {
        const g = new THREE.BufferGeometry();
        g.setAttribute(
            'position',
            new THREE.BufferAttribute(
                new Float32Array(corners.flatMap((p) => [p.x, p.y, p.z])), 3,
            ),
        );
        g.setIndex([0, 1, 2, 0, 2, 3]);
        g.computeVertexNormals();
        return new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color }));
    }

    scene.add(makeMesh(tagCorners, 0x00ff00));
    scene.add(
        new THREE.LineLoop(
            new THREE.BufferGeometry().setFromPoints(tagCorners),
            new THREE.LineBasicMaterial({ color: 0x00aa00 }),
        ),
    );

    // -----------------------------------------------------------------
    // 5. Rays to tag
    // -----------------------------------------------------------------
    const rayMatGreen = new THREE.LineDashedMaterial({
        color: 0x00ff00, dashSize: 0.05, gapSize: 0.03,
    });
    for (const c of tagCorners) {
        const line = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), c]),
            rayMatGreen,
        );
        line.computeLineDistances();
        scene.add(line);
    }

    // -----------------------------------------------------------------
    // 6. Mirror plane
    // -----------------------------------------------------------------
    const planeSize = 0.8;
    const planeX = u.clone();
    const planeY = new THREE.Vector3().crossVectors(n, planeX).normalize();

    const planeCorners = [];
    for (const sx of [-planeSize, planeSize]) {
        for (const sy of [-planeSize, planeSize]) {
            planeCorners.push(
                new THREE.Vector3().addVectors(
                    tagCenter,
                    new THREE.Vector3().addVectors(
                        planeX.clone().multiplyScalar(sx),
                        planeY.clone().multiplyScalar(sy),
                    ),
                ),
            );
        }
    }
    const poly = [planeCorners[0], planeCorners[1], planeCorners[3], planeCorners[2]];
    const pGeom = new THREE.BufferGeometry();
    pGeom.setAttribute(
        'position',
        new THREE.BufferAttribute(
            new Float32Array(poly.flatMap((p) => [p.x, p.y, p.z])), 3,
        ),
    );
    pGeom.setIndex([0, 1, 2, 0, 2, 3]);
    pGeom.computeVertexNormals();
    const planeMesh = new THREE.Mesh(
        pGeom,
        new THREE.MeshLambertMaterial({
            color: 0x00ffff, transparent: true, opacity: 0.5, side: THREE.DoubleSide,
        }),
    );
    scene.add(planeMesh);

    // -----------------------------------------------------------------
    // 7. Mirrored tag
    // -----------------------------------------------------------------
    function reflectPoint(pt, planePoint, planeNormal) {
        const d = pt.clone().sub(planePoint).dot(planeNormal);
        return pt.clone().sub(planeNormal.clone().multiplyScalar(2 * d));
    }
    const mirroredCorners = tagCorners.map((c) => reflectPoint(c, tagCenter, n));

    scene.add(makeMesh(mirroredCorners, 0x800080));
    scene.add(
        new THREE.LineLoop(
            new THREE.BufferGeometry().setFromPoints(mirroredCorners),
            new THREE.LineBasicMaterial({ color: 0x400040 }),
        ),
    );

    // -----------------------------------------------------------------
    // 8. Rays to mirrored tag
    // -----------------------------------------------------------------
    const rayMatPurple = new THREE.LineDashedMaterial({
        color: 0x800080, dashSize: 0.05, gapSize: 0.03,
    });
    for (const c of mirroredCorners) {
        const line = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), c]),
            rayMatPurple,
        );
        line.computeLineDistances();
        scene.add(line);
    }

    // -----------------------------------------------------------------
    // 9. Projection quadrilaterals
    // -----------------------------------------------------------------
    scene.add(
        new THREE.LineLoop(
            new THREE.BufferGeometry().setFromPoints(
                tagCorners.map((p) => projectToPlaneZ(p, -1)),
            ),
            new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 3 }),
        ),
    );
    scene.add(
        new THREE.LineLoop(
            new THREE.BufferGeometry().setFromPoints(
                mirroredCorners.map((p) => projectToPlaneZ(p, -1)),
            ),
            new THREE.LineBasicMaterial({ color: 0x800080, linewidth: 3 }),
        ),
    );

    // -----------------------------------------------------------------
    // 10. Add toggle-labels button (needs label sprites, so after scene)
    // -----------------------------------------------------------------
    addControl({
        type: 'button',
        label: 'Toggle Labels',
        action: toggleLabels([xLabel, yLabel, zLabel]),
    });
}
