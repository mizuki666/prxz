import fs from 'fs';
import { Logger } from './Logger.js';

export class READMEGenerator {
    constructor(bundlerStats) {
        this.stats = bundlerStats;
        this.timestamp = new Date().toISOString();
    }

    generate() {
        const { 
            filesCount, 
            originalSize, 
            minifiedSize, 
            compressionRate,
            buildId,
            errors 
        } = this.stats;

        const readmeContent = `
# prxz.js - Библиотека для visiology

<p align="left">
    <img src="https://img.shields.io/badge/version-1.0.0-blue" alt="Version">
    <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
    <img src="https://img.shields.io/badge/minified-3,933%20bytes-brightgreen" alt="Size">
    <img src="https://img.shields.io/badge/compression-52.0%25-orange" alt="Compression">
</p>

## О проекте

<div>**prxz.js** - это легковесная JS библа для visiology, рожденная из моей лени.</div>
<div>Собрана с помощью кастомного бандлера с поддержкой ES6 модулей.</div>

## Статистика сборки

- **Версия**: 1.0.0
- **Дата сборки**: ${new Date(this.timestamp).toLocaleString('ru-RU')}
- **ID сборки**: \`${buildId}\`
- **Файлов обработано**: ${filesCount}
- **Размер исходный**: ${originalSize} байт
- **Размер минифицированный**: ${minifiedSize} байт
- **Сжатие**: ${compressionRate}%

## Установка

- Просто положите в папку custom от visiology, подробнее тут: 

<div>
    https://visiology-doc.atlassian.net/wiki/spaces/3v15/pages/1387889208/JS
</div>

---

> Собрано: ${this.timestamp}
> Бандлер: [build/bundler/](build/bundler/)
> Файлов с ошибками: ${errors.length}
${errors.length > 0 ? '> ⚠️ При сборке были предупреждения' : ''}
`;

        return readmeContent;
    }

    async writeToFile(filePath = 'README.md') {
        try {
            const content = this.generate();
            fs.writeFileSync(filePath, content, 'utf8');
            Logger.success(`README.md generated (${content.length} bytes)`);
            return true;
        } catch (error) {
            Logger.error(`Failed to generate README: ${error.message}`);
            return false;
        }
    }
}