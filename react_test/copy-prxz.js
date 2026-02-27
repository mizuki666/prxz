import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = join(__dirname, '..', 'dist', 'prxz.min.js');
const destDir = join(__dirname, 'public');
const dest = join(destDir, 'prxz.min.js');

if (!existsSync(src)) {
  console.warn('prxz.min.js not found. Run "npm run build" in prxz root first.');
  process.exit(0);
}
if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log('prxz.min.js copied to public/');
