// tests/utils/loadLibrary.js
import { readFileSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function loadPrxz() {
    console.log('🔍 Loading prxz from minified bundle...');
    
    const distPath = resolve(__dirname, '../../dist/prxz.min.js');
    
    if (!existsSync(distPath)) {
        throw new Error(`Dist file not found: ${distPath}`);
    }
    
    const content = readFileSync(distPath, 'utf8');
    console.log(`  File size: ${content.length} bytes`);
    
    try {
        // Создаем песочницу с глобальными объектами
        const sandbox = {
            window: {},
            global: {},
            self: {},
            module: { exports: {} },
            exports: {},
            console,
            fetch: () => Promise.reject(new Error('fetch not available in tests')),
            sessionStorage: {
                getItem: () => null
            },
            setTimeout,
            Promise
        };
        
        // Запускаем код в песочнице
        const script = new vm.Script(content);
        script.runInNewContext(sandbox);
        
        // Извлекаем prxz из разных мест
        let prxz = sandbox.module.exports || 
                   sandbox.exports || 
                   sandbox.window.prxz || 
                   sandbox.global.prxz || 
                   sandbox.self.prxz;
        
        if (!prxz || typeof prxz !== 'object') {
            // Если не нашли, ищем в исходном коде определение
            const prxzMatch = content.match(/prxz\s*=\s*(\{[^}]+\})/);
            if (prxzMatch) {
                try {
                    prxz = eval(`(${prxzMatch[1]})`);
                } catch (e) {
                    console.log('  Could not parse prxz object from match');
                }
            }
        }
        
        if (!prxz || typeof prxz !== 'object') {
            // Последняя попытка - извлекаем вручную из минифицированного кода
            prxz = extractPrxzManually(content);
        }
        
        if (prxz) {
            return prxz;
        }
        
        throw new Error('Could not extract valid prxz object');
        
    } catch (error) {
        console.log('❌ Error loading prxz:', error.message);
        // Фоллбэк: создаем минимальный объект из исходников
        return await loadFromSource();
    }
}

/**
 * Ручное извлечение prxz из минифицированного кода
 */
function extractPrxzManually(content) {
    console.log('  Attempting manual extraction...');
    
    // Ищем начало объекта prxz
    const start = content.indexOf('const prxz=');
    if (start === -1) return {};
    
    let braceCount = 0;
    let inString = false;
    let stringChar = '';
    let result = '';
    
    // Начинаем с '{' после 'const prxz='
    for (let i = start + 'const prxz='.length; i < content.length; i++) {
        const char = content[i];
        
        // Обработка строк
        if (inString) {
            result += char;
            if (char === stringChar && content[i-1] !== '\\') {
                inString = false;
            }
            continue;
        }
        
        // Начало строки
        if (char === '"' || char === "'" || char === '`') {
            inString = true;
            stringChar = char;
            result += char;
            continue;
        }
        
        // Подсчет скобок
        if (char === '{') {
            braceCount++;
        } else if (char === '}') {
            braceCount--;
        }
        
        result += char;
        
        // Конец объекта
        if (braceCount === 0 && result.trim().length > 0) {
            try {
                // Пробуем распарсить как JavaScript объект
                const prxz = eval(`(${result})`);
                console.log('  Manual extraction successful');
                return prxz;
            } catch (e) {
                console.log('  Manual extraction failed:', e.message);
                return {};
            }
        }
    }
    
    return {};
}

/**
 * Загрузка из исходников как фоллбэк
 */
async function loadFromSource() {
    console.log('  Trying to load from source...');
    
    try {
        // Пробуем загрузить напрямую модуль frm/v
        const srcPath = resolve(__dirname, '../../src/frm/v.js');
        if (existsSync(srcPath)) {
            const frmV = await import(srcPath);
            console.log('✅ Loaded frm/v from source');
            
            // Создаем минимальный prxz объект
            return {
                frm: {
                    v: frmV
                }
            };
        }
    } catch (error) {
        console.log('  Source loading failed:', error.message);
    }
}