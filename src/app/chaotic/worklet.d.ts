// Ambient module type for `?worklet` imports handled by
// scripts/vite-plugin-worklet.mjs (bundles a TypeScript AudioWorklet into a
// same-origin URL usable with `audioWorklet.addModule()`).
declare module '*?worklet' {
  const workletUrl: string;
  export default workletUrl;
}