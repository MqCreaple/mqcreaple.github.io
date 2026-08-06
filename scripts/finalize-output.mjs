import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const outputDir = path.join(root, 'output');
const appSrc = path.join(root, 'app');
const pdfSrc = path.join(root, 'node_modules', '.cache', 'pdfs');
const appOut = path.join(outputDir, 'app');
const pdfOut = path.join(outputDir, 'pdf');
const jsOut = path.join(outputDir, 'js');
const jquerySrc = path.join(root, 'node_modules', 'jquery', 'dist', 'jquery.min.js');

function assertInsideWorkspace(dir) {
  if (!path.resolve(dir).startsWith(root + path.sep)) {
    throw new Error(`Refusing to touch path outside workspace: ${dir}`);
  }
}

for (const dir of [outputDir, appOut, pdfOut, jsOut]) {
  assertInsideWorkspace(dir);
}

mkdirSync(outputDir, { recursive: true });

if (existsSync(appSrc)) {
  mkdirSync(appOut, { recursive: true });
  cpSync(appSrc, appOut, { recursive: true });
}

if (existsSync(pdfSrc)) {
  rmSync(pdfOut, { recursive: true, force: true });
  mkdirSync(pdfOut, { recursive: true });
  cpSync(pdfSrc, pdfOut, { recursive: true });
}

if (existsSync(jquerySrc)) {
  mkdirSync(jsOut, { recursive: true });
  cpSync(jquerySrc, path.join(jsOut, 'jquery.min.js'));
}

console.log('Finalized output/ with apps and PDFs.');
