import fs from 'fs';
import { resolve, join } from 'path';
import { Logger } from './Logger.js';
import { FileProcessor } from './FileProcessor.js';
import { Utils } from './Utils.js';
import { READMEGenerator } from './READMEGenerator.js';

export class Bundler {
    constructor() {
        this.processor = new FileProcessor();
        this.utils = Utils;
        this.version = '1.0.0';
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

    async build(generateReadme = true) {
        const time = Logger.getTime();
        
        console.log(Logger.createBox([
            '\x1b[36m[•]\x1b[0m BUNDLER v1.0.0',
            '\x1b[36m[•]\x1b[0m TARGET: \x1b[33mprxz.js\x1b[0m',
            '\x1b[36m[•]\x1b[0m TIME: \x1b[90m' + time + '\x1b[0m'
        ]));
        
        Logger.step(1, 5, 'ANALYZING SOURCE STRUCTURE');
        
        try {
            const distDir = resolve('dist');
            const srcDir = resolve('src');
            
            Logger.step(2, 5, 'PURGING PREVIOUS BUILD');
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
            
            Logger.step(3, 5, 'PROCESSING DEPENDENCIES');
            Logger.info('Loading: index.js');
            
            let content = fs.readFileSync(entryFile, 'utf8');
            
            // Извлекаем версию из index.js
            const versionMatch = content.match(/version:\s*['"]([^'"]+)['"]/);
            if (versionMatch) {
                this.version = versionMatch[1];
                Logger.info(`Detected version: ${this.version}`);
            } else {
                Logger.warning('Version not found in index.js, using default: 1.0.0');
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
            
            const header = `// prxz.js - Библиотека форматирования данных
    // Версия ${this.version} | ${new Date().toISOString()}
    // MIT License | Compiled by Bundler
    // Github: https://github.com/mizuki666
    // Build ID: ${this.buildStats.buildId}
    // ====================================\n\n`;
            
            const wrapper = `(function() {
        'use strict';\n\n`;
            
            const footer = `
    })();`;
            
            const fullContent = header + wrapper + content + footer;
            
            Logger.step(4, 5, 'WRITING OUTPUT FILES');
            
            const outputFile = join(distDir, 'prxz.js');
            fs.writeFileSync(outputFile, fullContent, 'utf8');
            Logger.success(`prxz.js (${Logger.formatNumber(fullContent.length)} bytes)`);
            
            // Используем Terser для минификации
            Logger.info('Minifying with Terser...');
            const minifiedContent = await this.utils.minify(fullContent);
            
            if (minifiedContent === fullContent) {
                Logger.warning('Minification returned original content, fallback to basic minification');
                // Фоллбэк на базовую минификацию
                const fallbackMinified = fullContent
                    .replace(/\/\/[^\n]*\n/g, '\n')
                    .replace(/\/\*[\s\S]*?\*\//g, '')
                    .replace(/\s+/g, ' ')
                    .replace(/\s*([=+\-*\/<>!&|{}();:,.[\]]) ?/g, '$1')
                    .replace(/^[ \t]+|[ \t]+$/gm, '')
                    .replace(/;+/g, ';')
                    .replace(/\s*`\s*/g, '`')
                    .trim();
                
                const minFile = join(distDir, 'prxz.min.js');
                fs.writeFileSync(minFile, fallbackMinified, 'utf8');
                Logger.success(`prxz.min.js (${Logger.formatNumber(fallbackMinified.length)} bytes, fallback)`);
                
                const compression = ((1 - fallbackMinified.length / fullContent.length) * 100).toFixed(1);
                
                this.buildStats = {
                    filesCount: this.processor.processedFiles.size,
                    originalSize: Logger.formatNumber(fullContent.length),
                    minifiedSize: Logger.formatNumber(fallbackMinified.length),
                    compressionRate: compression,
                    buildId: this.buildStats.buildId,
                    errors: this.processor.errors,
                    timestamp: this.buildStats.timestamp
                };
            } else {
                const minFile = join(distDir, 'prxz.min.js');
                fs.writeFileSync(minFile, minifiedContent, 'utf8');
                Logger.success(`prxz.min.js (${Logger.formatNumber(minifiedContent.length)} bytes)`);
                
                const compression = ((1 - minifiedContent.length / fullContent.length) * 100).toFixed(1);
                
                this.buildStats = {
                    filesCount: this.processor.processedFiles.size,
                    originalSize: Logger.formatNumber(fullContent.length),
                    minifiedSize: Logger.formatNumber(minifiedContent.length),
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
                Logger.step(5, 5, 'GENERATING DOCUMENTATION');
                const readmeGenerator = new READMEGenerator({
                    ...this.buildStats,
                    version: this.version
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
            
            Logger.info(`Completed at ${time}`);
            
        } catch (error) {
            console.log('\n' + Logger.createBox([
                '\x1b[31m[✗]\x1b[0m BUILD FAILED',
                `\x1b[31mError: ${error.message}\x1b[0m`
            ]));
            process.exit(1);
        }
    }
}