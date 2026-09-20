import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const root = process.cwd();
const blogDir = path.join(root, 'blog');
const generatedDir = path.join(root, 'src', 'generated');
const articlesDir = path.join(generatedDir, 'articles');
const pdfDir = path.join(root, 'node_modules', '.cache', 'pdfs');
const tmpDir = path.join(root, 'node_modules', '.cache', 'articles');
const assetDir = path.join(root, 'asset');
const pagesDir = path.join(root, 'src', 'pages');
const appDir = path.join(root, 'app');
const localTypstCandidates = [
  path.join(root, '.tools', 'typst', 'typst.exe'),
  path.join(root, '.tools', 'typst', 'typst-x86_64-pc-windows-msvc', 'typst.exe'),
];
const localTypst = localTypstCandidates.find(existsSync);
const typstBin = localTypst || 'typst';
const execFileAsync = promisify(execFile);

function hasTypst() {
  try {
    execFileSync(typstBin, ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function findTypFiles(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findTypFiles(full, out);
    } else if (entry.name.endsWith('.typ')) {
      out.push(full);
    }
  }
  return out;
}

function parseMetadata(source) {
  const meta = { title: null, summary: '', tags: [], category: null, htmlHeads: [] };
  const lines = source.split(/\r?\n/).slice(0, 30);
  for (const line of lines) {
    const match = line.match(/^\s*\/\/\s*(title|summary|tags|category|html-heads)\s*:\s*(.+?)\s*$/i);
    if (!match) continue;
    const key = match[1].toLowerCase();
    const value = match[2].trim();
    if (key === 'tags') {
      meta.tags = value.split(',').map((tag) => tag.trim()).filter(Boolean);
    } else if (key === 'html-heads') {
      meta.htmlHeads = value.split(',').map((head) => head.trim()).filter(Boolean);
    } else if (key === 'category') {
      meta.category = value;
    } else {
      meta[key] = value;
    }
  }
  return meta;
}

function extractFragment(html) {
  const styles = [...html.matchAll(/<style[\s\S]*?<\/style>/gi)].map((m) => m[0]).join('\n');
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const body = bodyMatch ? bodyMatch[1] : html;
  return `${styles}\n${body}`;
}

function normalizeRoutePath(route) {
  if (route === '/') return route;
  return route.endsWith('/') ? route.slice(0, -1) : route;
}

function decodeRoutePath(route) {
  try {
    return decodeURIComponent(route);
  } catch {
    return route;
  }
}

function decodeHtmlAttribute(value) {
  return value.replace(
    /&(?:#(\d+)|#x([\da-f]+)|amp|quot|apos|lt|gt);/gi,
    (entity, decimal, hexadecimal) => {
      if (decimal) return String.fromCodePoint(Number(decimal));
      if (hexadecimal) return String.fromCodePoint(Number.parseInt(hexadecimal, 16));
      return {
        '&amp;': '&',
        '&quot;': '"',
        '&apos;': "'",
        '&lt;': '<',
        '&gt;': '>',
      }[entity.toLowerCase()];
    },
  );
}

function extractLocalHrefs(fragment) {
  const hrefs = [];
  for (const match of fragment.matchAll(/<a\b[^>]*>/gi)) {
    const href = match[0].match(/\s+href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    if (href) hrefs.push(decodeHtmlAttribute(href[1] ?? href[2] ?? href[3] ?? ''));
  }
  return hrefs;
}

function collectStaticPageRoutes(dir, routes = new Set(), base = dir) {
  if (!existsSync(dir)) return routes;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectStaticPageRoutes(full, routes, base);
      continue;
    }

    const extension = path.extname(entry.name);
    if (!['.astro', '.html', '.md', '.mdx'].includes(extension)) continue;
    const relative = path.relative(base, full).slice(0, -extension.length);
    const parts = relative.split(path.sep);
    if (parts.at(-1) === 'index') parts.pop();
    if (parts.some((part) => part.includes('['))) continue;
    routes.add(normalizeRoutePath(`/${parts.join('/')}${parts.length > 0 ? '/' : ''}`));
  }
  return routes;
}

function collectRouteTargets(tasks, entries) {
  const routes = collectStaticPageRoutes(pagesDir);
  routes.add('/');

  for (const task of tasks) {
    routes.add(normalizeRoutePath(`/${task.lang}/posts/${task.date}/${task.name}/`));
    routes.add(normalizeRoutePath(`/pdf/${task.id}.pdf`));
  }

  for (const entry of entries) {
    routes.add(normalizeRoutePath(`/${entry.lang}/`));
    for (const tag of entry.tags ?? []) {
      routes.add(normalizeRoutePath(`/${entry.lang}/tag/${tag}/`));
    }
    if (entry.category) {
      routes.add(normalizeRoutePath(`/${entry.lang}/category/${entry.category}/`));
    }
  }

  if (existsSync(appDir)) {
    for (const entry of readdirSync(appDir, { withFileTypes: true })) {
      if (entry.isDirectory()) routes.add(normalizeRoutePath(`/app/${entry.name}/`));
    }
  }

  return routes;
}

function isPublicAsset(route) {
  if (!route.startsWith('/')) return false;
  const candidate = path.resolve(assetDir, route.slice(1));
  if (candidate !== assetDir && !candidate.startsWith(assetDir + path.sep)) return false;
  return existsSync(candidate);
}

function validateLocalLinks(tasks, entries) {
  const routes = collectRouteTargets(tasks, entries);
  let checked = 0;
  let invalid = 0;

  for (const task of tasks) {
    const fragment = readFileSync(path.join(articlesDir, `${task.id}.html`), 'utf-8');
    const baseUrl = new URL(`https://mqcreaple.local/${task.lang}/posts/${task.date}/${task.name}/`);

    for (const href of extractLocalHrefs(fragment)) {
      if (href === '') continue;

      let target;
      try {
        target = new URL(href, baseUrl);
      } catch {
        invalid += 1;
        console.warn(`[link-check] ${task.id}: invalid local hyperlink "${href}"`);
        continue;
      }

      if (target.hostname !== baseUrl.hostname) continue;
      checked += 1;

      const route = normalizeRoutePath(decodeRoutePath(target.pathname));
      if (routes.has(route) || isPublicAsset(route)) continue;

      invalid += 1;
      console.warn(
        `[link-check] ${task.id}: invalid local hyperlink "${href}" (resolved to "${route}")`,
      );
    }
  }

  if (invalid > 0) {
    console.warn(`[link-check] Found ${invalid} invalid local hyperlink(s) in ${checked} checked.`);
  } else {
    console.log(`[link-check] Checked ${checked} local hyperlink(s); all targets are valid.`);
  }
}

async function compile(file, out, args) {
  try {
    await execFileAsync(
      typstBin,
      ['compile', file, out, ...args, '--root', root],
      { maxBuffer: 64 * 1024 * 1024 },
    );
  } catch (err) {
    const text = (err.stderr ?? '').toString().trim();
    console.error(`Typst failed for ${path.relative(root, file)}:`);
    if (text) console.error(text);
    throw err;
  }
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

if (!hasTypst()) {
  console.error('Typst CLI not found. Install Typst 0.13+ first (see README.md).');
  process.exit(1);
}

const files = findTypFiles(blogDir);
if (files.length === 0) {
  console.log('No .typ articles found under blog/; nothing to build.');
  process.exit(0);
}

mkdirSync(articlesDir, { recursive: true });
mkdirSync(pdfDir, { recursive: true });
mkdirSync(tmpDir, { recursive: true });

for (const file of readdirSync(articlesDir)) {
  if (file.endsWith('.html')) rmSync(path.join(articlesDir, file), { force: true });
}

for (const file of readdirSync(pdfDir)) {
  if (file.endsWith('.pdf')) rmSync(path.join(pdfDir, file), { force: true });
}

const tasks = [];
for (const file of files) {
  const rel = path.relative(blogDir, file);
  const parts = rel.split(path.sep);
  if (parts.length < 3) {
    continue;
  }

  const [lang, date, nameFile] = parts;
  const name = nameFile.replace(/\.typ$/i, '');
  const id = `${lang}-${date}-${name}`;
  tasks.push({
    file,
    id,
    lang,
    date,
    name,
    meta: parseMetadata(readFileSync(file, 'utf-8')),
  });
}

const concurrency = Math.max(
  1,
  os.availableParallelism ? os.availableParallelism() : os.cpus().length,
);

const compiles = tasks.flatMap((task) => [
  {
    task,
    out: path.join(tmpDir, `${task.id}.html`),
    args: ['--format', 'html', '--features', 'html', '--input', 'format=html'],
  },
  {
    task,
    out: path.join(pdfDir, `${task.id}.pdf`),
    args: ['--format', 'pdf', '--features', 'html'],
  },
]);

await mapLimit(compiles, concurrency, ({ task, out, args }) => compile(task.file, out, args));

const entries = [];
for (const task of tasks) {
  const title = task.meta.title || task.name.replace(/-/g, ' ');
  const fragment = extractFragment(readFileSync(path.join(tmpDir, `${task.id}.html`), 'utf-8'));
  writeFileSync(path.join(articlesDir, `${task.id}.html`), fragment, 'utf-8');
  entries.push({
    id: task.id,
    lang: task.lang,
    date: task.date,
    name: task.name,
    title,
    summary: task.meta.summary,
    tags: task.meta.tags,
    category: task.meta.category || 'tech',
    htmlHeads: task.meta.htmlHeads,
    pdf: `/pdf/${task.id}.pdf`,
  });
}

entries.sort((a, b) => b.date.localeCompare(a.date) || a.lang.localeCompare(b.lang));
writeFileSync(path.join(generatedDir, 'index.json'), JSON.stringify(entries, null, 2), 'utf-8');
console.log(`Built ${entries.length} article(s).`);

try {
  validateLocalLinks(tasks, entries);
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.warn(`[link-check] Skipped because the checker failed: ${message}`);
}
