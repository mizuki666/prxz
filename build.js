#!/usr/bin/env node
import { Bundler } from './bundler/Bundler.js';

if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
Использование: node build/build.js

Опции:
  --help, -h    Показать эту справку
  --version, -v Показать версию

Пример:
  node build/build.js
  npm run build
`);
    process.exit(0);
}

if (process.argv.includes('--version') || process.argv.includes('-v')) {
    console.log('Bundler v1.0.0');
    process.exit(0);
}

try {
    const bundler = new Bundler();
    await bundler.build();
} catch (error) {
    console.error(`\x1b[31m[FATAL] ${error.message}\x1b[0m`);
    process.exit(1);
}