import * as THREE from 'three';
import { OrbitControls } from 'https://unpkg.com/three@0.128.0/examples/jsm/controls/OrbitControls.js';

// -----------------------------------------------------------------
// 1. Setup scene, camera, renderer
// -----------------------------------------------------------------
const canvas = document.getElementById('apriltag-duality');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

// Camera: placed at origin looking along -Z (forward direction is -Z)
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 50);
const INITIAL_VIEW = [3, 0, -3];
camera.position.set(...INITIAL_VIEW);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.minDistance = 2;
controls.maxDistance = 30;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

// -----------------------------------------------------------------
// 2. Coordinate axes (X: red, Y: green, Z: blue)
// -----------------------------------------------------------------
const axisLength = 0.25;
const axesHelper = new THREE.AxesHelper(axisLength);
scene.add(axesHelper);

// Axis labels
const labelOffset = 0.3;
const font = 'bold 14px Arial';
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
// 3. Image plane at z = -1 (gray, semi‑transparent)
// -----------------------------------------------------------------
const cameraFx = 1145.436198765339;
const cameraFy = 1142.22931058894;
const cameraCx = 960;
const cameraCy = 540;
const imgPlaneWidth = cameraCx / cameraFx;
const imgPlaneHeight = cameraCy / cameraFy;
const imgPlaneGeometry = new THREE.PlaneGeometry(imgPlaneWidth * 2, imgPlaneHeight * 2);
const imgPlaneMaterial = new THREE.MeshBasicMaterial({
    color: 0x808080,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.3
});
const imgPlane = new THREE.Mesh(imgPlaneGeometry, imgPlaneMaterial);
imgPlane.position.z = -1;  // because camera looks along -Z
scene.add(imgPlane);

// -----------------------------------------------------------------
// 4. View frustum (dashed lines from camera to image plane corners)
// -----------------------------------------------------------------
const frustumCorners = [
    new THREE.Vector3(-imgPlaneWidth, -imgPlaneHeight, -1),
    new THREE.Vector3( imgPlaneWidth, -imgPlaneHeight, -1),
    new THREE.Vector3( imgPlaneWidth,  imgPlaneHeight, -1),
    new THREE.Vector3(-imgPlaneWidth,  imgPlaneHeight, -1)
];
const frustumLines = [];
for (let i = 0; i < 4; i++) {
    const points = [new THREE.Vector3(0, 0, 0), frustumCorners[i]];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineDashedMaterial({
        color: 0x000000,
        dashSize: 0.1,
        gapSize: 0.05,
        linewidth: 1
    });
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    scene.add(line);
    frustumLines.push(line);
}

// -----------------------------------------------------------------
// 5. AprilTag position and orientation
// -----------------------------------------------------------------
// Tag center (in camera coordinates)
const tagCenter = new THREE.Vector3(0.2, -0.3, -3.0);  // y negative => down, z negative => forward

// Vector from tag to camera (origin)
const vecTagToCam = new THREE.Vector3().subVectors(new THREE.Vector3(0,0,0), tagCenter);
const dist = vecTagToCam.length();
const n = vecTagToCam.clone().normalize();  // unit vector pointing from tag to camera

// Two orthonormal vectors in the tag plane
let up = new THREE.Vector3(0, 0, 1);
if (Math.abs(n.dot(up)) > 0.99) up = new THREE.Vector3(0, 1, 0);
let u = new THREE.Vector3().crossVectors(n, up).normalize();
let v = new THREE.Vector3().crossVectors(n, u).normalize();

// Tilt the tag plane by ~7° around u
const theta = 7 * Math.PI / 180;
const cosT = Math.cos(theta);
const sinT = Math.sin(theta);
// Rotate v around u (Rodrigues)
v = v.clone().multiplyScalar(cosT).add(new THREE.Vector3().crossVectors(u, v).multiplyScalar(sinT));
// Re‑compute normal
const nTag = new THREE.Vector3().crossVectors(u, v).normalize();
// Ensure nTag points toward camera (dot with original n positive)
if (nTag.dot(n) < 0) {
    nTag.negate();
    u.negate();
}

// Tag size (half‑side)
const tagHalf = 0.15;
// Four corners in tag‑local coordinates (using u, v as axes)
const tagLocal = [
    new THREE.Vector2(-tagHalf, -tagHalf),
    new THREE.Vector2( tagHalf, -tagHalf),
    new THREE.Vector2( tagHalf,  tagHalf),
    new THREE.Vector2(-tagHalf,  tagHalf)
];

// Convert to 3D camera coordinates
const tagCorners = tagLocal.map(pt => {
    return new THREE.Vector3().addVectors(
        tagCenter,
        new THREE.Vector3().addVectors(
            u.clone().multiplyScalar(pt.x),
            v.clone().multiplyScalar(pt.y)
        )
    );
});

// Draw the black tag (filled polygon)
const tagGeometry = new THREE.BufferGeometry();
const vertices = new Float32Array(tagCorners.flatMap(v => [v.x, v.y, v.z]));
tagGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
tagGeometry.setIndex([0,1,2, 0,2,3]);  // two triangles
tagGeometry.computeVertexNormals();
const tagMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
const tagMesh = new THREE.Mesh(tagGeometry, tagMaterial);
scene.add(tagMesh);

// Add wireframe outline
const tagWireframe = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(tagCorners),
    new THREE.LineBasicMaterial({ color: 0x00aa00, linewidth: 2 })
);
scene.add(tagWireframe);

// -----------------------------------------------------------------
// 6. Rays from camera to tag corners (dotted lines)
// -----------------------------------------------------------------
const rayMaterialGreen = new THREE.LineDashedMaterial({
    color: 0x00ff00,
    dashSize: 0.05,
    gapSize: 0.03,
    linewidth: 1
});
for (const corner of tagCorners) {
    const rayGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0,0,0),
        corner
    ]);
    const rayLine = new THREE.Line(rayGeometry, rayMaterialGreen);
    rayLine.computeLineDistances();
    scene.add(rayLine);
}

// -----------------------------------------------------------------
// 7. Mirror plane (cyan, semi‑transparent)
// -----------------------------------------------------------------
// Plane passes through tagCenter, normal = n (vector from tag to camera)
const planeSize = 0.8;
// Two orthonormal vectors lying in the plane
const planeX = u.clone();
const planeY = new THREE.Vector3().crossVectors(n, planeX).normalize();

// Four corners of the plane rectangle
const planeCorners = [];
for (const sx of [-planeSize, planeSize]) {
    for (const sy of [-planeSize, planeSize]) {
        planeCorners.push(new THREE.Vector3().addVectors(
            tagCenter,
            new THREE.Vector3().addVectors(
                planeX.clone().multiplyScalar(sx),
                planeY.clone().multiplyScalar(sy)
            )
        ));
    }
}
// Reorder for polygon
const planePolygon = [
    planeCorners[0], planeCorners[1], planeCorners[3], planeCorners[2]
];
const planeGeometry = new THREE.BufferGeometry();
const planeVertices = new Float32Array(planePolygon.flatMap(v => [v.x, v.y, v.z]));
planeGeometry.setAttribute('position', new THREE.BufferAttribute(planeVertices, 3));
planeGeometry.setIndex([0,1,2, 0,2,3]);
planeGeometry.computeVertexNormals();
const planeMaterial = new THREE.MeshLambertMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide
});
const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
scene.add(planeMesh);

// -----------------------------------------------------------------
// 8. Mirrored tag (purple)
// -----------------------------------------------------------------
// Mirror transformation: reflect across the plane (normal n, point tagCenter)
function reflectPoint(pt, planePoint, planeNormal) {
    const d = pt.clone().sub(planePoint).dot(planeNormal);
    return pt.clone().sub(planeNormal.clone().multiplyScalar(2 * d));
}

const mirroredCorners = tagCorners.map(corner =>
    reflectPoint(corner, tagCenter, n)
);

// Draw mirrored tag (purple, semi‑transparent)
const mirrorGeometry = new THREE.BufferGeometry();
const mirrorVertices = new Float32Array(mirroredCorners.flatMap(v => [v.x, v.y, v.z]));
mirrorGeometry.setAttribute('position', new THREE.BufferAttribute(mirrorVertices, 3));
mirrorGeometry.setIndex([0,1,2, 0,2,3]);
mirrorGeometry.computeVertexNormals();
const mirrorMaterial = new THREE.MeshLambertMaterial({
    color: 0x800080,
    // transparent: true,
    // opacity: 0.7
});
const mirrorMesh = new THREE.Mesh(mirrorGeometry, mirrorMaterial);
scene.add(mirrorMesh);

// Wireframe for mirrored tag
const mirrorWireframe = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(mirroredCorners),
    new THREE.LineBasicMaterial({ color: 0x400040, linewidth: 2 })
);
scene.add(mirrorWireframe);

// -----------------------------------------------------------------
// 8b. Rays from camera to mirrored tag corners (purple dotted lines)
// -----------------------------------------------------------------
const rayMaterialPurple = new THREE.LineDashedMaterial({
    color: 0x800080,
    dashSize: 0.05,
    gapSize: 0.03,
    linewidth: 1
});
for (const corner of mirroredCorners) {
    const rayGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0,0,0),
        corner
    ]);
    const rayLine = new THREE.Line(rayGeometry, rayMaterialPurple);
    rayLine.computeLineDistances();
    scene.add(rayLine);
}

// -----------------------------------------------------------------
// 8c. Projection quadrilaterals on image plane (z = -1)
// -----------------------------------------------------------------
// Helper: project a 3D point onto plane z = -1
function projectToImagePlane(point) {
    // point.z is negative (in front of camera)
    const t = -1 / point.z;
    return new THREE.Vector3(point.x * t, point.y * t, -1);
}

// Project corners of original tag (green)
const projectedGreenCorners = tagCorners.map(projectToImagePlane);
const greenProjection = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(projectedGreenCorners),
    new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 3 })
);
scene.add(greenProjection);

// Project corners of mirrored tag (purple)
const projectedPurpleCorners = mirroredCorners.map(projectToImagePlane);
const purpleProjection = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(projectedPurpleCorners),
    new THREE.LineBasicMaterial({ color: 0x800080, linewidth: 3 })
);
scene.add(purpleProjection);

// -----------------------------------------------------------------
// 9. Set equal axis ranges for consistent scaling
// -----------------------------------------------------------------
// Collect all points to compute bounding box
const allPoints = [
    new THREE.Vector3(0,0,0),
    ...frustumCorners,
    tagCenter,
    ...tagCorners,
    ...mirroredCorners,
    ...planeCorners
];
const box = new THREE.Box3().setFromPoints(allPoints);
const size = box.getSize(new THREE.Vector3());
const maxSize = Math.max(size.x, size.y, size.z);
// We'll adjust camera position and controls limits instead of scaling objects
// The scene is already properly proportioned

// -----------------------------------------------------------------
// 10. Animation loop
// -----------------------------------------------------------------
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// -----------------------------------------------------------------
// 11. Event listeners
// -----------------------------------------------------------------
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

document.getElementById('reset-view').addEventListener('click', () => {
    controls.reset();
    camera.position.set(...INITIAL_VIEW);
    controls.update();
});

let labelsVisible = true;
document.getElementById('toggle-labels').addEventListener('click', () => {
    labelsVisible = !labelsVisible;
    xLabel.visible = yLabel.visible = zLabel.visible = labelsVisible;
});

// -----------------------------------------------------------------
// 12. Helper function for text labels
// -----------------------------------------------------------------
function makeTextSprite(message, color) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;
    context.fillStyle = 'rgba(0,0,0,0)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = 'bold 24px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = color;
    context.fillText(message, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(1.5, 0.75, 1);
    return sprite;
}