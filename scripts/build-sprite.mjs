import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const SPRITE_START = '<!-- svg-sprite:start -->';
const SPRITE_END = '<!-- svg-sprite:end -->';
import { fileURLToPath } from 'node:url';
import { optimize } from 'svgo';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'icons');

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

const iconButtonArrow = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <path fill="var(--color1, #fff)" stroke="var(--color2, #011c44)" stroke-linejoin="miter" stroke-linecap="butt" stroke-miterlimit="4" stroke-width="0.5587" d="M0.279 16c0 8.682 7.038 15.721 15.721 15.721s15.721-7.038 15.721-15.721c0-8.682-7.038-15.721-15.721-15.721s-15.721 7.038-15.721 15.721z"/>
  <path fill="var(--color2, #011c44)" d="M9.841 16.514c-.284-.284-.284-.745 0-1.028l4.628-4.628c.284-.284.745-.284 1.029 0s.284.745 0 1.028l-4.114 4.114 4.114 4.114c.284.284.284.744 0 1.029s-.745.284-1.029 0l-4.628-4.628zM22.545 16.727h-12.19v-1.455h12.19v1.455z"/>
</svg>`;

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
  { file: null, id: 'icon-button-arrow', inline: iconButtonArrow },
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

const symbols = icons.map(({ file, id, inline }) => {
  const source = inline ?? readFileSync(join(iconsDir, file), 'utf8');
  const optimizedSingle = optimize(source, { path: file ?? `${id}.svg`, ...svgoOptions }).data;

  if (file) {
    writeFileSync(join(iconsDir, file), `${optimizedSingle}\n`, 'utf8');
  }

  return extractSymbol(source, id);
});

const spriteBody = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">\n${symbols.join('\n')}\n</svg>\n`;

const sprite = optimize(spriteBody, {
  path: 'sprite.svg',
  ...svgoOptions,
  plugins: [
    ...svgoOptions.plugins,
    {
      name: 'cleanupIds',
      params: { remove: false, minify: true },
    },
  ],
}).data;

writeFileSync(join(iconsDir, 'sprite.svg'), sprite.endsWith('\n') ? sprite : `${sprite}\n`, 'utf8');

const indexPath = join(__dirname, '..', 'index.html');
let indexHtml = readFileSync(indexPath, 'utf8');
const inlineSprite = `${SPRITE_START}\n${spriteBody}${SPRITE_END}`;

if (indexHtml.includes(SPRITE_START) && indexHtml.includes(SPRITE_END)) {
  indexHtml = indexHtml.replace(
    new RegExp(`${SPRITE_START}[\\s\\S]*?${SPRITE_END}`),
    inlineSprite,
  );
} else {
  indexHtml = indexHtml.replace('</body>', `  ${inlineSprite}\n  </body>`);
}

indexHtml = indexHtml.replaceAll('./icons/sprite.svg#', '#');
writeFileSync(indexPath, indexHtml, 'utf8');

console.log(`Optimized ${icons.length} icons, wrote icons/sprite.svg, synced inline sprite in index.html`);
