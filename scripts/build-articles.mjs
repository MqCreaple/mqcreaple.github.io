import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const blogDir = path.join(root, 'blog');
const generatedDir = path.join(root, 'src', 'generated');
const articlesDir = path.join(generatedDir, 'articles');
const pdfDir = path.join(root, 'node_modules', '.cache', 'pdfs');
const tmpDir = path.join(root, 'node_modules', '.cache', 'articles');
const localTypstCandidates = [
  path.join(root, '.tools', 'typst', 'typst.exe'),
  path.join(root, '.tools', 'typst', 'typst-x86_64-pc-windows-msvc', 'typst.exe'),
];
const localTypst = localTypstCandidates.find(existsSync);
const typstBin = localTypst || 'typst';

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
  const meta = { title: null, summary: '', tags: [], category: null };
  const lines = source.split(/\r?\n/).slice(0, 30);
  for (const line of lines) {
    const match = line.match(/^\s*\/\/\s*(title|summary|tags|category)\s*:\s*(.+?)\s*$/i);
    if (!match) continue;
    const key = match[1].toLowerCase();
    const value = match[2].trim();
    if (key === 'tags') {
      meta.tags = value.split(',').map((tag) => tag.trim()).filter(Boolean);
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
  const unwrapped = body.replace(
    /<div class="mermaid">\s*<pre><code[^>]*>([\s\S]*?)<\/code><\/pre>\s*<\/div>/gi,
    (_, code) => `<div class="mermaid">${code}</div>`,
  );
  return `${styles}\n${unwrapped}`;
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

const entries = [];
for (const file of files) {
  const rel = path.relative(blogDir, file);
  const parts = rel.split(path.sep);
  if (parts.length < 3) {
    continue;
  }

  const [lang, date, nameFile] = parts;
  const name = nameFile.replace(/\.typ$/i, '');
  const id = `${lang}-${date}-${name}`;
  const source = readFileSync(file, 'utf-8');
  const meta = parseMetadata(source);
  const title = meta.title || name.replace(/-/g, ' ');
  const htmlOut = path.join(tmpDir, `${id}.html`);
  const pdfOut = path.join(pdfDir, `${id}.pdf`);

  execFileSync(
    typstBin,
    [
      'compile',
      file,
      htmlOut,
      '--format',
      'html',
      '--features',
      'html',
      '--input',
      'format=html',
      '--root',
      root,
    ],
    { stdio: 'inherit' },
  );
  execFileSync(typstBin, ['compile', file, pdfOut, '--format', 'pdf', '--root', root], {
    stdio: 'inherit',
  });

  const fragment = extractFragment(readFileSync(htmlOut, 'utf-8'));
  writeFileSync(path.join(articlesDir, `${id}.html`), fragment, 'utf-8');

  entries.push({
    id,
    lang,
    date,
    name,
    title,
    summary: meta.summary,
    tags: meta.tags,
    category: meta.category || 'tech',
    pdf: `/pdf/${id}.pdf`,
  });
}

entries.sort((a, b) => b.date.localeCompare(a.date) || a.lang.localeCompare(b.lang));
writeFileSync(path.join(generatedDir, 'index.json'), JSON.stringify(entries, null, 2), 'utf-8');
console.log(`Built ${entries.length} article(s).`);
