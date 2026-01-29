import fs from 'fs';
import { Logger } from './Logger.js';

export class READMEGenerator {
    constructor(bundlerStats) {
        this.stats = bundlerStats;
        this.timestamp = new Date().toISOString();
        
        // Проверяем наличие версии в stats
        if (!this.stats.version) {
            Logger.warning('Version not provided in bundlerStats, using default');
            this.stats.version = '1.0.0';
        }
    }

    generate() {
        const { 
            filesCount, 
            originalSize, 
            minifiedSize, 
            compressionRate,
            buildId,
            errors,
            version,
            author,
            license,
            repository
        } = this.stats;

        // Форматируем URL репозитории для badges
        let repoBadge = '';
        // Форматируем автора для отображения
        const displayAuthor = author || 'Unknown Author';
        if (repository) {
            if (repository.includes('github.com')) {
                const repoPath = repository.replace(/^https?:\/\//, '')
                                          .replace(/\.git$/, '');
                repoBadge = `\n    <a href="${repository}"><img src="https://img.shields.io/badge/github-${displayAuthor}-black" alt="GitHub"></a>`;
            }
        }


        
        // Форматируем размер для badge (убираем форматирование с запятыми)
        const minifiedBadgeSize = minifiedSize.replace(/,/g, '');

        const readmeContent = `
# prxz.js - Библиотека для visiology

<p align="left">
    <img src="https://img.shields.io/badge/version-${version}-blue" alt="Version">
    <img src="https://img.shields.io/badge/license-${license || 'MIT'}-green" alt="License">
    <img src="https://img.shields.io/badge/minified-${minifiedBadgeSize}%20bytes-brightgreen" alt="Size">
    <img src="https://img.shields.io/badge/compression-${compressionRate}%25-orange" alt="Compression">${repoBadge}
</p>

## О проекте

<div>Это легковесная JS библа для visiology, рожденная из моей лени.</div>
<div>Собрана с помощью кастомного бандлера с поддержкой ES6 модулей.</div>

## Статистика сборки

- **Версия**: ${version}
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
> Бандлер: [bundler/](bundler/)
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
    
    /**
     * Генерирует changelog на основе версий
     */
    static generateChangelog(version, changes = []) {
        const changelog = `
# История изменений

## Версия ${version} (${new Date().toISOString().split('T')[0]})

${changes.length > 0 ? changes.map(change => `- ${change}`).join('\n') : '- Обновление версии'}

---

*Для полной истории изменений смотрите коммиты в репозитории.*
`;
        
        return changelog;
    }
}