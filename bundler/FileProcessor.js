import fs from 'fs';
import { resolve, dirname } from 'path';
import { Logger } from './Logger.js';

export class FileProcessor {
    constructor() {
        this.processedFiles = new Set();
        this.importCache = new Map();
        this.errors = [];
        this.importedModules = new Map(); // Для отслеживания уже импортированных модулей
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
                    
                    // Проверяем, был ли этот файл уже импортирован
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

    getModuleKey(path, imports) {
        // Создаем уникальный ключ для модуля на основе пути и импортируемых сущностей
        return `${path}:${imports}`;
    }

    resolveImportPath(importPath, baseDir) {
        let path = importPath;
        
        if (!path.endsWith('.js')) {
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