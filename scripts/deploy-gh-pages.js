import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const docsDir = path.resolve(rootDir, 'docs');

console.log('📦 1. Rebuilding docs/ static distribution...');
execSync('npm run build:pages', { cwd: rootDir, stdio: 'inherit' });

try {
  const remoteUrl = execSync('git config --get remote.origin.url', { cwd: rootDir }).toString().trim();
  console.log(`🔗 Remote Origin: ${remoteUrl}`);
  
  console.log('🌿 2. Preparing gh-pages git branch...');
  // Check if gh-pages branch already exists locally
  const branches = execSync('git branch --list gh-pages', { cwd: rootDir }).toString();
  if (!branches.includes('gh-pages')) {
    execSync('git branch gh-pages', { cwd: rootDir, stdio: 'inherit' });
    console.log('✅ Created local branch gh-pages');
  } else {
    console.log('ℹ️ Local branch gh-pages already exists');
  }

  console.log('\n✨ พร้อม Deploy ขึ้น GitHub Pages แล้ว:');
  console.log('  วิธีที่ 1 (แนะนำ): Push ขึ้น main แล้วเลือก Source เป็น "/docs"');
  console.log('     git add docs/ .github/ package.json public/ scripts/ src/ test/');
  console.log('     git commit -m "feat: prepare GitHub Pages deployment"');
  console.log('     git push origin main');
  console.log('  วิธีที่ 2: Deploy ผ่าน GitHub Actions อัตโนมัติ (เปิดใช้งานใน Settings > Pages > Source = GitHub Actions)');
  console.log('  วิธีที่ 3: Push ไปยัง branch gh-pages:');
  console.log('     git subtree push --prefix docs origin gh-pages');
} catch (err) {
  console.error('Error checking git branches:', err.message);
}
