import { minify as terserMinify } from 'terser';
import cssnano from 'cssnano';
import postcss from 'postcss';

export class Utils {
    static async minifyJS(content) {
        try {
            const result = await terserMinify(content, {
                compress: {
                    defaults: true,           // использовать настройки по умолчанию
                    drop_console: false,       // удалить console.*
                    drop_debugger: true,
                    dead_code: true,
                    evaluate: true,           // вычислять константные выражения
                    unsafe: true,             // использовать небезопасные оптимизации
                    unsafe_math: true,        // оптимизировать математику
                    unsafe_proto: true,       // оптимизировать доступ к прототипам
                    unsafe_regexp: true,      // оптимизировать регулярки
                    passes: 50,          // больше проходов
                },
                mangle: {
                    toplevel: true,           // манглить имена глобально
                    keep_fnames: false,       // не сохранять имена функций
                    properties: false,        // не манглить свойства объектов
                },
                format: {
                    beautify: false,
                    comments: false,
                },
            });
            
            return result.code || content;
        } catch (error) {
            console.error('Minification error:', error);
            return content;
        }
    }

    static async minifyCSS(content) {
        try {
            // Создаем экземпляр cssnano с настройками по умолчанию
            const processor = postcss([cssnano({
                preset: ['default', {
                    discardComments: { removeAll: true },
                    normalizeWhitespace: true,
                    // Отключаем опасные преобразования для сохранения специфичности
                    cssDeclarationSorter: false,
                    // Сохраняем важные комментарии (например, /*! important */)
                    minifyFontValues: { removeQuotes: false },
                    minifyParams: false,
                    normalizeString: { preferredQuote: 'double' },
                }]
            })]);
            
            const result = await processor.process(content, {
                from: undefined, // Не указываем файл, так как это строковый контент
            });
            
            return result.css || content;
        } catch (error) {
            console.error('CSS minification error:', error);
            // В случае ошибки возвращаем оригинальный контент
            return content;
        }
    }

    /**
     * Метод для определения типа контента и его минификации
     * @param {string} content - Контент для минификации
     * @param {string} filePath - Путь к файлу (для определения типа)
     * @returns {Promise<string>} Минифицированный контент
     */
    static async minifyContent(content, filePath) {
        if (!content || typeof content !== 'string') {
            return content;
        }

        const ext = filePath ? filePath.split('.').pop().toLowerCase() : '';
        
        try {
            switch (ext) {
                case 'js':
                case 'jsx':
                case 'ts':
                case 'tsx':
                    return await this.minifyJS(content);
                    
                case 'css':
                case 'scss':
                case 'sass':
                case 'less':
                    return await this.minifyCSS(content);
                    
                default:
                    // Для неизвестных типов возвращаем как есть
                    return content;
            }
        } catch (error) {
            console.error(`Minification failed for ${filePath || 'unknown'}:`, error.message);
            return content;
        }
    }
}