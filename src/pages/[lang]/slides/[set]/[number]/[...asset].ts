import type { APIRoute } from 'astro';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { slideAssets } from '../../../../../lib/slides';

export const getStaticPaths = slideAssets;

const contentTypes: Record<string, string> = {
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.json': 'application/json',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.woff2': 'font/woff2',
};

export const GET: APIRoute = ({ props }) => new Response(new Uint8Array(readFileSync(props.file)), {
  headers: { 'Content-Type': contentTypes[path.extname(props.file).toLowerCase()] ?? 'application/octet-stream' },
});
