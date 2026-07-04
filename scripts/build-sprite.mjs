import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { optimize } from 'svgo';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'icons');
const spritePath = join(iconsDir, 'sprite.svg');

const svgoOptions = {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          removeViewBox: false,
        },
      },
    },
    'removeDimensions',
    'removeStyleElement',
  ],
};

const icons = [
  { file: 'logo.svg', id: 'icon-logo' },
  { file: 'phone.svg', id: 'icon-phone' },
  { file: 'facebook.svg', id: 'icon-facebook' },
  { file: 'instagram.svg', id: 'icon-instagram' },
  { file: 'Star 1.svg', id: 'icon-star-1' },
  { file: 'Star 2.svg', id: 'icon-star-2' },
  { file: 'Star 3.svg', id: 'icon-star-3' },
  { file: 'molecule.svg', id: 'icon-molecule' },
  { file: 'medicinecosmeticsbottletreatment_109776.svg', id: 'icon-cosmetics' },
  { file: 'crown.svg', id: 'icon-crown' },
  { file: 'button-arrow.svg', id: 'icon-button-arrow' },
  { file: 'burger_menu.svg', id: 'icon-burger_menu' },
];

function extractSymbol(svg, id) {
  const optimized = optimize(svg, { path: `${id}.svg`, ...svgoOptions }).data;
  const viewBoxMatch = optimized.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch?.[1] ?? '0 0 24 24';
  const inner = optimized
    .replace(/<\?xml[^?]*\?>\s*/i, '')
    .replace(/<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .trim();

  return `  <symbol id="${id}" viewBox="${viewBox}">${inner}</symbol>`;
}

const symbols = icons.map(({ file, id }) => {
  const source = readFileSync(join(iconsDir, file), 'utf8');
  const optimizedSingle = optimize(source, { path: file, ...svgoOptions }).data;

  writeFileSync(join(iconsDir, file), `${optimizedSingle}\n`, 'utf8');

  return extractSymbol(source, id);
});

const sprite = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">\n${symbols.join('\n')}\n</svg>\n`;

writeFileSync(spritePath, sprite, 'utf8');

console.log(`Optimized ${icons.length} icons and wrote ${spritePath}`);
