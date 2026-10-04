import { readdirSync } from 'node:fs';
import path from 'node:path';

const sources = import.meta.glob<string>('../../slides/*/*/*/index.html', {
  eager: true,
  query: '?raw',
  import: 'default',
});
const sets = import.meta.glob<{ title: string }>('../../slides/*/*/metadata.json', {
  eager: true,
  import: 'default',
});

export const slides = Object.entries(sources).map(([source, html]) => {
  const [, lang, set, number, filename] = source.match(
    /\/slides\/([^/]+)\/([^/]+)\/([^/]+)\/([^/]+)\.html$/,
  )!;
  const title = html.match(/<!--\s*title:\s*(.*?)\s*-->/)?.[1] ?? filename;
  const setTitle = sets[`../../slides/${lang}/${set}/metadata.json`]?.title ?? set;
  return { lang, set, number, title, setTitle, html };
}).sort((a, b) => a.set.localeCompare(b.set) || a.number.localeCompare(b.number, undefined, { numeric: true }));

const routes = new Set<string>();
for (const slide of slides) {
  const route = `${slide.lang}/${slide.set}/${slide.number}`;
  if (routes.has(route)) throw new Error(`Only one slide HTML file is allowed in slides/${route}/`);
  routes.add(route);
}

// Emit companion files at the deck URL so relative images and module imports work.
export function slideAssets() {
  return slides.flatMap(({ lang, set, number }) => {
    const directory = path.resolve('slides', lang, set, number);
    function walk(relative = ''): { asset: string; file: string }[] {
      return readdirSync(path.join(directory, relative), { withFileTypes: true }).flatMap((entry) => {
        const asset = relative ? `${relative}/${entry.name}` : entry.name;
        if (entry.isDirectory()) return walk(asset);
        if (!entry.isFile() || /\.(?:html|typ)$/i.test(entry.name)) return [];
        return [{ asset, file: path.join(directory, asset) }];
      });
    }
    return walk().map(({ asset, file }) => ({ params: { lang, set, number, asset }, props: { file } }));
  });
}
