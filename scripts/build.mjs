import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { DOODLE_ATLASES, DOODLE_COUNT, DOODLE_LABELS } from '../doodles.js';
const root = new URL('../', import.meta.url);
if (DOODLE_LABELS.length !== DOODLE_COUNT) throw new Error('Doodle labels and atlas cells do not match');
const manifest = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
for (const name of ['@deepseek-ai/cordis', '@deepseek-ai/schemastery', '@deepseek-ai/dsh-typert-protocol']) {
  if (!manifest.peerDependencies?.[name] || manifest.peerDependenciesMeta?.[name]?.optional !== true) throw new Error(`Missing optional DSH runtime peer: ${name}`);
}
const template = await readFile(new URL('client.template.js', root), 'utf8');
const css = await readFile(new URL('diary.css', root), 'utf8');
const logic = (await readFile(new URL('doodles.js', root), 'utf8')).replace(/^export /gm, '');
const uiLogic = (await readFile(new URL('ui-model.js', root), 'utf8')).replace(/^export /gm, '');
const pngVendor = await readFile(new URL('assets/vendor/html-to-image.js', root), 'utf8');
const pngLicense = await readFile(new URL('assets/vendor/html-to-image.LICENSE', root), 'utf8');
const pngSource = JSON.parse((await readFile(new URL('assets/vendor/source.json', root), 'utf8')).replace(/^\uFEFF/, ''));
if (pngSource.version !== '1.11.13' || pngSource.license !== 'MIT' || !pngVendor.includes('toBlob')) throw new Error('Unexpected PNG renderer');
const pngLogic = '/* html-to-image 1.11.13\n' + pngLicense.replace(/\*\//g, '* /') + '\n*/\n' + pngVendor.replace(/\/\/# sourceMappingURL=.*$/gm, '');
const atlases = await Promise.all(DOODLE_ATLASES.map(async name => {
  const png = await readFile(new URL(`assets/${name}`, root));
  if (!png.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) throw new Error(`Missing PNG atlas: ${name}`);
  const width = png.readUInt32BE(16), height = png.readUInt32BE(20);
  if (!width || !height || png[25] !== 6) throw new Error(`Atlas must be RGBA PNG: ${name}`);
  return { aspect: width * 2 / (height * 3) };
}));
if (css.includes('`') || css.includes('${')) throw new Error('CSS contains unsafe template delimiters');
const output = template.replace('/* __DOODLE_LOGIC__ */', () => logic).replace('/* __UI_MODEL__ */', () => uiLogic).replace('/* __PNG_RENDERER__ */', () => pngLogic).replace('__DOODLE_ATLASES__', () => JSON.stringify(atlases)).replace('__DIARY_CSS__', () => css);
if (/__DOODLE_|__DIARY_CSS__|__UI_MODEL__|__PNG_RENDERER__/.test(output)) throw new Error('Unresolved client build marker');
await writeFile(new URL('client.js', root), output, 'utf8');
console.log(`Built ${fileURLToPath(new URL('client.js', root))} (${Buffer.byteLength(output)} bytes)`);
