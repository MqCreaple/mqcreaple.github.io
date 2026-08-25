// Shared THREE.Sprite label helpers for the interactive figures.
//
// These files are served as static public modules, so they never import bare
// package names. THREE is passed in by the caller.

export function makeTextSprite(THREE, message, color) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('makeTextSprite: 2D canvas context is unavailable.');
  canvas.width = 256;
  canvas.height = 128;
  context.clearRect(0, 0, 256, 128);
  context.font = 'bold 24px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = color;
  context.fillText(message, 128, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      alphaTest: 0.1,
    }),
  );
  sprite.scale.set(1.5, 0.75, 1);
  return sprite;
}

export function toggleLabels(labelSprites) {
  let visible = true;
  return () => {
    visible = !visible;
    for (const sprite of labelSprites) sprite.visible = visible;
  };
}
