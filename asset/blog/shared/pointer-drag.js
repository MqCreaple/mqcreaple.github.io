// Shared pointer/raycast utilities for the Three.js interactive figures.
//
// These files are served as static public modules, so they never import bare
// package names. THREE is passed in by each scene script.

export function updatePointerFromEvent(event, canvas, pointer) {
  const rect = canvas.getBoundingClientRect();
  pointer.set(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );
}

export function createPointerState(THREE, canvas, camera) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  return {
    raycaster,
    pointer,
    update(event) {
      updatePointerFromEvent(event, canvas, pointer);
      raycaster.setFromCamera(pointer, camera);
      return raycaster;
    },
  };
}

export function attachPointerDrag(canvas, { onPointerDown, onPointerMove, onPointerUp }) {
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  return () => {
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointercancel', onPointerUp);
  };
}
