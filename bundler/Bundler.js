import fs from 'fs';
import { resolve, join } from 'path';
import { Logger } from './Logger.js';
import { FileProcessor } from './FileProcessor.js';
import { Utils } from './Utils.js';
import { READMEGenerator } from './READMEGenerator.js';
import { runTests } from './runTests.js';

export class Bundler {
    constructor(options = {}) {
        this.processor = new FileProcessor();
        this.utils = Utils;
        
        // Автоматическое определение версии
        this.version = this.detectVersion();
        
        // Обновляем версию в index.js если нужно
        if (options.updateSourceVersion !== false) {
            this.updateVersionInSource();
        }
        
        this.buildStats = {
            filesCount: 0,
            originalSize: 0,
            minifiedSize: 0,
            compressionRate: '0',
            buildId: Date.now().toString(16),
            errors: [],
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Обнаруживает версию из package.json или index.js
     * @returns {string} Версия
     */
    detectVersion() {
        try {
            // Сначала проверяем package.json (главный источник)
            const packageJsonPath = resolve('package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                if (packageJson.version) {
                    Logger.info(`Detected version from package.json: ${packageJson.version}`);
                    return packageJson.version;
                }
            }
            
            // Если package.json нет или нет версии, проверяем index.js
            const srcDir = resolve('src');
            const entryFile = resolve(srcDir, 'index.js');
            if (fs.existsSync(entryFile)) {
                const content = fs.readFileSync(entryFile, 'utf8');
                const versionMatch = content.match(/version:\s*['"]([^'"]+)['"]/);
                if (versionMatch) {
                    Logger.info(`Detected version from index.js: ${versionMatch[1]}`);
                    return versionMatch[1];
                }
            }
            
            // Если ничего не найдено
            Logger.warning('Version not detected, using default: 1.0.0');
            return '1.0.0';
            
        } catch (error) {
            Logger.warning(`Failed to detect version: ${error.message}`);
            return '1.0.0';
        }
    }

    /**
     * Обновляет версию в исходном файле index.js
     */
    updateVersionInSource() {
        try {
            const srcDir = resolve('src');
            const entryFile = resolve(srcDir, 'index.js');
            
            if (!fs.existsSync(entryFile)) {
                Logger.warning(`Source file not found: ${entryFile}`);
                return;
            }
            
            let content = fs.readFileSync(entryFile, 'utf8');
            const originalContent = content;
            
            // Ищем строку с версией
            const versionRegex = /(version\s*:\s*['"])([^'"]+)(['"])/;
            const versionMatch = content.match(versionRegex);
            
            if (versionMatch) {
                // Заменяем существующую версию
                const newContent = content.replace(
                    versionRegex,
                    `$1${this.version}$3`
                );
                
                if (newContent !== content) {
                    fs.writeFileSync(entryFile, newContent, 'utf8');
                    Logger.success(`Updated version in index.js to: ${this.version}`);
                }
            } else {
                // Если строка с версией не найдена, добавляем её в начало объекта prxz
                const prxzObjectRegex = /(const\s+prxz\s*=\s*\{)/;
                if (prxzObjectRegex.test(content)) {
                    const newContent = content.replace(
                        prxzObjectRegex,
                        `$1\n    version: '${this.version}',`
                    );
                    fs.writeFileSync(entryFile, newContent, 'utf8');
                    Logger.success(`Added version to index.js: ${this.version}`);
                } else {
                    Logger.warning('Could not find prxz object to add version');
                }
            }
            
        } catch (error) {
            Logger.warning(`Failed to update version in source: ${error.message}`);
        }
    }

    /**
     * Проверяет соответствие версий в package.json и index.js
     * @returns {boolean} true если версии совпадают
     */
    verifyVersionConsistency() {
        try {
            // Получаем версию из package.json
            const packageJsonPath = resolve('package.json');
            if (!fs.existsSync(packageJsonPath)) {
                return true;
            }
            
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            const packageVersion = packageJson.version;
            
            if (!packageVersion) {
                return true;
            }
            
            // Получаем версию из index.js
            const srcDir = resolve('src');
            const entryFile = resolve(srcDir, 'index.js');
            
            if (!fs.existsSync(entryFile)) {
                return true;
            }
            
            const content = fs.readFileSync(entryFile, 'utf8');
            const versionMatch = content.match(/version:\s*['"]([^'"]+)['"]/);
            const sourceVersion = versionMatch ? versionMatch[1] : null;
            
            // Если версия в index.js не найдена, это нормально
            if (!sourceVersion) {
                return true;
            }
            
            // Сравниваем версии
            if (packageVersion !== sourceVersion) {
                Logger.warning(`Version mismatch detected:`);
                Logger.warning(`  package.json: ${packageVersion}`);
                Logger.warning(`  index.js: ${sourceVersion}`);
                Logger.warning(`Will use version from package.json (${packageVersion})`);
                
                // Автоматически исправляем
                this.version = packageVersion;
                this.updateVersionInSource();
                return false;
            }
            
            return true;
            
        } catch (error) {
            Logger.warning(`Failed to verify version consistency: ${error.message}`);
            return true;
        }
    }

    async build(generateReadme = true, tests = true) {
        const time = Logger.getTime();
        
        // Проверяем согласованность версий
        this.verifyVersionConsistency();
        
        console.log(Logger.createBox([
            '\x1b[36m[•]\x1b[0m TARGET: \x1b[33mprxz.js\x1b[0m',
            '\x1b[36m[•]\x1b[0m TIME: \x1b[90m' + time + '\x1b[0m'
        ]));
        
        Logger.step(1, tests ? 7 : 6, 'ANALYZING SOURCE STRUCTURE');
        
        try {
            const distDir = resolve('dist');
            const srcDir = resolve('src');
            
            Logger.step(2, tests ? 7 : 6, 'PURGING PREVIOUS BUILD');
            if (fs.existsSync(distDir)) {
                fs.rmSync(distDir, { recursive: true, force: true });
                Logger.info('Dist cleared');
            }
            fs.mkdirSync(distDir, { recursive: true });
            Logger.success('Dist created');
            
            const entryFile = resolve(srcDir, 'index.js');
            if (!fs.existsSync(entryFile)) {
                throw new Error(`ENTRY POINT NOT FOUND: ${entryFile}`);
            }
            
            Logger.step(3, tests ? 7 : 6, 'PROCESSING DEPENDENCIES');
            Logger.info('Loading: index.js');
            
            let content = fs.readFileSync(entryFile, 'utf8');
            
            // Извлекаем актуальную версию (на случай если она была обновлена)
            const versionMatch = content.match(/version:\s*['"]([^'"]+)['"]/);
            if (versionMatch) {
                this.version = versionMatch[1];
                Logger.info(`Using version from source: ${this.version}`);
            }
            
            content = this.processor.processFileImports(content, srcDir);
            
            // Изменяем export default на присваивание глобальной переменной
            content = content.replace(/export default prxz;/, `
        // [EXPORT] Injecting into global scope
        if (typeof window !== 'undefined') {
            window.prxz = prxz;
        } else if (typeof global !== 'undefined') {
            global.prxz = prxz;
        } else if (typeof self !== 'undefined') {
            self.prxz = prxz;
        }
        
        if (typeof module !== 'undefined' && module.exports) {
            module.exports = prxz;
        }
        
        if (typeof define === 'function' && define.amd) {
            define([], function() {
                return prxz;
            });
        }
    `);
            
            // Читаем информацию из package.json для заголовка
            let author = 'Unknown Author';
            let license = 'MIT';
            let repository = '';
            
            try {
                const packageJsonPath = resolve('package.json');
                if (fs.existsSync(packageJsonPath)) {
                    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                    author = packageJson.author || author;
                    license = packageJson.license || license;
                    repository = packageJson.repository ? 
                        (typeof packageJson.repository === 'string' ? packageJson.repository : 
                         packageJson.repository.url || '') : '';
                    
                    // Форматируем URL репозитория
                    if (repository.includes('github.com')) {
                        repository = repository.replace(/^git\+/, '')
                                              .replace(/\.git$/, '');
                    }
                }
            } catch (error) {
                Logger.warning(`Could not read package.json for metadata: ${error.message}`);
            }
            
            const header = `// prxz.js - Библиотека форматирования данных
    // Версия ${this.version} | ${new Date().toISOString()}
    // ${license} License | Compiled by Bundler
    // Author: ${author}
    ${repository ? `// Repository: ${repository}` : ''}
    // Build ID: ${this.buildStats.buildId}
    // =============================================\n\n`;
            
            const wrapper = `(function() {
        'use strict';\n\n`;
            
            const footer = `
    })();`;
            
            const fullContent = header + wrapper + content + footer;
            
            Logger.step(4, tests ? 7 : 6, 'WRITING OUTPUT FILES');
            
            const outputFile = join(distDir, 'prxz.js');
            fs.writeFileSync(outputFile, fullContent, 'utf8');
            Logger.success(`prxz.js (${Logger.formatNumber(fullContent.length)} bytes)`);
            
            // Используем Terser для минификации
            Logger.info('Minifying with Terser...');
            const minifiedContent = await this.utils.minifyJS(fullContent);
            
            let finalMinifiedContent;
            
            if (minifiedContent === fullContent) {
                Logger.warning('Minification returned original content, fallback to basic minification');
                // Фоллбэк на базовую минификацию
                finalMinifiedContent = fullContent
                    .replace(/\/\/[^\n]*\n/g, '\n')
                    .replace(/\/\*[\s\S]*?\*\//g, '')
                    .replace(/\s+/g, ' ')
                    .replace(/\s*([=+\-*\/<>!&|{}();:,.[\]]) ?/g, '$1')
                    .replace(/^[ \t]+|[ \t]+$/gm, '')
                    .replace(/;+/g, ';')
                    .replace(/\s*`\s*/g, '`')
                    .trim();
                
                const minFile = join(distDir, 'prxz.min.js');
                fs.writeFileSync(minFile, finalMinifiedContent, 'utf8');
                Logger.success(`prxz.min.js (${Logger.formatNumber(finalMinifiedContent.length)} bytes, fallback)`);
                
                const compression = ((1 - finalMinifiedContent.length / fullContent.length) * 100).toFixed(1);
                
                this.buildStats = {
                    filesCount: this.processor.processedFiles.size,
                    originalSize: Logger.formatNumber(fullContent.length),
                    minifiedSize: Logger.formatNumber(finalMinifiedContent.length),
                    compressionRate: compression,
                    buildId: this.buildStats.buildId,
                    errors: this.processor.errors,
                    timestamp: this.buildStats.timestamp
                };
            } else {
                finalMinifiedContent = minifiedContent;
                const minFile = join(distDir, 'prxz.min.js');
                fs.writeFileSync(minFile, finalMinifiedContent, 'utf8');
                Logger.success(`prxz.min.js (${Logger.formatNumber(finalMinifiedContent.length)} bytes)`);
                
                const compression = ((1 - finalMinifiedContent.length / fullContent.length) * 100).toFixed(1);
                
                this.buildStats = {
                    filesCount: this.processor.processedFiles.size,
                    originalSize: Logger.formatNumber(fullContent.length),
                    minifiedSize: Logger.formatNumber(finalMinifiedContent.length),
                    compressionRate: compression,
                    buildId: this.buildStats.buildId,
                    errors: this.processor.errors,
                    timestamp: this.buildStats.timestamp
                };
            }
            
            console.log('\n' + Logger.createBox([
                '\x1b[32m[✓]\x1b[0m BUILD COMPLETE',
                `\x1b[90mVersion:   \x1b[0m ${this.version}`,
                `\x1b[90mFiles:     \x1b[0m ${this.buildStats.filesCount}`,
                `\x1b[90mOriginal:  \x1b[0m ${this.buildStats.originalSize} bytes`,
                `\x1b[90mMinified:  \x1b[0m ${this.buildStats.minifiedSize} bytes`,
                `\x1b[90mCompress:  \x1b[0m ${this.buildStats.compressionRate}%`,
                `\x1b[90mLocation:  \x1b[0m dist/`
            ]));
            
            if (this.processor.errors.length > 0) {
                Logger.warning('WARNINGS DETECTED:');
                this.processor.errors.forEach(error => Logger.warning(error));
            }
            
            // Генерация README
            if (generateReadme) {
                Logger.step(5, tests ? 7 : 6, 'GENERATING DOCUMENTATION');
                const readmeGenerator = new READMEGenerator({
                    ...this.buildStats,
                    version: this.version,
                    author: author,
                    license: license,
                    repository: repository
                });
                await readmeGenerator.writeToFile('README.md');
                
                // Также создаем небольшой README для папки dist
                const distReadme = `
    # Собранные файлы
    
    Эта папка содержит собранные версии библиотеки prxz.js.
    
    ## Файлы
    
    - **prxz.js** - Полная версия библиотеки с комментариями
    - **prxz.min.js** - Минифицированная версия для продакшена (с использованием Terser)
    
    ## Использование
    
    ### Браузер
    \`\`\`html
    <script src="prxz.min.js"></script>
    <script>
      console.log(prxz.version); // "${this.version}"
    </script>
    \`\`\`
    
    ### Информация о сборке
    - **Версия**: ${this.version}
    - **Автор**: ${author}
    - **Лицензия**: ${license}
    - **Дата**: ${new Date().toLocaleString('ru-RU')}
    - **ID**: ${this.buildStats.buildId}
    - **Размер**: ${this.buildStats.minifiedSize} байт (минифицированный)
    - **Сжатие**: ${this.buildStats.compressionRate}%
    
    ---
    
    > Собрано с помощью кастомного бандлера
    > ${this.buildStats.timestamp}
    `;
                
                fs.writeFileSync(join(distDir, 'README.md'), distReadme, 'utf8');
                Logger.success('Dist README created');
            }

            // ЗАПУСК ТЕСТОВ ТОЛЬКО ПОСЛЕ ТОГО, КАК ФАЙЛЫ СОЗДАНЫ
            if (tests) {
                Logger.step(6, 7, 'VERIFYING BUILD FILES');
                
                // Проверяем существование файлов перед запуском тестов
                const minFile = join(distDir, 'prxz.min.js');
                const jsFile = join(distDir, 'prxz.js');
                
                if (!fs.existsSync(minFile)) {
                    throw new Error(`Minified file not found: ${minFile}. Cannot run tests.`);
                }
                
                if (!fs.existsSync(jsFile)) {
                    throw new Error(`Main file not found: ${jsFile}. Cannot run tests.`);
                }
                
                const minFileSize = fs.statSync(minFile).size;
                const jsFileSize = fs.statSync(jsFile).size;
                
                Logger.info(`✓ prxz.min.js: ${Logger.formatNumber(minFileSize)} bytes`);
                Logger.info(`✓ prxz.js: ${Logger.formatNumber(jsFileSize)} bytes`);
                
                Logger.step(7, 7, 'STARTING TESTS');
                
                try {
                    // Запускаем тесты
                    await runTests();
                } catch (testError) {
                    
                    // Не прерываем процесс, просто показываем ошибку
                    this.buildStats.testError = testError.message;
                }
            }
            
            // Финальное сообщение
            if (tests) {
                console.log('\n' + Logger.createBox([
                    '\x1b[32m[✓]\x1b[0m BUILD AND TEST PROCESS COMPLETE',
                    `\x1b[90mTime:      \x1b[0m ${time}`,
                    `\x1b[90mVersion:   \x1b[0m ${this.version}`,
                    `\x1b[90mStatus:    \x1b[0m ${this.buildStats.testError ? '\x1b[33mTests Failed\x1b[0m' : '\x1b[32mAll Tests Passed\x1b[0m'}`,
                    `\x1b[90mBuild ID:  \x1b[0m ${this.buildStats.buildId}`
                ]));
            } else {
                console.log('\n' + Logger.createBox([
                    '\x1b[32m[✓]\x1b[0m BUILD PROCESS COMPLETE',
                    `\x1b[90mTime:      \x1b[0m ${time}`,
                    `\x1b[90mVersion:   \x1b[0m ${this.version}`,
                    `\x1b[90mBuild ID:  \x1b[0m ${this.buildStats.buildId}`
                ]));
            }
            
            // Возвращаем статистику сборки
            return this.buildStats;
            
        } catch (error) {
            console.log('\n' + Logger.createBox([
                '\x1b[31m[✗]\x1b[0m BUILD FAILED',
                `\x1b[31mError: ${error.message}\x1b[0m`
            ]));
            
            this.buildStats.error = error.message;
            this.buildStats.success = false;
            
            // Выбрасываем ошибку дальше, если нужно
            throw error;
        }
    }
    
    /**
     * Утилита для изменения версии (можно использовать в CLI)
     * @param {string} newVersion - Новая версия
     */
    static async setVersion(newVersion) {
        try {
            // Обновляем package.json
            const packageJsonPath = resolve('package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                packageJson.version = newVersion;
                fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
                Logger.success(`Updated package.json version to: ${newVersion}`);
            }
            
            // Обновляем index.js
            const srcDir = resolve('src');
            const entryFile = resolve(srcDir, 'index.js');
            
            if (fs.existsSync(entryFile)) {
                let content = fs.readFileSync(entryFile, 'utf8');
                const versionRegex = /(version\s*:\s*['"])([^'"]+)(['"])/;
                
                if (versionRegex.test(content)) {
                    content = content.replace(versionRegex, `$1${newVersion}$3`);
                    fs.writeFileSync(entryFile, content, 'utf8');
                    Logger.success(`Updated index.js version to: ${newVersion}`);
                } else {
                    // Добавляем версию если её нет
                    const prxzObjectRegex = /(const\s+prxz\s*=\s*\{)/;
                    if (prxzObjectRegex.test(content)) {
                        content = content.replace(
                            prxzObjectRegex,
                            `$1\n    version: '${newVersion}',`
                        );
                        fs.writeFileSync(entryFile, content, 'utf8');
                        Logger.success(`Added version to index.js: ${newVersion}`);
                    }
                }
            }
            
            return true;
            
        } catch (error) {
            Logger.error(`Failed to set version: ${error.message}`);
            return false;
        }
    }
}