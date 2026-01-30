import { Validators } from './helpers/values/validators.js';
import Parsers from './helpers/values/parsers.js';
import Formatters from './helpers/values/formatters.js';

const { isEmptyValue, isObject, isSpecialNumber, isNumericString } = Validators
const { parseNumberFromString,  } = Parsers
const { determineDecimals, formatScientific, formatWithLocale, formatWithoutLocale } = Formatters


const FormatValue = {
    /**
     * Форматирует число с настройками
     * @param {number} value - Число для форматирования
     * @param {number|string} decimals - Знаков после запятой или 'auto' (по умолчанию: 2)
     * @param {boolean} localize - Локализация (разделители тысяч) (по умолчанию: true)
     * @returns {string} Отформатированная строка
     */
    fval(value, decimals = 2, localize = true) {
        // Внутренняя рекурсивная функция
        const formatInternal = (val, dec, loc, isRoot = false) => {
            // 1. Проверка пустых значений
            if (isEmptyValue(val)) {
                return '-';
            }
            
            // 2. Обработка объектов
            if (isObject(val)) {
                // Если это корневой объект
                if (isRoot) {
                    if (Object.keys(val).length === 0) {
                        return null; // Пустой объект возвращает null
                    }
                    return null;
                }
                // Для вложенных объектов возвращаем как было
                return '[object]';
            }
            
            // 3. Обработка массивов
            if (Array.isArray(val)) {
                // Если это корневой массив, возвращаем форматированный массив
                if (isRoot) {
                    if (val.length === 0) {
                        return '-';
                    }
                    
                    // Форматируем каждый элемент как число с правильными знаками после запятой
                    const formattedArray = val.map(item => {
                        try {
                            // Форматируем элемент
                            const formatted = formatInternal(item, dec, loc, false);
                            
                            // Если результат - строка с числом, конвертируем обратно в число
                            if (typeof formatted === 'string') {
                                // Проверяем специальные случаи
                                if (formatted === '-' || formatted === 'NaN' || 
                                    formatted === '∞' || formatted === '-∞' ||
                                    formatted === '[object]') {
                                    return formatted;
                                }
                                
                                // Пытаемся извлечь число из строки
                                const cleanStr = formatted.replace(/[^\d.,-]/g, '').replace(',', '.');
                                const num = parseFloat(cleanStr);
                                
                                if (!isNaN(num)) {
                                    // Применяем округление с учетом dec
                                    if (dec === 'auto' || dec === undefined) {
                                        // Используем determineDecimals для согласованности
                                        const decimalsInfo = determineDecimals(num, dec);
                                        if (!decimalsInfo.scientific) {
                                            return parseFloat(num.toFixed(decimalsInfo.fixed));
                                        }
                                        return formatScientific(num);
                                    } else if (typeof dec === 'number') {
                                        return parseFloat(num.toFixed(dec));
                                    }
                                }
                                // Если не удалось распарсить число, возвращаем строку как есть
                                return formatted;
                            }
                            
                            // Если это уже число
                            if (typeof formatted === 'number') {
                                // Для чисел тоже применяем округление
                                if (dec === 'auto' || dec === undefined) {
                                    const decimalsInfo = determineDecimals(formatted, dec);
                                    if (!decimalsInfo.scientific) {
                                        return parseFloat(formatted.toFixed(decimalsInfo.fixed));
                                    }
                                    return formatScientific(formatted);
                                } else if (typeof dec === 'number') {
                                    return parseFloat(formatted.toFixed(dec));
                                }
                            }
                            
                            return formatted;
                        } catch (error) {
                            console.warn(`fval: ошибка обработки элемента массива:`, item, error);
                            return '-';
                        }
                    });
                    
                    return formattedArray;
                }
                
                // Для вложенных массивов - старая логика
                if (val.length === 0) {
                    return '-';
                }
                
                // Безопасно обрабатываем массив
                for (let i = 0; i < val.length; i++) {
                    try {
                        const result = formatInternal(val[i], dec, loc, false);
                        if (result !== '-' && result !== '[object]' && result !== 'NaN' && !result.includes('∞')) {
                            return result;
                        }
                    } catch (error) {
                        console.warn(`fval: ошибка обработки элемента массива [${i}]:`, val[i], error);
                    }
                }
                return '-';
            }
            
            // 4. Конвертация в число
            let num;
            
            if (typeof val === 'number') {
                num = val;
            } else if (typeof val === 'boolean') {
                num = val ? 1 : 0;
            } else if (typeof val === 'string') {
                // Проверяем, начинается ли строка с нецифрового символа
                if (!isNumericString(val) && /^[^\d.,+\-]/.test(val.trim())) {
                    return val.trim();
                }
                
                num = parseNumberFromString(val);
                
                if (isNaN(num)) {
                    return '-';
                }
            } else {
                num = Number(val);
            }
            
            // 5. Проверка специальных числовых значений
            if (isSpecialNumber(num)) {
                if (isNaN(num)) return 'NaN';
                return num > 0 ? '∞' : '-∞';
            }
            
            // 6. Особый случай: для чисел меньше 0.001 переключаемся на auto
            const absNum = Math.abs(num);
            let effectiveDecimals = dec;
            
            if (absNum > 0 && absNum < 0.001 && typeof dec === 'number') {
                effectiveDecimals = 'auto';
            }
            
            // 7. Определение количества знаков после запятой
            const decimalsInfo = determineDecimals(num, effectiveDecimals);
            
            if (decimalsInfo.scientific) {
                return formatScientific(num);
            }
            
            // 8. Форматирование
            if (loc) {
                const useGrouping = Math.abs(num) >= 1000;
                return formatWithLocale(num, decimalsInfo, useGrouping);
            }
            
            return formatWithoutLocale(num, decimalsInfo);
        };
        
        // Вызываем внутреннюю функцию с isRoot = true для корневого вызова
        return formatInternal(value, decimals, localize, true);
    },

    /**
     * Форматирует число как проценты
     * @param {number} value - Число для форматирования (например: 25.5)
     * @param {number} decimals - Знаков после запятой (по умолчанию: 2)
     * @returns {string} Строка с процентами
     */
    fperc(value, decimals = 2) {
        // Вспомогательная функция для безопасного получения decimals
        const getSafeDecimals = (dec) => {
            if (typeof dec === 'number') {
                return Math.max(0, Math.min(100, Math.floor(dec)));
            }
            if (typeof dec === 'string') {
                const parsed = parseInt(dec, 10);
                return Number.isNaN(parsed) ? 2 : Math.max(0, Math.min(100, Math.floor(parsed)));
            }
            return 2;
        };
        
        // Используем ту же логику проверки пустых значений, что и в fval
        if (isEmptyValue(value)) {
            return '-';
        }
        
        // Обработка объектов - возвращаем строковое представление с %
        if (isObject(value) && !Array.isArray(value)) {
            return String(value) + '%';
        }
        
        // Обработка массивов
        if (Array.isArray(value)) {
            if (value.length === 0) {
                return '-';
            }
            // Берем первый валидный элемент массива
            for (let i = 0; i < value.length; i++) {
                const element = value[i];
                
                // Проверяем пустые значения
                if (isEmptyValue(element)) continue;
                
                // Обработка вложенных объектов
                if (isObject(element) && !Array.isArray(element)) {
                    return String(element) + '%';
                }
                
                // Обработка вложенных массивов
                if (Array.isArray(element)) {
                    if (element.length === 0) continue;
                    // Берем первый элемент вложенного массива
                    const nestedElement = element[0];
                    if (isEmptyValue(nestedElement)) continue;
                    value = nestedElement;
                    break;
                }
                
                // Используем элемент массива
                value = element;
                break;
            }
            
            // Если после обработки массива value остался массивом
            if (Array.isArray(value)) {
                return '-';
            }
        }
        
        // Для обычных значений
        let num;
        
        if (typeof value === 'number') {
            num = value;
        } else if (typeof value === 'boolean') {
            num = value ? 1 : 0;
        } else if (typeof value === 'string') {
            // Проверяем, начинается ли строка с нецифрового символа
            if (!isNumericString(value) && /^[^\d.,+\-]/.test(value.trim())) {
                // Если строка не начинается с цифры, возвращаем как есть
                return value.trim();
            }
            
            num = parseNumberFromString(value);
            
            if (isNaN(num)) {
                // Если не удалось распарсить, возвращаем как есть
                return value.trim();
            }
        } else {
            num = Number(value);
        }
        
        // Проверка специальных числовых значений
        if (isSpecialNumber(num)) {
            if (isNaN(num)) return 'NaN%';
            return num > 0 ? 'Infinity%' : '-Infinity%';
        }
        
        // Используем правильное округление
        const safeDecimals = getSafeDecimals(decimals);
        
        // Используем Math.round для правильного округления
        if (safeDecimals === 0) {
            return Math.round(num) + '%';
        }
        
        const factor = Math.pow(10, safeDecimals);
        const rounded = Math.round(num * factor) / factor;
        
        // Форматируем с нужным количеством знаков
        // Используем toFixed, но на уже округленном значении
        return rounded.toFixed(safeDecimals) + '%';
    },

    /**
     * Форматирует число как деньги
     * @param {number} value - Денежная сумма
     * @param {string} currency - Код валюты: 'RUB', 'USD', 'EUR' (по умолчанию: 'RUB')
     * @param {number} decimals - Знаков после запятой (по умолчанию: 2)
     * @returns {string} Отформатированная денежная строка
     */
    fmoney(value, currency = 'RUB', decimals = 2) {
        if (value === null || value === undefined || value === '') {
            return '-';
        }
        
        const num = Number(value);
        if (isNaN(num)) {
            return String(value);
        }
        
        // Обработка специальных числовых значений
        if (num === Infinity) return "Infinity";
        if (num === -Infinity) return "-Infinity";
        if (!isFinite(num)) return "NaN";
        
        // Символы валют - используем только escape последовательности
        const currencySymbols = {
            'RUB': '\u20BD', // ₽
            'USD': '\u0024', // $
            'EUR': '\u20AC', // €
            'GBP': '\u00A3', // £
            'JPY': '\u00A5'  // ¥
        };
        
        const symbol = currencySymbols[currency] || currency;
        
        // Форматируем через Intl.NumberFormat и заменяем пробелы
        const formatter = new Intl.NumberFormat('ru-RU', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
        
        let formatted = formatter.format(Math.abs(num));
        // Заменяем все пробелы на thin space
        formatted = formatted.replace(/\s/g, '\u202F');
        // Заменяем точку на запятую (на всякий случай)
        formatted = formatted.replace(/\./g, ',');
        
        const sign = num < 0 ? '-' : '';
        const result = `${sign}${formatted} ${symbol}`;
        
        return result;
    },
    /**
     * Сокращает большие числа (тысячи, миллионы и т.д.)
     * @param {number} value - Число для сокращения
     * @param {number} decimals - Знаков после запятой (по умолчанию: 2)
     * @returns {string} Сокращенное число
     */
    fshortval(value, decimals = 2) {
        if (value === null || value === undefined || value === '') {
            return '-';
        }
        
        const num = Number(value);
        if (isNaN(num)) return String(value);
        
        // Обработка Infinity и -Infinity
        if (!isFinite(num)) {
            return num > 0 ? 'Infinity' : '-Infinity';
        }
        
        const absValue = Math.abs(num);
        
        if (absValue >= 1.0e+15) return `${(num / 1.0e+15).toFixed(decimals)} квадр`;
        if (absValue >= 1.0e+12) return `${(num / 1.0e+12).toFixed(decimals)} трлн`;
        if (absValue >= 1.0e+9) return `${(num / 1.0e+9).toFixed(decimals)} млрд`;
        if (absValue >= 1.0e+6) return `${(num / 1.0e+6).toFixed(decimals)} млн`;
        if (absValue >= 1.0e+3) return `${(num / 1.0e+3).toFixed(decimals)} тыс`;
        
        return num.toFixed(decimals);
    }
};

export { FormatValue };