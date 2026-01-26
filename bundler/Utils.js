import { minify as terserMinify } from 'terser';

export class Utils {
    static async minify(content) {
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
}