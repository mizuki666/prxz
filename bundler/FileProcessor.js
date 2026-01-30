import fs from 'fs';
import { resolve, dirname } from 'path';
import { Logger } from './Logger.js';
import { Utils } from './Utils.js';

export class FileProcessor {
    constructor() {
        this.processedFiles = new Set();
        this.importCache = new Map();
        this.errors = [];
        this.importedModules = new Map(); // Для отслеживания уже импортированных модулей
        this.cssContent = ''; // Для сбора CSS из компонентов
    }

    processFileImports(content, baseDir, depth = 0) {
        if (depth > 10) {
            this.errors.push(`[!] DEPTH OVERFLOW: ${baseDir}`);
            return content;
        }

        const importPatterns = [
            /import\s*{([^}]*)}\s*from\s*['"]([^'"]+)['"]/g,
            /import\s*\*\s*as\s*(\w+)\s*from\s*['"]([^'"]+)['"]/g,
            /import\s*(\w+)\s*from\s*['"]([^'"]+)['"]/g,
            /import\s*['"]([^'"]+)['"]/g,
            /export\s*{([^}]*)}\s*from\s*['"]([^'"]+)['"]/g
        ];

        let processedContent = content;
        let matches = [];

        importPatterns.forEach((pattern, index) => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                matches.push({
                    fullMatch: match[0],
                    type: index,
                    imports: match[1] || '',
                    alias: match[1] || '', // Для import * as alias
                    path: match[2] || match[1] || ''
                });
            }
        });

        for (const imp of matches) {
            if (imp.path.startsWith('.') || imp.path.startsWith('/')) {
                try {
                    const resolvedPath = this.resolveImportPath(imp.path, baseDir);
                    
                    // Проверяем расширение файла
                    const ext = resolvedPath.split('.').pop().toLowerCase();
                    
                    // Для CSS файлов - собираем их содержимое отдельно
                    if (['css', 'scss', 'sass', 'less'].includes(ext)) {
                        this.processCSSFile(resolvedPath);
                        // Заменяем импорт CSS на комментарий
                        processedContent = processedContent.replace(
                            imp.fullMatch,
                            `// [${Logger.getTime()}] CSS IMPORT: ${imp.path} (collected separately)\n`
                        );
                        continue;
                    }

                    // Проверяем, был ли этот JS файл уже импортирован
                    const moduleKey = this.getModuleKey(resolvedPath, imp.imports);
                    
                    if (this.importedModules.has(moduleKey)) {
                        // Файл уже был импортирован, просто заменяем импорт комментарием
                        processedContent = processedContent.replace(
                            imp.fullMatch, 
                            `// [${Logger.getTime()}] SKIP (already loaded): ${imp.path}\n`
                        );
                        continue;
                    }

                    if (!this.processedFiles.has(resolvedPath)) {
                        let fileContent = fs.readFileSync(resolvedPath, 'utf8');
                        fileContent = this.processFileImports(fileContent, dirname(resolvedPath), depth + 1);
                        fileContent = this.removeExports(fileContent);
                        this.importCache.set(resolvedPath, fileContent);
                        this.processedFiles.add(resolvedPath);
                    }

                    const cachedContent = this.importCache.get(resolvedPath);
                    
                    // Помечаем модуль как импортированный
                    this.importedModules.set(moduleKey, {
                        path: resolvedPath,
                        imports: imp.imports,
                        alias: imp.alias
                    });

                    processedContent = processedContent.replace(
                        imp.fullMatch, 
                        `\n// [${Logger.getTime()}] LOAD: ${imp.path}\n${cachedContent}\n// [EOF]: ${imp.path}\n`
                    );

                } catch (error) {
                    this.errors.push(`[ERROR] IMPORT FAILED: ${imp.path} >> ${error.message}`);
                    processedContent = processedContent.replace(
                        imp.fullMatch, 
                        `// [X] IMPORT ERROR: ${imp.path} // ${error.message}\n`
                    );
                }
            } else {
                processedContent = processedContent.replace(
                    imp.fullMatch, 
                    `// [EXT] ${imp.path}\n`
                );
            }
        }

        return processedContent;
    }

    /**
     * Обрабатывает CSS файлы - собирает их содержимое
     * @param {string} filePath - Путь к CSS файлу
     */
    processCSSFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            this.cssContent += `\n/* ===== CSS FROM: ${filePath} ===== */\n${content}\n`;
            Logger.info(`CSS collected from: ${filePath}`);
        } catch (error) {
            this.errors.push(`[ERROR] CSS FILE READ FAILED: ${filePath} >> ${error.message}`);
        }
    }

    /**
     * Получает собранный CSS контент
     * @returns {string} Собранный CSS
     */
    getCSSContent() {
        return this.cssContent;
    }

    /**
     * Минифицирует собранный CSS
     * @returns {Promise<string>} Минифицированный CSS
     */
    async getMinifiedCSS() {
        if (!this.cssContent.trim()) {
            return '';
        }
        
        try {
            Logger.info('Minifying CSS with cssnano...');
            const minified = await Utils.minifyCSS(this.cssContent);
            return minified;
        } catch (error) {
            this.errors.push(`[ERROR] CSS MINIFICATION FAILED: ${error.message}`);
            return this.cssContent; // Возвращаем неминифицированный в случае ошибки
        }
    }

    getModuleKey(path, imports) {
        // Создаем уникальный ключ для модуля на основе пути и импортируемых сущностей
        return `${path}:${imports}`;
    }

    resolveImportPath(importPath, baseDir) {
        let path = importPath;
        
        // Проверяем расширение
        const ext = path.split('.').pop().toLowerCase();
        const hasExtension = ['js', 'jsx', 'ts', 'tsx', 'css', 'scss', 'sass', 'less'].includes(ext);
        
        if (!hasExtension) {
            // Пробуем разные расширения
            const possibleExtensions = ['.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.sass', '.less'];
            
            for (const ext of possibleExtensions) {
                const testPath = resolve(baseDir, path + ext);
                if (fs.existsSync(testPath)) {
                    return testPath;
                }
            }
            
            // Если файл не найден с расширениями, пробуем как JS
            path += '.js';
        }
        
        const possiblePaths = [
            resolve(baseDir, path),
            resolve(baseDir, path.replace(/^\.\//, '')),
            resolve(baseDir, '..', 'src', path),
            resolve(baseDir, '..', 'src', path.replace(/^\.\//, ''))
        ];
        
        for (const possiblePath of possiblePaths) {
            if (fs.existsSync(possiblePath)) {
                return possiblePath;
            }
        }
        
        throw new Error(`[404] FILE NOT FOUND: ${importPath}`);
    }

    removeExports(content) {
        return content
            .replace(/export\s*{([^}]*)}/g, '')
            .replace(/export\s+default\s+/g, '')
            .replace(/export\s+(function|const|let|var|class|async)/g, '$1')
            .replace(/export\s*\*\s*from\s*['"][^'"]+['"]/g, '')
            .trim();
    }
}