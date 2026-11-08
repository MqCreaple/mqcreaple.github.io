import {
    addDraggableTorusPoint, addSceneBasics, makeTorusSurface, pointOnTorus,
} from './torus-common.js';

export default function (scene, camera, canvas, initialView, helpers) {
    const { THREE } = helpers;
    const colors = helpers.themeColors;
    const controls = addSceneBasics(scene, camera, helpers);
    const root = new THREE.Group();
    scene.add(root);
    let pattern = 'checker';
    let surface;
    let alpha = 0;
    let beta = 0;

    function recolor() {
        if (surface) {
            root.remove(surface);
            surface.userData.dispose();
        }
        surface = makeTorusSurface(THREE, root, colors, pattern, alpha, beta);
    }
    recolor();
    const collider = new THREE.Mesh(
        new THREE.TorusGeometry(2.15, 0.78, 24, 96),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, colorWrite: false, depthWrite: false }),
    );
    scene.add(collider);
    const point = addDraggableTorusPoint(
        THREE, scene, canvas, camera, controls, collider, colors, [0, 0],
        (theta, phi) => { alpha = theta; beta = phi; recolor(); },
    );
    const identityMarker = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 20, 16),
        new THREE.MeshBasicMaterial({ color: 0x000000, depthTest: false }),
    );
    identityMarker.position.copy(pointOnTorus(THREE, 0, 0, 0.09));
    identityMarker.renderOrder = 4;
    scene.add(identityMarker);

    helpers.addControlWidget({
        type: 'select',
        id: 'torus-pattern',
        label: '配色',
        options: ['棋盘格', '色轮'],
        value: '棋盘格',
        action: (value) => {
            pattern = value === '色轮' ? 'wheel' : 'checker';
            recolor();
        },
    });
    helpers.addControlWidget({
        type: 'button',
        label: '重置点',
        action: () => {
            alpha = 0;
            beta = 0;
            point.state.theta = 0;
            point.state.phi = 0;
            point.place();
        },
    });
}
