import fs from 'node:fs';
import path from 'node:path';

const css = fs.readFileSync('css/main.css', 'utf8');

const markers = [
  { file: 'base/_fonts.scss', start: '   0. Roboto', end: '   1. Змінні' },
  { file: 'abstracts/_variables.scss', start: '   1. Змінні', end: '   2. База' },
  { file: 'base/_reset.scss', start: '   2. База', end: '   3. Типографіка' },
  { file: 'base/_typography.scss', start: '   3. Типографіка', end: '   4. Компоненти' },
  { file: 'components/_buttons.scss', start: '   4. Компоненти', end: '   5. Header' },
  { file: 'layout/_header.scss', start: '   5. Header', end: '   6. Hero' },
  { file: 'sections/_hero.scss', start: '   6. Hero', end: '   7. Секція «Про нас»' },
  { file: 'sections/_about.scss', start: '   7. Секція «Про нас»', end: '   8. Секція «Чому ми»' },
  { file: 'sections/_why-us.scss', start: '   8. Секція «Чому ми»', end: '   9. Секція «Наші процедури»' },
  { file: 'sections/_services.scss', start: '   9. Секція «Наші процедури»', end: '   10. Секція «Контакти»' },
  { file: 'sections/_contact.scss', start: '   10. Секція «Контакти»', end: '   11. Footer' },
  { file: 'layout/_footer.scss', start: '   11. Footer', end: '/* modal window */' },
  { file: 'components/_modal.scss', start: '/* modal window */', end: null },
];

function extract(start, end) {
  const startIdx = css.indexOf(start);
  if (startIdx === -1) throw new Error(`Start not found: ${start}`);

  if (end === null) {
    const modalStart = css.indexOf('/* modal window */');
    return css.slice(modalStart).replace(/^\/\* modal window \*\/\s*/, '').trim();
  }

  const endIdx = css.indexOf(end, startIdx + start.length);
  if (endIdx === -1) throw new Error(`End not found: ${end}`);

  const blockStart = css.lastIndexOf('/* =', startIdx);
  const blockEnd = css.lastIndexOf('/* =', endIdx);
  const chunk = css.slice(blockStart, blockEnd);

  return chunk.replace(/^\/\*[\s\S]*?\*\/\s*/, '').trim();
}

for (const { file, start, end } of markers) {
  const content = extract(start, end);
  const out = path.join('scss', file);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${content}\n`);
  console.log('OK', file, content.length);
}
