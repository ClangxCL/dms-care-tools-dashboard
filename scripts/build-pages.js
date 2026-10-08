import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DmsRepository } from '../src/dms/dms-repository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.resolve(rootDir, 'public');
const docsDir = path.resolve(rootDir, 'docs');

console.log('🚀 Building GitHub Pages distribution in docs/ ...');

// 1. Ensure docs directory exists
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// 2. Export full cleaned records dataset to dms-data.json
console.log('📦 Exporting 4,205 DMS records to JSON...');
const repo = new DmsRepository().loadFromFile();
const records = repo.getAll();
const jsonContent = JSON.stringify(records);
fs.writeFileSync(path.join(publicDir, 'dms-data.json'), jsonContent, 'utf-8');
fs.writeFileSync(path.join(docsDir, 'dms-data.json'), jsonContent, 'utf-8');
console.log(`✅ dms-data.json generated (${(jsonContent.length / 1024).toFixed(1)} KB)`);

// 3. Generate client-side repository engine (dms-client-engine.js)
console.log('⚙️ Generating browser-compatible dms-client-engine.js...');
const repoSource = fs.readFileSync(path.join(rootDir, 'src/dms/dms-repository.js'), 'utf-8');
// Strip import line and convert export class to window/global class
const clientEngineCode = repoSource
  .replace(/^import\s+.*$/m, '// Pure in-browser DMS Repository Engine')
  .replace('export class DmsRepository', 'class DmsRepository') +
  `\n// Browser & Global Expose\nif (typeof globalThis !== 'undefined') {\n  globalThis.DmsClientRepository = DmsRepository;\n}\nif (typeof window !== 'undefined') {\n  window.DmsClientRepository = DmsRepository;\n}\n`;

fs.writeFileSync(path.join(publicDir, 'dms-client-engine.js'), clientEngineCode, 'utf-8');
fs.writeFileSync(path.join(docsDir, 'dms-client-engine.js'), clientEngineCode, 'utf-8');
console.log('✅ dms-client-engine.js generated successfully');

// 4. Ensure .nojekyll in docs/ so GitHub Pages serves raw static assets and geojson/mp4
fs.writeFileSync(path.join(docsDir, '.nojekyll'), '', 'utf-8');
fs.writeFileSync(path.join(publicDir, '.nojekyll'), '', 'utf-8');
console.log('✅ .nojekyll created');

// 5. Copy all public assets to docs/
const filesToCopy = [
  'index.html',
  'style.css',
  'app.js',
  'thailand-provinces.geojson',
  'dms-dashboard-overview.mp4',
];

for (const file of filesToCopy) {
  const src = path.join(publicDir, file);
  const dest = path.join(docsDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    const size = fs.statSync(dest).size;
    console.log(`✅ Copied ${file} -> docs/ (${(size / 1024).toFixed(1)} KB)`);
  } else {
    console.warn(`⚠️ Warning: ${src} not found`);
  }
}

console.log('🎉 GitHub Pages distribution ready in docs/ folder!');
