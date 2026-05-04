// prxz.js - Библиотека форматирования данных
    // Версия 1.0.1 | 2026-05-04T06:20:07.285Z
    // MIT License | Compiled by Bundler
    // Author: mizuki666
    // Repository: https://github.com/mizuki666/prxz
    // Build ID: 19df1a4dedc
    // =============================================

(function() {
        'use strict';


// [06:20:07] LOAD: ./utils/formatValue.js
// [06:20:07] LOAD: ./helpers/values/validators.js
// validators.js
const Validators = {
    isEmptyValue: (value) => {
        return value === null || 
            value === undefined || 
            value === '' || 
            (Array.isArray(value) && value.length === 0);
    },

    isObject: (value) => {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    },

    isSpecialNumber: (num) => {
        return isNaN(num) || !isFinite(num);
    },

    isInteger: (num) => {
        return Number.isInteger(num);
    },

    isScientificNotationNeeded: (num) => {
        const absNum = Math.abs(num);
        return absNum > 1e15 || 
               (absNum > 0 && absNum < 1e-6) ||
               absNum > Number.MAX_SAFE_INTEGER ||
               absNum === Infinity;
    },

    isNegativeZero: (num) => {
        return num === 0 && 1 / num === -Infinity;
    },

    isNumericString: (str) => {
        const cleaned = str.trim().replace(/[\s\u00A0\u202F,]/g, '');
        return !isNaN(cleaned) && !isNaN(parseFloat(cleaned));
    }
};
// [EOF]: ./helpers/values/validators.js
;

// [06:20:07] LOAD: ./helpers/values/parsers.js
// parsers.js
const Parsers = {
    // Карта нелатинских цифр → латинские.
    // Нужна для корректного парсинга чисел из строк с арабскими/индийскими и др. цифрами.
    digitMap: {
        // Arabic-Indic
        '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
        // Extended Arabic-Indic (Persian)
        '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
        // Devanagari
        '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
        // Bengali
        '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
        // Gurmukhi
        '੦': '0', '੧': '1', '੨': '2', '੩': '3', '੪': '4', '੫': '5', '੬': '6', '੭': '7', '੮': '8', '੯': '9',
        // Gujarati
        '૦': '0', '૧': '1', '૨': '2', '૩': '3', '૪': '4', '૫': '5', '૬': '6', '૭': '7', '૮': '8', '૯': '9',
        // Oriya
        '୦': '0', '୧': '1', '୨': '2', '୩': '3', '୪': '4', '୫': '5', '୬': '6', '୭': '7', '୮': '8', '୯': '9',
        // Tamil
        '௦': '0', '௧': '1', '௨': '2', '௩': '3', '௪': '4', '௫': '5', '௬': '6', '௭': '7', '௮': '8', '௯': '9',
        // Telugu
        '౦': '0', '౧': '1', '౨': '2', '౩': '3', '౪': '4', '౫': '5', '౬': '6', '౭': '7', '౮': '8', '౯': '9',
        // Kannada
        '೦': '0', '೧': '1', '೨': '2', '೩': '3', '೪': '4', '೫': '5', '೬': '6', '೭': '7', '೮': '8', '೯': '9',
        // Malayalam
        '൦': '0', '൧': '1', '൨': '2', '൩': '3', '൪': '4', '൫': '5', '൬': '6', '൭': '7', '൮': '8', '൯': '9',
        // Thai
        '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4', '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9',
        // Lao
        '໐': '0', '໑': '1', '໒': '2', '໓': '3', '໔': '4', '໕': '5', '໖': '6', '໗': '7', '໘': '8', '໙': '9',
        // Myanmar
        '၀': '0', '၁': '1', '၂': '2', '၃': '3', '၄': '4', '၅': '5', '၆': '6', '၇': '7', '၈': '8', '၉': '9',
        // Khmer
        '០': '0', '១': '1', '២': '2', '៣': '3', '៤': '4', '៥': '5', '៦': '6', '៧': '7', '៨': '8', '៩': '9',
    },

    normalizeDigits: (str) => {
        // Конвертируем все нелатинские цифры в латинские
        return str.replace(/[٠-۹०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯๐-๙໐-໙၀-၉០-៩]/g, 
            char => Parsers.digitMap[char] || char);
    },

    normalizeFullWidth: (str) => {
        // Конвертируем полную ширину в обычные символы
        return str.replace(/[０-９．]/g, char => {
            if (char === '．') return '.';
            return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
        });
    },

    cleanNumberString: (str) => {
        let clean = str.trim();
        
        // Заменяем разные виды пробелов на обычный пробел
        clean = clean.replace(/[\u00A0\u2009\u202F\u205F]/g, ' ');
        
        // Нормализуем цифры
        clean = Parsers.normalizeDigits(clean);
        clean = Parsers.normalizeFullWidth(clean);
        
        // Убираем все, кроме цифр, точки, запятой, минуса, плюса и E/e
        clean = clean.replace(/[^\d.,+\-Ee\s]/g, '');
        
        // Убираем пробелы
        clean = clean.replace(/\s/g, '');
        
        return clean;
    },

    parseSeparators: (str) => {
        // Обработка разделителей тысяч и десятичных
        if (str.includes('.')) {
            str = str.replace(/,/g, '');
        } else {
            const commaCount = (str.match(/,/g) || []).length;
            if (commaCount > 0) {
                if (commaCount === 1) {
                    str = str.replace(',', '.');
                } else {
                    const lastCommaIndex = str.lastIndexOf(',');
                    str = str.substring(0, lastCommaIndex).replace(/,/g, '') + 
                          '.' + str.substring(lastCommaIndex + 1);
                }
            }
        }
        
        return str;
    },

    parseNumberFromString: (str) => {
        const clean = Parsers.cleanNumberString(str);
        const withSeparators = Parsers.parseSeparators(clean);
        
        // Удаляем лишние точки (оставляем только последнюю)
        const parts = withSeparators.split('.');
        if (parts.length > 1) {
            const finalStr = parts[0] + '.' + parts.slice(1).join('');
            return parseFloat(finalStr);
        }
        
        return parseFloat(withSeparators);
    }
};

Parsers;
// [EOF]: ./helpers/values/parsers.js
;

// [06:20:07] LOAD: ./helpers/values/formatters.js
// formatters.js
// [06:20:07] SKIP (already loaded): ./validators.js
;

const Formatters = {
    narrowNoBreakSpace: '\u202F',

    determineDecimals: (num, decimalsMode) => {
        // Если передано число, используем его как фиксированное количество знаков
        if (typeof decimalsMode === 'number') {
            return { min: decimalsMode, max: decimalsMode };
        }
        
        // Режим 'auto'
        if (Validators.isScientificNotationNeeded(num)) {
            return { scientific: true };
        }
        
        // Для очень маленьких чисел показываем больше знаков
        const absNum = Math.abs(num);
        if (absNum > 0 && absNum < 0.001) {
            const str = num.toString();
            if (str.includes('e-')) {
                // Для чисел в экспоненциальной нотации
                const [mantissa, exp] = str.split('e-');
                const firstNonZero = mantissa.replace('.', '').search(/[1-9]/);
                const totalDigits = parseInt(exp) + firstNonZero - 1;
                return { min: totalDigits + 2, max: totalDigits + 2 };
            } else if (str.includes('.')) {
                const decimalPart = str.split('.')[1];
                // Показываем все значащие цифры
                const neededDigits = decimalPart.length;
                return { min: neededDigits, max: neededDigits };
            }
        }
        
        // Для целых чисел
        if (Validators.isInteger(num)) {
            return { min: 0, max: 0 };
        }
        
        // Для остальных чисел: показываем от 2 до 6 знаков
        const str = num.toString();
        let decimalPart = str.includes('.') ? str.split('.')[1] : '';
        decimalPart = decimalPart.replace(/0+$/, '');
        const significantDigits = decimalPart.length;
        
        if (significantDigits <= 2) {
            return { min: significantDigits, max: significantDigits };
        } else if (significantDigits <= 6) {
            return { min: 2, max: Math.min(significantDigits, 6) };
        } else {
            return { min: 2, max: 6 };
        }
    },

    formatScientific: (num) => {
        const exp = Math.floor(Math.log10(Math.abs(num)));
        const mantissa = num / Math.pow(10, exp);
        return mantissa.toFixed(2) + 'e' + exp;
    },

    formatWithLocale: (num, decimals, useGrouping = true) => {
        const options = {
            minimumFractionDigits: decimals.min,
            maximumFractionDigits: decimals.max,
            useGrouping
        };
        
        let result = num.toLocaleString('ru-RU', options);
        
        // Заменяем обычные пробелы на узкий неразрывный пробел
        result = result.replace(/\s/g, Formatters.narrowNoBreakSpace);
        
        // Обработка -0
        if (Validators.isNegativeZero(num) || result.startsWith('-0')) {
            result = result.substring(1);
        }
        
        return result;
    },

    formatWithoutLocale: (num, decimals) => {
        let result;
        if (decimals.min === decimals.max) {
            result = num.toFixed(decimals.min);
        } else {
            const factor = Math.pow(10, decimals.max);
            const rounded = Math.round(num * factor) / factor;
            result = rounded.toString();
        }
        
        // Заменяем точку на запятую
        result = result.replace('.', ',');
        
        if (Validators.isNegativeZero(num) || result.startsWith('-0')) {
            result = result.substring(1);
        }
        
        return result;
    }
};

Formatters;
// [EOF]: ./helpers/values/formatters.js
;

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

;
// [EOF]: ./utils/formatValue.js
;

// [06:20:07] LOAD: ./utils/formatDate.js
// [06:20:07] LOAD: ./helpers/date/parse-date.js
/**
 * Парсит дату и проверяет валидность
 * @param {string|Date} dateInput - Дата для парсинга
 * @returns {Object} Объект с полями date и isValid
 */
function parseDate(dateInput) {
    if (!dateInput) {
        return { date: null, isValid: false };
    }

    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    const isValid = !isNaN(date.getTime());
    
    return { date, isValid };
}
// [EOF]: ./helpers/date/parse-date.js
;

// [06:20:07] LOAD: ./helpers/date/convert-time.js
/**
 * Конвертирует дату в московское время (UTC+3)
 * @param {Date} date - Исходная дата
 * @returns {Date} Дата в московском времени
 */
function convertToMoscowTime(date) {
    const MOSCOW_TIME_OFFSET_MS = 3 * 60 * 60 * 1000;
    return new Date(date.getTime() + MOSCOW_TIME_OFFSET_MS);
}
// [EOF]: ./helpers/date/convert-time.js
;

// [06:20:07] LOAD: ./helpers/date/localization.js
/**
 * Возвращает русские названия месяцев и дней недели
 * @returns {Object} Локализованные строки
 */
function getLocalizedStrings() {
    return {
        months: {
            short: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
            full: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
        },
        days: {
            short: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
            full: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
        },
        ampm: {
            am: 'AM',
            pm: 'PM'
        }
    };
}
// [EOF]: ./helpers/date/localization.js
;

// [06:20:07] LOAD: ./helpers/date/apply-format.js
/**
 * Применяет формат к дате
 * @param {Date} date - Дата для форматирования
 * @param {string} format - Формат вывода
 * @param {Object} loc - Локализованные строки
 * @returns {string} Отформатированная строка
 */
function applyFormat(date, format, loc) {
    const utcDate = date.getUTCDate();
    const utcMonth = date.getUTCMonth();
    const utcYear = date.getUTCFullYear();
    const utcDay = date.getUTCDay();
    const utcHours = date.getUTCHours();
    const utcMinutes = date.getUTCMinutes();
    const utcSeconds = date.getUTCSeconds();
    
    // Определяем AM/PM
    const isPM = utcHours >= 12;
    const hours12 = utcHours % 12 || 12;
    
    // Подготавливаем значения для замены
    const values = {
        // День месяца (1-31)
        'dd': utcDate.toString().padStart(2, '0'),
        'd': utcDate.toString(),
        
        // День недели
        'dddd': loc.days.full[utcDay],
        'ddd': loc.days.short[utcDay],
        
        // Месяц (1-12)
        'mm': (utcMonth + 1).toString().padStart(2, '0'),
        'm': (utcMonth + 1).toString(),
        'mmmm': loc.months.full[utcMonth],
        'mmm': loc.months.short[utcMonth],
        
        // Год
        'yyyy': utcYear.toString(),
        'yy': utcYear.toString().slice(-2),
        
        // Часы (24-часовой формат)
        'HH': utcHours.toString().padStart(2, '0'),
        'H': utcHours.toString(),
        
        // Часы (12-часовой формат)
        'hh': hours12.toString().padStart(2, '0'),
        'h': hours12.toString(),
        
        // Минуты
        'MM': utcMinutes.toString().padStart(2, '0'),
        'M': utcMinutes.toString(),
        
        // Секунды
        'SS': utcSeconds.toString().padStart(2, '0'),
        'S': utcSeconds.toString(),
        
        // AM/PM
        'tt': isPM ? loc.ampm.pm : loc.ampm.am,
        't': isPM ? 'p' : 'a',
    };

    // Сначала обрабатываем специальные форматы
    let result = format;
    
    // Обрабатываем экранирование (сохраняем экранированные символы)
    const escaped = {};
    result = result.replace(/\\([dmytHhMS])/g, (match, char) => {
        const key = `__ESC${Date.now()}${Math.random()}__`;
        escaped[key] = char;
        return key;
    });
    
    // Заменяем специальные токены
    result = result.replace(/\{date\}/g, `${values.dd}.${values.mm}.${values.yyyy}`);
    result = result.replace(/\{time:s\}/g, `${values.HH}:${values.MM}:${values.SS}`);
    result = result.replace(/\{time\}/g, `${values.HH}:${values.MM}`);
    
    // Заменяем обычные токены (в порядке от длинных к коротким)
    const tokens = ['dddd', 'ddd', 'dd', 'd', 'mmmm', 'mmm', 'mm', 'm', 
                   'yyyy', 'yy', 'HH', 'H', 'hh', 'h', 'MM', 'M', 'SS', 'S', 'tt', 't'];
    
    for (const token of tokens) {
        result = result.replace(new RegExp(token, 'g'), values[token]);
    }
    
    // Восстанавливаем экранированные символы
    for (const [key, char] of Object.entries(escaped)) {
        result = result.replace(new RegExp(key, 'g'), char);
    }
    
    return result;
}
// [EOF]: ./helpers/date/apply-format.js
;

/**
 * Утилиты для форматирования дат с учетом московского времени (UTC+3)
 */
const FormatDate = {
    /**
     * Форматирует дату/время в указанный формат
     * @param {string|Date} dateString - Дата для форматирования
     * @param {string} format - Формат вывода (по умолчанию 'dd.mm.yyyy'):
     *   - d, dd: день месяца (1-2 цифры)
     *   - ddd, dddd: день недели (сокращенно/полностью)
     *   - m, mm: месяц (1-2 цифры)
     *   - mmm, mmmm: месяц (сокращенно/полностью)
     *   - yy, yyyy: год (2/4 цифры)
     *   - H, HH: часы (0-23, 1-2 цифры)
     *   - h, hh: часы в 12-часовом формате (1-2 цифры)
     *   - M, MM: минуты (1-2 цифры)
     *   - S, SS: секунды (1-2 цифры)
     *   - t, tt: AM/PM
     * @returns {string} Отформатированная дата/время или строка-заглушка
     */
    fdate(dateString, format = 'dd.mm.yyyy') {
        const { date, isValid } = parseDate(dateString);
        if (!isValid) {
            if (!dateString) return '-';
            return 'Неверная дата';
        }
        
        const mskDate = convertToMoscowTime(date);
        const localizedStrings = getLocalizedStrings();
        
        return applyFormat(mskDate, format, localizedStrings);
    }
};

;
// [EOF]: ./utils/formatDate.js
;

// [06:20:07] LOAD: ./components/log/Logger.js
// [06:20:07] LOAD: ./LoggerStyle.js
const LoggerStyles = {
    API_REQUEST: 'background: #0057ff; color: white; padding: 2px 6px; border-radius: 3px',
    API_REQUEST_TEXT: 'color: #0057ff',
    
    SUCCESS: 'background: #4caf50; color: white; padding: 2px 6px; border-radius: 3px',
    SUCCESS_TEXT: 'color: #4caf50',
    
    ERROR: 'background: #f44336; color: white; padding: 2px 6px; border-radius: 3px',
    ERROR_TEXT: 'color: #f44336',
    
    WARNING: 'background: #ff9800; color: white; padding: 2px 6px; border-radius: 3px',
    WARNING_TEXT: 'color: #ff9800',
    
    INFO: 'background: #2196f3; color: white; padding: 2px 6px; border-radius: 3px',
    INFO_TEXT: 'color: #2196f3',
    
    // Дополнительные стили для разных типов сообщений
    getStyleForStatus: (status) => {
        switch(status.toLowerCase()) {
            case 'success':
                return {
                    badge: LoggerStyles.SUCCESS,
                    text: LoggerStyles.SUCCESS_TEXT
                };
            case 'error':
                return {
                    badge: LoggerStyles.ERROR,
                    text: LoggerStyles.ERROR_TEXT
                };
            case 'warning':
                return {
                    badge: LoggerStyles.WARNING,
                    text: LoggerStyles.WARNING_TEXT
                };
            case 'info':
                return {
                    badge: LoggerStyles.INFO,
                    text: LoggerStyles.INFO_TEXT
                };
            case 'debug':
                return {
                    badge: 'background: #9c27b0; color: white; padding: 2px 6px; border-radius: 3px',
                    text: 'color: #9c27b0'
                };
            default:
                return {
                    badge: LoggerStyles.INFO,
                    text: LoggerStyles.INFO_TEXT
                };
        }
    }
};
// [EOF]: ./LoggerStyle.js
;

const Logger = {
    /**
     * Логирование API запросов
     * @param {string} url - URL запроса
     * @param {string} method - HTTP метод
     * @param {Object} data - Данные для отправки
     * @param {Object} options - Дополнительные опции
     * @returns {Promise} - Promise с результатом запроса
     */
    async api(url, method = 'GET', data = null, options = {}) {
        const timestamp = new Date().toISOString();
        const requestId = `req_${Math.random().toString(36).substr(2, 9)}`;
        
        // Логирование запроса
        console.groupCollapsed(
            `%cAPI ${method}%c ${url}`,
            LoggerStyles.API_REQUEST,
            LoggerStyles.API_REQUEST_TEXT
        );
        
        console.log('Request ID:', requestId);
        console.log('Timestamp:', timestamp);
        console.log('Method:', method);
        console.log('URL:', url);
        
        if (data && Object.keys(data).length > 0) {
            console.log('Request Data:', data);
        }
        
        if (options.headers) {
            console.log('Headers:', options.headers);
        }
        
        console.groupEnd();
        
        // Выполнение запроса
        return fetch(url, {
            method,
            body: data ? JSON.stringify(data) : undefined,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        })
        .then(async response => {
            const isJson = response.headers.get('content-type')?.includes('application/json');
            const result = isJson ? await response.json() : await response.text();
            
            // Определяем статус ответа
            const status = response.ok ? 'SUCCESS' : 'ERROR';
            const styles = LoggerStyles.getStyleForStatus(status);
            
            // Логирование ответа
            console.groupCollapsed(
                `%cAPI ${status}%c ${url}`,
                styles.badge,
                styles.text
            );
            
            console.log('Response ID:', requestId);
            console.log('Status:', `${response.status} ${response.statusText}`);
            console.log('Response Time:', `${Date.now() - new Date(timestamp).getTime()}ms`);
            console.log('Response Type:', isJson ? 'JSON' : 'TEXT');
            
            if (isJson && result) {
                console.log('Response Data:', result);
            } else if (result) {
                console.log('Response Text:', result);
            }
            
            console.groupEnd();
            
            if (!response.ok) {
                throw {
                    status: response.status,
                    statusText: response.statusText,
                    data: result,
                    url,
                    method,
                    requestId
                };
            }
            
            return {
                data: result,
                status: response.status,
                headers: response.headers,
                requestId
            };
        })
        .catch(error => {
            const styles = LoggerStyles.getStyleForStatus('ERROR');
            
            console.groupCollapsed(
                `%cAPI ERROR%c ${url}`,
                styles.badge,
                styles.text
            );
            
            console.log('Response ID:', requestId);
            console.log('Status:', error.status || 'NETWORK_ERROR');
            console.log('Total Time:', `${Date.now() - new Date(timestamp).getTime()}ms`);
            console.log('Error Details:', error);
            
            if (error.data) {
                console.log('Error Data:', error.data);
            }
            
            console.groupEnd();
            
            throw {
                ...error,
                requestId,
                timestamp
            };
        });
    },
    
    /**
     * Утилитарные методы для логирования
     */
    log: {
        success(message, ...args) {
            const styles = LoggerStyles.getStyleForStatus('SUCCESS');
            if (typeof message === 'string') {
                console.log(`%cSUCCESS%c ${message}`, styles.badge, styles.text, ...args);
            } else {
                // Если передан объект или массив, сначала выводим заголовок, потом данные
                console.log('%cSUCCESS', styles.badge, message, ...args);
            }
        },
        
        error(message, ...args) {
            const styles = LoggerStyles.getStyleForStatus('ERROR');
            if (typeof message === 'string') {
                console.log(`%cERROR%c ${message}`, styles.badge, styles.text, ...args);
            } else {
                console.log('%cERROR', styles.badge, message, ...args);
            }
        },
        
        info(message, ...args) {
            const styles = LoggerStyles.getStyleForStatus('INFO');
            if (typeof message === 'string') {
                console.log(`%cINFO%c ${message}`, styles.badge, styles.text, ...args);
            } else {
                console.log('%cINFO', styles.badge, message, ...args);
            }
        },
        
        warn(message, ...args) {
            const styles = LoggerStyles.getStyleForStatus('WARNING');
            if (typeof message === 'string') {
                console.log(`%cWARNING%c ${message}`, styles.badge, styles.text, ...args);
            } else {
                console.log('%cWARNING', styles.badge, message, ...args);
            }
        },
        
        debug(message, ...args) {
            const styles = LoggerStyles.getStyleForStatus('DEBUG');
            if (typeof message === 'string') {
                console.log(`%cDEBUG%c ${message}`, styles.badge, styles.text, ...args);
            } else {
                console.log('%cDEBUG', styles.badge, message, ...args);
            }
        },
        
        // Дополнительный метод для красивого вывода объектов/массивов
        object(title, obj, type = 'INFO') {
            const styles = LoggerStyles.getStyleForStatus(type);
            console.groupCollapsed(`%c${type}%c ${title}`, styles.badge, styles.text);
            console.log(obj);
            console.groupEnd();
        }
    }
};

;
// [EOF]: ./components/log/Logger.js
;

// [06:20:07] LOAD: ./utils/filterText.js
/**
 * Форматирует дату/время в указанный формат
 * @param {string|Date} dateString - Дата для форматирования
 * @param {string} format - Формат вывода (по умолчанию 'dd.mm.yyyy'):
 *   - d, dd: день месяца (1-2 цифры)
 *   - ddd, dddd: день недели (сокращенно/полностью)
 *   - m, mm: месяц (1-2 цифры)
 *   - mmm, mmmm: месяц (сокращенно/полностью)
 *   - yy, yyyy: год (2/4 цифры)
 *   - H, HH: часы (0-23, 1-2 цифры)
 *   - h, hh: часы в 12-часовом формате (1-2 цифры)
 *   - M, MM: минуты (1-2 цифры)
 *   - S, SS: секунды (1-2 цифры)
 *   - t, tt: AM/PM
 * @returns {string} Отформатированная дата/время или строка-заглушка
 */

function FilterReplaceText(time,text,id) {
    setTimeout(() => {
            const container = document.getElementById(id)
            const textElement = container.querySelector('.rb-filter-header-text')
            const textContent = textElement.textContent
            
            if(textContent === 'Все'){
                textElement.textContent = text
            }
    }, time)
}
// [EOF]: ./utils/filterText.js
;

// [06:20:07] LOAD: ./utils/genId.js
function genId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
// [EOF]: ./utils/genId.js
;

// [06:20:07] LOAD: ./components/slider/index.js
// [06:20:07] LOAD: ./Slider.js
// [06:20:07] SKIP (already loaded): ../../utils/genId.js
;

const EASE = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
const SVG_PREV = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
const SVG_NEXT = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
const SVG_CLOSE = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';

/**
 * Рендер слайдера в контейнер.
 * @param {string|HTMLElement} container - id элемента или сам DOM-элемент
 * @param {string[]} imageUrls - массив URL изображений или base64 строк
 * @param {{ ease?: string, isB64?: boolean }} [options] - опции (ease для анимации, isB64 для base64)
 */
function renderSlider(container, imageUrls, options = {}) {
    const dataset = Array.isArray(imageUrls) ? imageUrls : [];
    const ease = options.ease || EASE;
    const isB64 = options.isB64 || false;
    const sldID = genId();

    const el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) return;

    const html = buildSliderHTML(sldID, dataset, ease, isB64);
    el.innerHTML = html;
    initSlider(sldID, dataset, ease, isB64);
}

function buildSliderHTML(sldID, dataset, ease, isB64) {
    let slides = '';
    if (dataset.length > 0) {
        slides += `<div class="slide"><img src="${dataset[dataset.length - 1]}" alt=""></div>`;
    } else if(dataset.length === 0){
        return `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:white;font-size:24px;font-weight:bold;">Нет данных</div>`
    }
    dataset.forEach((img, i) => {
        const imgClass = isB64 ? 'sld-img sld-b64' : 'sld-img';
        slides += `<div class="slide"><img src="${img}" alt="slide ${i + 1}" class="${imgClass}" data-src="${img}"></div>`;
    });
    if (dataset.length > 0) {
        slides += `<div class="slide"><img src="${dataset[0]}" alt=""></div>`;
    }
    return `
    <div id="sld-${sldID}" class="prxz-slider">
        <button class="sld-btn prev" type="button" aria-label="Назад">${SVG_PREV}</button>
        <div class="sld-track">${slides}</div>
        <button class="sld-btn next" type="button" aria-label="Вперёд">${SVG_NEXT}</button>
        <div class="sld-dots"></div>
    </div>
    <style>${sliderStyle(sldID, ease, isB64)}</style>`;
}

function sliderStyle(id, ease, isB64) {
    const s = `#sld-${id}`;
    const b64Styles = isB64 ? `
${s} .slide img.sld-b64{image-rendering:pixelated;image-rendering:-moz-crisp-edges;image-rendering:crisp-edges;object-fit:contain;background:#0a0a0c}` : '';
    
    return `
${s}{--sld-radius:16px;--sld-edge:rgba(255,255,255,.10);--sld-shadow:0 18px 60px rgba(0,0,0,.20);--sld-shadow2:0 10px 30px rgba(0,0,0,.16);--sld-ui-bg:rgba(18,18,20,.55);--sld-ui-bg2:rgba(255,255,255,.10);--sld-ui-stroke:rgba(255,255,255,.16);--sld-ui-text:#fff;--sld-ease:${ease};position:relative;width:100%;height:100%;overflow:hidden;border-radius:var(--sld-radius);background:radial-gradient(120% 120% at 10% 0%, rgba(255,255,255,.08), transparent 60%),linear-gradient(180deg, rgba(10,10,12,1), rgba(10,10,12,1));box-shadow:var(--sld-shadow);isolation:isolate}
${s}:before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(120% 90% at 50% 10%, rgba(0,0,0,.10), transparent 55%),linear-gradient(180deg, rgba(0,0,0,.10), rgba(0,0,0,.35));mix-blend-mode:multiply;opacity:.85;z-index:2}
${s}:after{content:"";position:absolute;inset:-1px;pointer-events:none;border-radius:calc(var(--sld-radius) + 1px);border:1px solid var(--sld-edge);opacity:.9;z-index:3}
${s} .sld-track{display:flex;transition:transform .7s var(--sld-ease);height:100%;flex-shrink:0;will-change:transform;position:relative;z-index:1}
${s} .slide{flex-shrink:0;min-width:0;height:100%;display:flex;align-items:stretch;justify-content:stretch;padding:0;box-sizing:border-box;background:#0a0a0c}
${s} .slide img{width:100%;height:100%;object-fit:cover;display:block;transform:translateZ(0)}
${s} .slide img.sld-img{cursor:pointer;transition:transform .45s var(--sld-ease),filter .45s var(--sld-ease);filter:saturate(1.02) contrast(1.02)}
${s} .slide img.sld-img:active{transform:scale(.99)}
${b64Styles}

${s} .sld-btn{position:absolute;top:50%;transform:translateY(-50%);border:none;cursor:pointer;padding:0;z-index:10;border-radius:999px;width:46px;height:46px;display:flex;align-items:center;justify-content:center;color:var(--sld-ui-text);background:linear-gradient(180deg, rgba(255,255,255,.16), rgba(255,255,255,.08));box-shadow:0 10px 28px rgba(0,0,0,.35);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);outline:none;transition:transform .2s ease,background .2s ease,box-shadow .2s ease,opacity .2s ease}
${s} .sld-btn svg{display:block;opacity:.95}
${s} .sld-btn:hover{transform:translateY(-50%) scale(1.06);background:linear-gradient(180deg, rgba(255,255,255,.22), rgba(255,255,255,.10));box-shadow:0 14px 36px rgba(0,0,0,.45)}
${s} .sld-btn:active{transform:translateY(-50%) scale(.98)}
${s} .sld-btn:focus-visible{box-shadow:0 0 0 3px rgba(255,255,255,.26),0 14px 36px rgba(0,0,0,.45)}
${s} .sld-btn.prev{left:14px}
${s} .sld-btn.next{right:14px}

${s} .sld-dots{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:10;padding:8px 10px;border-radius:999px;background:rgba(10,10,12,.18);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.10)}
${s} .dot{width:8px;height:8px;border-radius:999px;background:rgba(255,255,255,.42);cursor:pointer;transition:transform .25s ease,background .25s ease,width .25s ease,opacity .25s ease;opacity:.9}
${s} .dot:hover{background:rgba(255,255,255,.78);transform:scale(1.12)}
${s} .dot.active{width:22px;background:rgba(255,255,255,.92);opacity:1;box-shadow:0 8px 18px rgba(0,0,0,.28)}

@media (prefers-reduced-motion: reduce){
  ${s} .sld-track{transition:none!important}
  ${s} .slide img.sld-img{transition:none!important}
  ${s} .sld-btn{transition:none!important}
  ${s} .dot{transition:none!important}
}

.sld-fs-modal{position:fixed;inset:0;z-index:9999;background:radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,.06), transparent 55%),rgba(0,0,0,.88);overflow:hidden;opacity:0;visibility:hidden;transition:opacity .28s ease,visibility .28s ease;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.sld-fs-modal.is-open{opacity:1;visibility:visible}
.sld-fs-modal:before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(90% 70% at 50% 15%, rgba(0,0,0,.12), transparent 55%),linear-gradient(180deg, rgba(0,0,0,.12), rgba(0,0,0,.35));opacity:.9}
.sld-fs-modal .sld-track{position:absolute;inset:0;display:flex;transition:transform .7s ${ease};height:100%;will-change:transform}
.sld-fs-modal .slide{flex-shrink:0;min-width:0;height:100%;display:flex;align-items:stretch;justify-content:stretch;background:#0a0a0c}
.sld-fs-modal .slide img{width:100%;height:100%;object-fit:contain;display:block}
.sld-fs-modal .slide img.sld-b64{image-rendering:pixelated;image-rendering:-moz-crisp-edges;image-rendering:crisp-edges}
.sld-fs-modal .sld-btn{position:absolute;top:50%;transform:translateY(-50%);border:none;cursor:pointer;padding:0;z-index:10;border-radius:999px;width:52px;height:52px;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg, rgba(255,255,255,.16), rgba(255,255,255,.08));color:#fff;box-shadow:0 16px 40px rgba(0,0,0,.45);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);transition:transform .2s ease,background .2s ease,box-shadow .2s ease}
.sld-fs-modal .sld-btn:hover{background:linear-gradient(180deg, rgba(255,255,255,.22), rgba(255,255,255,.10));transform:translateY(-50%) scale(1.06);box-shadow:0 18px 44px rgba(0,0,0,.52)}
.sld-fs-modal .sld-btn:active{transform:translateY(-50%) scale(.98)}
.sld-fs-modal .sld-btn:focus-visible{box-shadow:0 0 0 3px rgba(255,255,255,.24),0 18px 44px rgba(0,0,0,.52)}
.sld-fs-modal .sld-btn.prev{left:18px}
.sld-fs-modal .sld-btn.next{right:18px}
.sld-fs-modal .sld-dots{position:absolute;bottom:18px;left:50%;transform:translateX(-50%);display:flex;gap:9px;z-index:10;padding:9px 12px;border-radius:999px;background:rgba(10,10,12,.22);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.12)}
.sld-fs-modal .dot{width:8px;height:8px;border-radius:999px;background:rgba(255,255,255,.38);cursor:pointer;transition:transform .25s ease,background .25s ease,width .25s ease,opacity .25s ease;opacity:.85}
.sld-fs-modal .dot:hover{background:rgba(255,255,255,.75);transform:scale(1.12)}
.sld-fs-modal .dot.active{width:24px;background:rgba(255,255,255,.92);opacity:1;box-shadow:0 12px 26px rgba(0,0,0,.35)}
.sld-fs-modal .sld-fs-close{position:absolute;top:16px;right:16px;width:44px;height:44px;border:none;background:linear-gradient(180deg, rgba(255,255,255,.16), rgba(255,255,255,.08));color:#ff4d4f;cursor:pointer;border-radius:50%;z-index:10;display:flex;align-items:center;justify-content:center;box-shadow:0 14px 34px rgba(0,0,0,.42);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);transition:background .2s ease,transform .2s ease,box-shadow .2s ease}
.sld-fs-modal .sld-fs-close svg{display:block;opacity:.95}
.sld-fs-modal .sld-fs-close:hover{background:linear-gradient(180deg, rgba(255,255,255,.22), rgba(255,255,255,.10));transform:scale(1.06);box-shadow:0 16px 40px rgba(0,0,0,.5)}
.sld-fs-modal .sld-fs-close:active{transform:scale(.98)}

@media (prefers-reduced-motion: reduce){
  .sld-fs-modal,.sld-fs-modal .sld-track{transition:none!important}
  .sld-fs-modal .sld-btn,.sld-fs-modal .dot,.sld-fs-modal .sld-fs-close{transition:none!important}
}`;
}

function initSlider(sldID, dataset, ease, isB64) {
    const container = document.querySelector(`#sld-${sldID}`);
    if (!container) return;
    const track = container.querySelector('.sld-track');
    const slides = container.querySelectorAll('.slide');
    const prevBtn = container.querySelector('.prev');
    const nextBtn = container.querySelector('.next');
    const dotsContainer = container.querySelector('.sld-dots');
    const slideCount = dataset.length;
    let currentIndex = 1;
    const t = `transform .6s ${ease}`;

    for (let i = 0; i < slideCount; i++) {
        const dot = document.createElement('span');
        dot.className = 'dot';
        dot.dataset.index = i;
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
    }
    const dots = container.querySelectorAll('.dot');

    const totalSlides = slides.length;
    function getSlideWidth() {
        return container.clientWidth || (slides[0] && slides[0].offsetWidth) || 0;
    }
    function updateSlider() {
        if (!totalSlides) return;
        const w = getSlideWidth();
        if (w <= 0) return;
        slides.forEach(s => { s.style.flex = '0 0 ' + w + 'px'; s.style.width = w + 'px'; });
        track.style.transform = `translateX(-${currentIndex * w}px)`;
        const ai = currentIndex - 1;
        if (ai >= 0 && ai < slideCount) dots.forEach((d, i) => d.classList.toggle('active', i === ai));
    }
    track.style.transition = 'none';
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            updateSlider();
            track.style.transition = t;
        });
    });
    function goToSlide(index) {
        if (index < 0 || index >= slideCount) return;
        currentIndex = index + 1;
        updateSlider();
    }

    function nextSlide() {
        if (currentIndex >= slides.length - 1) return;
        currentIndex++;
        updateSlider();
        if (currentIndex === slides.length - 1) {
            setTimeout(() => {
                track.style.transition = 'none';
                currentIndex = 1;
                updateSlider();
                setTimeout(() => { track.style.transition = t; }, 50);
            }, 600);
        }
    }
    function prevSlide() {
        if (currentIndex <= 0) return;
        currentIndex--;
        updateSlider();
        if (currentIndex === 0) {
            setTimeout(() => {
                track.style.transition = 'none';
                currentIndex = slides.length - 2;
                updateSlider();
                setTimeout(() => { track.style.transition = t; }, 50);
            }, 600);
        }
    }

    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);
    window.addEventListener('resize', updateSlider);

    function openFS(startRealIndex) {
        const total = dataset.length;
        if (!total) return;
        const modal = document.createElement('div');
        modal.className = 'sld-fs-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', 'Просмотр');

        let fsSlides = '';
        fsSlides += `<div class="slide"><img src="${dataset[total - 1]}" alt=""></div>`;
        dataset.forEach((img) => { 
            const imgClass = isB64 ? 'sld-b64' : '';
            fsSlides += `<div class="slide"><img src="${img}" alt="" class="${imgClass}"></div>`; 
        });
        fsSlides += `<div class="slide"><img src="${dataset[0]}" alt=""></div>`;

        modal.innerHTML = `
            <button class="sld-fs-close" type="button" aria-label="Закрыть">${SVG_CLOSE}</button>
            <button class="sld-btn prev" type="button" aria-label="Назад">${SVG_PREV}</button>
            <div class="sld-track">${fsSlides}</div>
            <button class="sld-btn next" type="button" aria-label="Вперёд">${SVG_NEXT}</button>
            <div class="sld-dots"></div>
        `;

        const fsTrack = modal.querySelector('.sld-track');
        const fsSlideEls = modal.querySelectorAll('.slide');
        const fsPrev = modal.querySelector('.prev');
        const fsNext = modal.querySelector('.next');
        const fsDotsWrap = modal.querySelector('.sld-dots');
        const fsClose = modal.querySelector('.sld-fs-close');
        let fsIndex = Math.max(0, Math.min(total - 1, startRealIndex)) + 1;
        const fsT = `transform .6s ${ease}`;

        for (let i = 0; i < total; i++) {
            const dot = document.createElement('span');
            dot.className = 'dot';
            dot.dataset.index = i;
            dot.addEventListener('click', () => goToFS(i));
            fsDotsWrap.appendChild(dot);
        }
        const fsDots = fsDotsWrap.querySelectorAll('.dot');

        function getFSW() { return modal.clientWidth || (fsSlideEls[0] && fsSlideEls[0].offsetWidth) || 0; }
        function updateFS() {
            const w = getFSW();
            if (w <= 0) return;
            fsSlideEls.forEach(s => { s.style.flex = '0 0 ' + w + 'px'; s.style.width = w + 'px'; });
            fsTrack.style.transform = `translateX(-${fsIndex * w}px)`;
            const ai = fsIndex - 1;
            if (ai >= 0 && ai < total) fsDots.forEach((d, i) => d.classList.toggle('active', i === ai));
        }
        function goToFS(i) { fsIndex = i + 1; updateFS(); }
        function nextFS() {
            if (fsIndex >= fsSlideEls.length - 1) return;
            fsIndex++; updateFS();
            if (fsIndex === fsSlideEls.length - 1) {
                setTimeout(() => {
                    fsTrack.style.transition = 'none';
                    fsIndex = 1;
                    updateFS();
                    setTimeout(() => { fsTrack.style.transition = fsT; }, 50);
                }, 600);
            }
        }
        function prevFS() {
            if (fsIndex <= 0) return;
            fsIndex--; updateFS();
            if (fsIndex === 0) {
                setTimeout(() => {
                    fsTrack.style.transition = 'none';
                    fsIndex = fsSlideEls.length - 2;
                    updateFS();
                    setTimeout(() => { fsTrack.style.transition = fsT; }, 50);
                }, 600);
            }
        }

        function closeFSModal() {
            if (!modal._closeFS) return;
            modal._closeFS = null;
            modal.classList.remove('is-open');
            setTimeout(() => {
                if (modal.parentNode) modal.remove();
                document.body.style.overflow = '';
            }, 300);
        }

        fsClose.addEventListener('click', closeFSModal);
        modal.addEventListener('click', e => { if (e.target === modal) closeFSModal(); });
        fsPrev.addEventListener('click', prevFS);
        fsNext.addEventListener('click', nextFS);
        window.addEventListener('resize', updateFS);

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        fsTrack.style.transition = 'none';
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                updateFS();
                fsTrack.style.transition = fsT;
                modal.classList.add('is-open');
            });
        });

        modal._closeFS = closeFSModal;
    }

    document.addEventListener('keydown', e => {
        const modal = document.querySelector('.sld-fs-modal.is-open');
        if (modal && modal._closeFS) {
            if (e.key === 'Escape') return modal._closeFS();
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') return;
        }
        if (e.key === 'ArrowLeft') prevSlide();
        else if (e.key === 'ArrowRight') nextSlide();
    });
    container.querySelectorAll('.slide img.sld-img').forEach(img => {
        img.addEventListener('click', e => {
            e.stopPropagation();
            const idx = currentIndex - 1;
            openFS(idx);
        });
    });
}
// [EOF]: ./Slider.js
;
// [EOF]: ./components/slider/index.js
;

// [06:20:07] LOAD: ./components/table/index.js
// [06:20:07] LOAD: ./Table.js
// [06:20:07] SKIP (already loaded): ../../utils/genId.js
;
// [06:20:07] SKIP (already loaded): ../../utils/formatValue.js
;
// [06:20:07] SKIP (already loaded): ../../utils/formatDate.js
;

const DEFAULT_MIN_COL_WIDTH = 'auto';

/** Стили по умолчанию для таблицы (шрифт, цвет), если не заданы в widgetStyle. */
const DEFAULT_TABLE_FONT = {
    fontFamily: 'Open Sans',
    fontSize: '14px',
    color: '#333333',
    fontStyle: 'normal',
    fontWeight: 'normal',
    lineHeight: 1.5,
    textAlign: 'left',
};

/**
 * Преобразует объект стилей виджета (w.style: align, color, fontFamily, fontSize, …) в формат для styleTable/styleTh/styleTd.
 * @param {Object} w - { align?, color?, fontFamily?, fontSize?, fontStyle?, fontWeight?, lineHeight?, textOutline? }
 * @returns {Object}
 */
function widgetStyleToTableStyle(w) {
    if (!w || typeof w !== 'object') return {};
    const m = {};
    if (w.align != null && w.align !== '') m.textAlign = w.align;
    if (w.color != null && w.color !== '') m.color = w.color;
    if (w.fontFamily != null && w.fontFamily !== '') m.fontFamily = w.fontFamily;
    if (w.fontSize != null && w.fontSize !== '') m.fontSize = w.fontSize;
    if (w.fontStyle != null && w.fontStyle !== '') m.fontStyle = w.fontStyle;
    if (w.fontWeight != null && w.fontWeight !== '') m.fontWeight = w.fontWeight;
    if (w.lineHeight != null && w.lineHeight !== '') m.lineHeight = String(w.lineHeight);
    if (w.textOutline != null && w.textOutline !== 0 && w.textOutline !== '0') {
        m.webkitTextStroke = `${w.textOutline}px`;
    }
    return m;
}

const DEFAULT_CONFIG = {
    container: null,
    dataset: [],
    columns: [],
    columnWidths: null,
    columnFormatters: null,
    stickyHeader: true,
    borderCollapse: 'collapse',
    borderSpacing: '0',
    isScrolling: false,
    /** Количество столбцов, закреплённых слева (как в Excel). Остальные прокручиваются по горизонтали. 0 — отключено. */
    pinnedColumns: 0,
    /** При включённой прокрутке (pinnedColumns > 0): true — применять rowStyle только к ячейкам в области скролла; false — ко всей строке. */
    rowColorPinnedOnly: false,
    onRowClick: null,
    onCellClick: null,
    /** Удобное условное форматирование: классы / стили для строк и ячеек. */
    rowClassName: null,   // (row, rowIndex) => string | string[]
    rowStyle: null,       // (row, rowIndex) => Object
    cellClassName: null,  // (row, colKey, value, rowIndex) => string | string[]
    cellStyle: null,      // (row, colKey, value, rowIndex) => Object
    /** Управление hover-эффектом для кликабельных строк. true — подсветка при наведении, false — без подсветки. */
    hoverRows: true,
    classPrefix: 'prxz-tbl',
    style: {},
    styleTable: {},
    styleTh: {},
    styleTd: {},
    /** Макс. число строк в заголовке (по умолчанию 2). Число > 0 — обрезка с ellipsis; 0 / null / 'unlimited' — без ограничения. */
    headerLines: 2,
    /** Чередование цвета строк (чётные/нечётные). true — включено, false — отключено. */
    stripedRows: true,
    /** Список колонок, которые не показывать (массив ключей). */
    hiddenColumns: null,
    /** Явный список видимых колонок (массив ключей). Если задан — отображаются только они; иначе учитывается hiddenColumns. */
    visibleColumns: null,
    /** Стили из виджета (w.style): align, color, fontFamily, fontSize, fontStyle, fontWeight, lineHeight, textOutline. Подставляются в таблицу/ячейки; отсутствующие берутся из дефолтов библиотеки. */
    widgetStyle: null,
    /** Сортировка по умолчанию: ключ колонки (key). Если не задан — данные не сортируются. */
    sortBy: null,
    /** Направление сортировки по умолчанию: 'asc' | 'desc'. */
    sortOrder: 'asc',
    /** Виртуализация (ленивая загрузка строк): рендерятся только видимые строки. true — включить при любом числе строк; число — порог (включить при dataset.length >= N). */
    virtualized: false,
    /** Высота одной строки в px для виртуализации (нужна для расчёта скролла). */
    virtualizedRowHeight: 44,
    /** Сколько строк сверху/снизу от видимой области догружать (overscan) для плавности. */
    virtualizedOverscan: 8,
    /** Порог: включать виртуализацию автоматически при числе строк >= этого значения (если virtualized === true или не задан). */
    virtualizedThreshold: 100,
};

/**
 * Нормализует «интуитивный» конфиг в плоский внутренний формат.
 * Группы: target/data, columns (key -> { width }), style, on (rowClick, cellClick), scroll.
 * Старый плоский вызов (container, dataset, columnWidths, onRowClick...) по-прежнему поддерживается.
 * @param {Object} raw - входящий конфиг (группированный или плоский)
 * @returns {Object} плоский конфиг для renderTable
 */
function normalizeIntuitiveConfig(raw) {
    if (!raw || typeof raw !== 'object') return { ...DEFAULT_CONFIG };

    const flat = { ...DEFAULT_CONFIG, ...raw };

    // target / container
    if (raw.target !== undefined) flat.container = raw.target;
    // data / dataset
    if (raw.data !== undefined) flat.dataset = raw.data;

    // columns: { 'Колонка': { width: '10%', format, visible } } — только ширины/опции, список колонок из data
    if (raw.columns && typeof raw.columns === 'object' && !Array.isArray(raw.columns)) {
        const columnWidths = {};
        const columnFormatters = {};
        const hiddenColumns = [];
        for (const [key, opts] of Object.entries(raw.columns)) {
            const w = opts && (typeof opts === 'string' ? opts : (opts.width ?? opts.w));
            if (w != null) columnWidths[key] = w;

            const fmt = opts && typeof opts === 'object'
                ? (opts.format ?? opts.formatter ?? opts.fmt ?? opts.valueFormatter ?? opts.render)
                : null;
            if (fmt != null) columnFormatters[key] = fmt;
            if (opts && typeof opts === 'object' && opts.visible === false) hiddenColumns.push(key);
        }
        if (Object.keys(columnWidths).length) flat.columnWidths = { ...flat.columnWidths, ...columnWidths };
        if (Object.keys(columnFormatters).length) flat.columnFormatters = { ...flat.columnFormatters, ...columnFormatters };
        if (hiddenColumns.length && !flat.hiddenColumns?.length) flat.hiddenColumns = [...(flat.hiddenColumns || []), ...hiddenColumns];
    }

    // style: border, borderRadius, th, td, style; th/td: whiteSpace, borderRadius, wordBreak, и др.
    if (raw.style && typeof raw.style === 'object') {
        const a = raw.style;
        if (a.border) {
            if (a.border.collapse != null) flat.borderCollapse = a.border.collapse;
            if (a.border.spacing != null) flat.borderSpacing = a.border.spacing;
        }
        if (a.borderRadius != null) {
            flat.style = { ...flat.style, borderRadius: a.borderRadius };
        }
        if (a.table && typeof a.table === 'object') {
            flat.styleTable = { ...flat.styleTable, ...a.table };
        }
        if (a.th && typeof a.th === 'object') {
            flat.styleTh = { ...flat.styleTh, ...a.th };
            if (a.th.headerLines !== undefined) flat.headerLines = a.th.headerLines;
        }
        if (a.headerLines !== undefined) flat.headerLines = a.headerLines;
        if (a.stripedRows !== undefined) flat.stripedRows = !!a.stripedRows;
        if (a.td && typeof a.td === 'object') {
            flat.styleTd = { ...flat.styleTd, ...a.td };
        }
        // обратная совместимость: старые ключи в style
        if (a.borderRadiusHeader != null) flat.styleTh = { ...flat.styleTh, borderRadius: a.borderRadiusHeader };
        if (a.borderRadiusBody != null) flat.styleTd = { ...flat.styleTd, borderRadius: a.borderRadiusBody };
        if (a.whiteSpace != null) {
            flat.styleTh = { ...flat.styleTh, whiteSpace: a.whiteSpace };
            flat.styleTd = { ...flat.styleTd, whiteSpace: a.whiteSpace };
        }
        if (a.style && typeof a.style === 'object') {
            flat.style = { ...flat.style, ...a.style };
        }
    }

    // on: { rowClick, cellClick }
    if (raw.on && typeof raw.on === 'object') {
        if (typeof raw.on.rowClick === 'function') flat.onRowClick = raw.on.rowClick;
        if (typeof raw.on.cellClick === 'function') flat.onCellClick = raw.on.cellClick;
    }

    // scroll: { horizontal: true/false, pinnedColumns: number, rowColorPinnedOnly: boolean }
    if (raw.scroll && typeof raw.scroll === 'object') {
        if (raw.scroll.horizontal !== undefined) flat.isScrolling = !!raw.scroll.horizontal;
        if (typeof raw.scroll.pinnedColumns === 'number' && raw.scroll.pinnedColumns >= 0) {
            flat.pinnedColumns = raw.scroll.pinnedColumns;
        }
        if (raw.scroll.rowColorPinnedOnly !== undefined) flat.rowColorPinnedOnly = !!raw.scroll.rowColorPinnedOnly;
        if (raw.scroll.virtualized !== undefined) flat.virtualized = !!raw.scroll.virtualized;
        if (typeof raw.scroll.virtualizedRowHeight === 'number') flat.virtualizedRowHeight = raw.scroll.virtualizedRowHeight;
        if (typeof raw.scroll.virtualizedOverscan === 'number') flat.virtualizedOverscan = raw.scroll.virtualizedOverscan;
        if (typeof raw.scroll.virtualizedThreshold === 'number') flat.virtualizedThreshold = raw.scroll.virtualizedThreshold;
    }
    if (typeof raw.pinnedColumns === 'number' && raw.pinnedColumns >= 0) flat.pinnedColumns = raw.pinnedColumns;
    if (raw.virtualized !== undefined) flat.virtualized = !!raw.virtualized;
    if (typeof raw.virtualizedRowHeight === 'number') flat.virtualizedRowHeight = raw.virtualizedRowHeight;
    if (typeof raw.virtualizedOverscan === 'number') flat.virtualizedOverscan = raw.virtualizedOverscan;
    if (typeof raw.virtualizedThreshold === 'number') flat.virtualizedThreshold = raw.virtualizedThreshold;

    // visibleColumns, hiddenColumns
    if (Array.isArray(raw.visibleColumns)) flat.visibleColumns = raw.visibleColumns;
    if (Array.isArray(raw.hiddenColumns)) flat.hiddenColumns = raw.hiddenColumns;

    // Плоский вариант: borderRadius, styleTh/styleTd с верхнего уровня
    if (raw.borderRadius != null) flat.style = { ...flat.style, borderRadius: raw.borderRadius };
    if (raw.styleTable && typeof raw.styleTable === 'object') flat.styleTable = { ...flat.styleTable, ...raw.styleTable };
    if (raw.styleTh && typeof raw.styleTh === 'object') flat.styleTh = { ...flat.styleTh, ...raw.styleTh };
    if (raw.styleTd && typeof raw.styleTd === 'object') flat.styleTd = { ...flat.styleTd, ...raw.styleTd };
    // обратная совместимость: плоские whiteSpace, borderRadiusHeader/Body
    if (raw.whiteSpace != null) {
        flat.styleTh = { ...flat.styleTh, whiteSpace: raw.whiteSpace };
        flat.styleTd = { ...flat.styleTd, whiteSpace: raw.whiteSpace };
    }
    if (raw.borderRadiusHeader != null) flat.styleTh = { ...flat.styleTh, borderRadius: raw.borderRadiusHeader };
    if (raw.borderRadiusBody != null) flat.styleTd = { ...flat.styleTd, borderRadius: raw.borderRadiusBody };
    if (raw.headerLines !== undefined) flat.headerLines = raw.headerLines;
    if (raw.stripedRows !== undefined) flat.stripedRows = !!raw.stripedRows;

    if (raw.widgetStyle != null && typeof raw.widgetStyle === 'object') flat.widgetStyle = raw.widgetStyle;

    // sort: { by: string, order: 'asc'|'desc' } или плоские sortBy, sortOrder
    if (raw.sort && typeof raw.sort === 'object') {
        if (raw.sort.by != null) flat.sortBy = raw.sort.by;
        if (raw.sort.order === 'desc' || raw.sort.order === 'asc') flat.sortOrder = raw.sort.order;
    }
    if (raw.sortBy != null) flat.sortBy = raw.sortBy;
    if (raw.sortOrder === 'desc' || raw.sortOrder === 'asc') flat.sortOrder = raw.sortOrder;

    return flat;
}

/**
 * Проверяет, что данные в сыром формате { cols, values }.
 * @param {*} data
 * @returns {boolean}
 */
function isRawColsValues(data) {
    if (!Array.isArray(data) || data.length === 0) return false;
    const first = data[0];
    return first && Array.isArray(first.cols) && Array.isArray(first.values);
}

/**
 * Проверяет формат «обёртка»: ровно один объект с cols/keys/metaData и items (имена колонок и массив строк).
 * Не срабатывает для массива строк вида [ { cols, values }, ... ].
 * @param {*} data
 * @returns {boolean}
 */
function isWrappedColsItems(data) {
    if (!Array.isArray(data) || data.length !== 1) return false;
    const first = data[0];
    const meta = first && (first.metadata || first.metaData);
    const colNames = first && (Array.isArray(first.cols) || Array.isArray(first.keys) || (Array.isArray(meta) && meta.length > 0));
    const rowList = first && Array.isArray(first.items);
    return !!(colNames && rowList);
}

/**
 * Разворачивает формат { cols/keys/metaData, items } в массив строк и имена колонок.
 * Имена колонок берутся из metaData[].displayName (при наличии), иначе из cols/keys.
 * Элементы items могут быть { values: any[] } или уже объекты-строки { [key]: value }.
 * @param {Array<{cols?: string[], keys?: string[], metadata?: Array<{columnName: string, displayName?: string}>, metaData?: *, items: Array<{values?: *[]}|Object>}>} raw
 * @returns {{ rows: Object[], columnNames: string[] }}
 */
function unwrapColsItems(raw) {
    const wrapper = raw[0];
    const meta = wrapper.metadata || wrapper.metaData;
    const columnNames = Array.isArray(meta) && meta.length > 0
        ? meta.map((m) => (m && (m.displayName != null ? m.displayName : m.columnName)) || '')
        : (wrapper.cols || wrapper.keys || []);
    const items = wrapper.items || [];
    const colNameToDisplay = Array.isArray(meta) && meta.length > 0
        ? Object.fromEntries(meta.map((m) => [(m && m.columnName) || '', (m && (m.displayName != null ? m.displayName : m.columnName)) || '']))
        : null;

    const rows = items.map((item) => {
        const pv = Array.isArray(item?.values) ? item.values : null;
        if (pv) {
            const row = {};
            for (let j = 0; j < columnNames.length; j++) row[columnNames[j]] = pv[j];
            return row;
        }
        if (item && typeof item === 'object' && !Array.isArray(item) && !(Array.isArray(item.cols) && 'values' in item)) {
            if (colNameToDisplay) {
                const row = {};
                for (const [colName, displayName] of Object.entries(colNameToDisplay)) {
                    if (colName in item) row[displayName] = item[colName];
                }
                return row;
            }
            return item;
        }
        const row = {};
        const fallback = Array.isArray(item?.values) ? item.values : [];
        for (let j = 0; j < columnNames.length; j++) row[columnNames[j]] = fallback[j];
        return row;
    });
    return { rows, columnNames };
}

/**
 * Преобразует сырой массив { cols, values } в массив объектов-строк (как getDataTable).
 * Имена колонок берутся из первой строки: raw[0].metadata[].displayName, если есть; иначе из cols.
 * @param {Array<{cols?: string[], values?: *[], metadata?: Array<{displayName: string}>}>} raw
 * @returns {Object[]}
 */
function rawToRowObjects(raw) {
    const out = [];
    const first = raw[0];
    const columnNames = first && Array.isArray(first.metadata) && first.metadata.length > 0
        ? first.metadata.map((v) => v.displayName)
        : (first && (first.cols || [])) || [];

    for (const v of raw) {
        const row = {};
        const pc = v.cols || [];
        const pv = v.values || [];
        for (let j = 0; j < pv.length; j++) {
            const key = columnNames[j] ?? pc[j] ?? j;
            row[key] = pv[j];
        }
        out.push(row);
    }
    return out;
}

/**
 * Значение для сравнения при сортировке: число, дата или строка.
 * @param {*} v
 * @returns {{ type: 'number'|'date'|'string', value: number|Date|string }}
 */
function sortValue(v) {
    if (v == null) return { type: 'string', value: '' };
    if (typeof v === 'number' && !Number.isNaN(v)) return { type: 'number', value: v };
    if (v instanceof Date) return { type: 'date', value: v.getTime() };
    if (typeof v === 'string') {
        const trimmed = v.trim();
        const num = Number(trimmed);
        if (trimmed !== '' && !Number.isNaN(num)) return { type: 'number', value: num };
        const d = new Date(trimmed);
        if (!Number.isNaN(d.getTime())) return { type: 'date', value: d.getTime() };
        return { type: 'string', value: trimmed };
    }
    const s = String(v);
    const num = Number(s);
    if (!Number.isNaN(num)) return { type: 'number', value: num };
    return { type: 'string', value: s };
}

/**
 * Сортирует массив строк таблицы по колонке. Не мутирует исходный массив.
 * @param {Object[]} data - массив строк (объектов)
 * @param {string} sortBy - ключ колонки
 * @param {'asc'|'desc'} sortOrder
 * @returns {Object[]}
 */
function sortTableData(data, sortBy, sortOrder) {
    if (!Array.isArray(data) || data.length === 0 || sortBy == null || sortBy === '') return data;
    const order = sortOrder === 'desc' ? -1 : 1;
    return data.slice().sort((a, b) => {
        const va = sortValue(a[sortBy]);
        const vb = sortValue(b[sortBy]);
        if (va.type === 'number' && vb.type === 'number') {
            return order * (va.value - vb.value);
        }
        if (va.type === 'date' && vb.type === 'date') {
            return order * (va.value - vb.value);
        }
        const sa = String(va.value);
        const sb = String(vb.value);
        return order * (sa.localeCompare(sb, undefined, { numeric: true }));
    });
}

/**
 * Нормализует конфиг: колонки могут быть строками (ключ) или объектами { key, label?, width? }.
 * @param {Array<string|{key: string, label?: string, width?: string|number, format?: any, formatter?: any}>} columns
 * @returns {Array<{key: string, label: string, width: string, format?: any, thStyle?: Object, tdStyle?: Object}>}
 */
function normalizeColumns(columns) {
    if (!Array.isArray(columns) || columns.length === 0) return [];
    return columns.map((col) => {
        if (typeof col === 'string') {
            return { key: col, label: col, width: '' };
        }
        const key = col.key || col.field || '';
        const label = col.label != null ? col.label : key;
        let width = col.width != null ? col.width : '';
        if (typeof width === 'number') width = width + 'px';

        const format = col.format ?? col.formatter ?? col.fmt ?? col.valueFormatter ?? col.render ?? null;
        const thStyle = col.thStyle ?? col.styleTh ?? null;
        const tdStyle = col.tdStyle ?? col.styleTd ?? null;
        const visible = col.visible !== false;

        // Сохраняем остальные поля колонки (на будущее) и не ломаем текущий API.
        return { ...col, key, label, width: String(width), visible, ...(format != null ? { format } : {}), ...(thStyle ? { thStyle } : {}), ...(tdStyle ? { tdStyle } : {}) };
    });
}

/**
 * Возвращает массив ключей видимых колонок: из cfg.visibleColumns, или все кроме cfg.hiddenColumns, или по column.visible.
 * @param {Object} cfg - конфиг с visibleColumns / hiddenColumns
 * @param {Array<{key: string, visible?: boolean}>} columns - полный список колонок
 * @returns {string[]}
 */
function getVisibleColumnKeys(cfg, columns) {
    const allKeys = columns.map((c) => c.key);
    if (Array.isArray(cfg.visibleColumns) && cfg.visibleColumns.length > 0) {
        return cfg.visibleColumns.filter((k) => allKeys.includes(k));
    }
    if (Array.isArray(cfg.hiddenColumns) && cfg.hiddenColumns.length > 0) {
        return allKeys.filter((k) => !cfg.hiddenColumns.includes(k));
    }
    return columns.filter((c) => c.visible !== false).map((c) => c.key);
}

function applyColumnFormatters(columns, cfg) {
    const fmts = cfg?.columnFormatters && typeof cfg.columnFormatters === 'object' ? cfg.columnFormatters : null;
    if (!fmts) return columns;

    return columns.map((col) => {
        if (col && (col.format != null || col.formatter != null || col.valueFormatter != null || col.render != null)) return col;
        const v = fmts[col.key] ?? fmts[col.label];
        if (v == null) return col;
        return { ...col, format: v };
    });
}

function formatValueBySpec(spec, value, row, rowIndex, colKey) {
    if (spec == null) return value;

    // Функция-форматтер (value, row, rowIndex, colKey) => any
    if (typeof spec === 'function') return spec(value, row, rowIndex, colKey);

    // Пресет строкой
    if (typeof spec === 'string') {
        const s = spec.trim().toLowerCase();
        // 'fval' — как в библиотеке: decimals=2, localize=true
        if (s === 'fval') return FormatValue.fval(value);
        // 'number'/'num' — “умный” режим без лишних нулей
        if (s === 'number' || s === 'num') return FormatValue.fval(value, 'auto', true);
        if (s === 'short' || s === 'shortval' || s === 'fshortval') return FormatValue.fshortval(value, 2);
        if (s === 'percent' || s === 'perc' || s === 'fperc') return FormatValue.fperc(value);
        if (s === 'money' || s === 'currency' || s === 'fmoney') return FormatValue.fmoney(value);
        if (s === 'date' || s === 'fdate') return FormatDate.fdate(value);
        if (s === 'datetime') return FormatDate.fdate(value, 'dd.mm.yyyy HH:MM');
        return value;
    }

    // Спека объектом: { type, ...options }
    if (typeof spec === 'object') {
        const type = String(spec.type ?? spec.kind ?? spec.preset ?? '').toLowerCase();
        if (type === 'number' || type === 'num' || type === 'fval') {
            const decimals = spec.decimals ?? spec.d ?? 2;
            const localize = spec.localize ?? spec.locale ?? true;
            return FormatValue.fval(value, decimals, !!localize);
        }
        if (type === 'short' || type === 'shortval' || type === 'fshortval') {
            const decimals = spec.decimals ?? spec.d ?? 2;
            return FormatValue.fshortval(value, decimals);
        }
        if (type === 'percent' || type === 'perc' || type === 'fperc') {
            const decimals = spec.decimals ?? spec.d ?? 2;
            return FormatValue.fperc(value, decimals);
        }
        if (type === 'money' || type === 'currency' || type === 'fmoney') {
            const currency = spec.currency ?? spec.cur ?? 'RUB';
            const decimals = spec.decimals ?? spec.d ?? 2;
            return FormatValue.fmoney(value, currency, decimals);
        }
        if (type === 'date' || type === 'datetime' || type === 'fdate') {
            const fmt = spec.format ?? spec.fmt ?? (type === 'datetime' ? 'dd.mm.yyyy HH:MM' : 'dd.mm.yyyy');
            return FormatDate.fdate(value, fmt);
        }
        return value;
    }

    return value;
}

function safeToDisplayString(v) {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'bigint') return String(v);
    // Последний шанс — без падений на циклических структурах
    try {
        return String(v);
    } catch (_) {
        return '';
    }
}

/**
 * Проверяет, что опция форматирования задана как словарь: { column?, map }.
 * @param {*} opt
 * @returns {boolean}
 */
function isColumnMapFormat(opt) {
    return opt && typeof opt === 'object' && !Array.isArray(opt) && opt.map != null && typeof opt.map === 'object';
}

/**
 * Возвращает значение строки для подстановки в map (по имени колонки или getValue).
 * @param {Object} row
 * @param {Object} opt - { column?: string, getValue?: (row) => any }
 * @returns {*}
 */
function getRowValueForMap(row, opt) {
    if (typeof opt.getValue === 'function') return opt.getValue(row);
    const key = opt.column;
    return key != null ? row[key] : undefined;
}

/**
 * Разрешает класс строки: функция (row, rowIndex) => string|string[] или { column, map }.
 * @param {Object} row
 * @param {number} rowIndex
 * @param {*} rowClassName - function | { column: string, map: Object }
 * @returns {string}
 */
function resolveRowClass(row, rowIndex, rowClassName) {
    if (typeof rowClassName === 'function') {
        const rc = rowClassName(row, rowIndex);
        if (Array.isArray(rc)) return rc.filter(Boolean).join(' ');
        return rc ? String(rc) : '';
    }
    if (isColumnMapFormat(rowClassName)) {
        const val = getRowValueForMap(row, rowClassName);
        const mapped = rowClassName.map[val];
        if (mapped == null) return '';
        if (Array.isArray(mapped)) return mapped.filter(Boolean).join(' ');
        return String(mapped);
    }
    return '';
}

/**
 * Разрешает стиль строки: функция (row, rowIndex) => Object или { column, map } (значения map — цвет строки или объект стилей).
 * @param {Object} row
 * @param {number} rowIndex
 * @param {*} rowStyle - function | { column: string, map: Object }
 * @returns {string} CSS строка
 */
function resolveRowStyle(row, rowIndex, rowStyle, styleFromOptionsFn) {
    let obj = null;
    if (typeof rowStyle === 'function') {
        obj = rowStyle(row, rowIndex);
    } else if (isColumnMapFormat(rowStyle)) {
        const val = getRowValueForMap(row, rowStyle);
        const mapped = rowStyle.map[val];
        if (mapped != null) {
            obj = typeof mapped === 'string' ? { backgroundColor: mapped } : (typeof mapped === 'object' && mapped !== null ? mapped : null);
        }
    }
    if (obj && typeof obj === 'object') return styleFromOptionsFn(obj);
    return '';
}

/**
 * Разрешает класс ячейки: функция или { column, map } (применяется к ячейкам указанной колонки по значению).
 * @param {Object} row
 * @param {string} colKey
 * @param {*} value
 * @param {number} rowIndex
 * @param {*} cellClassName
 * @returns {string}
 */
function resolveCellClass(row, colKey, value, rowIndex, cellClassName) {
    if (typeof cellClassName === 'function') {
        const cc = cellClassName(row, colKey, value, rowIndex);
        if (Array.isArray(cc)) return cc.filter(Boolean).join(' ');
        return cc ? String(cc) : '';
    }
    if (isColumnMapFormat(cellClassName)) {
        const key = cellClassName.column;
        if (key != null && colKey !== key) return '';
        const val = key != null ? row[key] : value;
        const mapped = cellClassName.map[val];
        if (mapped == null) return '';
        if (Array.isArray(mapped)) return mapped.filter(Boolean).join(' ');
        return String(mapped);
    }
    return '';
}

/**
 * Разрешает стиль ячейки: функция или { column, map }.
 * @param {Object} row
 * @param {string} colKey
 * @param {*} value
 * @param {number} rowIndex
 * @param {*} cellStyle
 * @param {function} cellStyleFromOptionsFn
 * @returns {string}
 */
function resolveCellStyle(row, colKey, value, rowIndex, cellStyle, cellStyleFromOptionsFn) {
    let obj = null;
    if (typeof cellStyle === 'function') {
        obj = cellStyle(row, colKey, value, rowIndex);
    } else if (isColumnMapFormat(cellStyle)) {
        const key = cellStyle.column;
        if (key != null && colKey !== key) return '';
        const val = key != null ? row[key] : value;
        const mapped = cellStyle.map[val];
        if (mapped != null) {
            obj = typeof mapped === 'string' ? { backgroundColor: mapped } : (typeof mapped === 'object' && mapped !== null ? mapped : null);
        }
    }
    if (obj && typeof obj === 'object') return cellStyleFromOptionsFn(obj);
    return '';
}

/** Если форматтер вернул { html: string, title?: string } (или __html), возвращает HTML и текст для title. Иначе null. */
function unwrapFormattedHtml(displayValue) {
    if (displayValue == null || typeof displayValue !== 'object' || Array.isArray(displayValue)) return null;
    let raw = null;
    if ('html' in displayValue && displayValue.html != null) raw = displayValue.html;
    if (raw == null && '__html' in displayValue && displayValue.__html != null) raw = displayValue.__html;
    if (raw == null) {
        const k = Object.keys(displayValue).find((key) => key.toLowerCase() === 'html');
        if (k != null) raw = displayValue[k];
    }
    const htmlStr = raw != null && (typeof raw === 'string' || raw instanceof String) ? String(raw) : null;
    if (htmlStr == null || htmlStr === '') return null;
    const title = displayValue.title != null ? String(displayValue.title) : htmlStr.replace(/<[^>]*>/g, '').trim();
    return { html: htmlStr, title };
}

/**
 * Рендер таблицы в контейнер.
 *
 * Интуитивный вызов (всё по группам):
 *   renderTable({
 *     target: elementOrId,
 *     data: items,
 *     columns: { 'РНГИО': { width: '10%' } },
 *     style: { border: { collapse: 'separate', spacing: '0.5em 0.5em' }, borderRadius: '20px' },
 *     scroll: { horizontal: false },
 *     on: { rowClick(row, rowIndex) { ... } },
 *   })
 *
 * Классический вызов: renderTable(container, dataset, config) или renderTable({ container, dataset, ... }).
 *
 * @param {string|HTMLElement|Object} containerOrConfig - id/элемент или конфиг (target/data, columns, style, on, scroll)
 * @param {Object[]|Array<{cols: string[], values: *[]}>} [dataset] - массив строк или сырой формат { cols, values }
 * @param {Object} [config] - конфиг при вызове (container, dataset)
 * @param {Array<string|{key, label?, width?, format?}>} [config.columns] - колонки (format: функция | пресет | объект-спека)
 * @param {Object.<string, string|number>} [config.columnWidths] - ширины по ключу
 * @param {Object.<string, (function|string|Object)>} [config.columnFormatters] - форматирование по ключу. Функция может вернуть строку, либо { html: string, title?: string } для вывода HTML в ячейке (условное форматирование)
 * @param {boolean} [config.stickyHeader=true] - закреплённый заголовок
 * @param {boolean} [config.isScrolling=false] - горизонтальная прокрутка
 * @param {number} [config.pinnedColumns=0] - количество столбцов, закреплённых слева; остальные прокручиваются по горизонтали
 * @param {boolean} [config.rowColorPinnedOnly=false] - при pinnedColumns > 0: true — применять rowStyle только к ячейкам в области скролла
 * @param {string} [config.borderCollapse] - 'collapse' | 'separate'
 * @param {string} [config.borderSpacing] - при separate
 * @param {function(row, rowIndex)} [config.onRowClick]
 * @param {function(row, cellKey, value, rowIndex): (boolean|void)} [config.onCellClick] — вернуть true, чтобы подсветить строку и ячейку; при false/undefined подсветки не будет
 * @param {function(row, rowIndex): (string|string[])|{column: string, map: Object}} [config.rowClassName] - условные CSS-классы для строки. Либо функция, либо { column: 'Ключ колонки', map: { 'Значение': 'css-class', ... } } — подстановка по значению в колонке
 * @param {function(row, rowIndex): Object|{column: string, map: Object}} [config.rowStyle] - условные стили для строки. Либо функция, либо { column, map } (значения map — строка цвета фона или объект стилей)
 * @param {function(row, cellKey, value, rowIndex): (string|string[])|{column?: string, map: Object}} [config.cellClassName] - условные классы для ячейки; при формате { column, map } — только ячейки указанной колонки
 * @param {function(row, cellKey, value, rowIndex): Object|{column?: string, map: Object}} [config.cellStyle] - условные стили для ячейки; при формате { column, map } — только ячейки указанной колонки
 * @param {boolean} [config.hoverRows=true] - включить/выключить hover-подсветку для кликабельных строк
 * @param {Object} [config.style] - стили обёртки таблицы
 * @param {Object} [config.styleTh] - стили ячеек шапки: whiteSpace, borderRadius, wordBreak и др.
 * @param {Object} [config.styleTd] - стили ячеек тела: whiteSpace, borderRadius, wordBreak и др.
 * @param {Object} [config.style.th] - то же через style.th (при интуитивном конфиге)
 * @param {Object} [config.style.td] - то же через style.td (при интуитивном конфиге)
 * @param {number|string} [config.headerLines=2] - макс. строк в заголовке (2 по умолчанию); 0 / null / 'unlimited' — без ограничения
 * @param {boolean} [config.stripedRows=true] - чередование цвета строк (разноцветные строки); false — отключить
 * @param {string[]} [config.hiddenColumns] - перечень колонок, которые не показывать (ключи)
 * @param {string[]} [config.visibleColumns] - явный список видимых колонок (ключи); если задан — отображаются только они
 * @param {Object} [config.widgetStyle] - стили виджета (напр. w.style): align, color, fontFamily, fontSize, fontStyle, fontWeight, lineHeight, textOutline; отсутствующее подставляется из дефолтов библиотеки
 * @param {string} [config.sortBy] - колонка для сортировки по умолчанию (ключ колонки)
 * @param {'asc'|'desc'} [config.sortOrder='asc'] - направление сортировки по умолчанию
 * @param {boolean|number} [config.virtualized=false] - виртуализация: true — включить при dataset.length >= virtualizedThreshold; при большом числе строк рендерятся только видимые
 * @param {number} [config.virtualizedRowHeight=44] - высота строки в px для расчёта скролла
 * @param {number} [config.virtualizedOverscan=8] - сколько строк догружать сверху/снизу от видимой области
 * @param {number} [config.virtualizedThreshold=100] - порог: включать виртуализацию при числе строк >= этого значения
 */
function renderTable(containerOrConfig, dataset, config = {}) {
    let container;
    let data;
    let cfg;
    if (containerOrConfig && typeof containerOrConfig === 'object' && !containerOrConfig.nodeType && (containerOrConfig.dataset !== undefined || containerOrConfig.data !== undefined)) {
        cfg = normalizeIntuitiveConfig(containerOrConfig);
        container = cfg.container;
        data = Array.isArray(cfg.dataset) ? cfg.dataset : [];
    } else {
        container = containerOrConfig;
        data = Array.isArray(dataset) ? dataset : [];
        cfg = { ...DEFAULT_CONFIG, ...config };
        // обратная совместимость: плоские whiteSpace, borderRadiusHeader/Body → styleTh/styleTd
        if (config.whiteSpace != null) {
            cfg.styleTh = { ...cfg.styleTh, whiteSpace: config.whiteSpace };
            cfg.styleTd = { ...cfg.styleTd, whiteSpace: config.whiteSpace };
        }
        if (config.borderRadiusHeader != null) cfg.styleTh = { ...cfg.styleTh, borderRadius: config.borderRadiusHeader };
        if (config.borderRadiusBody != null) cfg.styleTd = { ...cfg.styleTd, borderRadius: config.borderRadiusBody };
    }
    // Плоский конфиг: borderRadius и т.д. в style
    if (cfg.borderRadius != null && !cfg.style) cfg.style = {};
    if (cfg.borderRadius != null) cfg.style = { ...cfg.style, borderRadius: cfg.borderRadius };
    let columns = normalizeColumns(cfg.columns);

    if (isRawColsValues(data)) {
        data = rawToRowObjects(data);
    } else if (isWrappedColsItems(data)) {
        const { rows, columnNames } = unwrapColsItems(data);
        data = rows;
        if (columns.length === 0 && columnNames.length > 0) {
            columns = columnNames.map((k) => ({ key: k, label: k, width: '' }));
        }
    }

    const tableId = genId();
    const prefix = cfg.classPrefix;

    const el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) return;

    if (columns.length === 0 && data.length > 0) {
        const first = data[0];
        const keys = Object.keys(first);
        columns.push(...keys.map((k) => ({ key: k, label: k, width: '' })));
    } else if (columns.length === 0) {
        el.innerHTML = '';
        return;
    }

    const widths = cfg.columnWidths && typeof cfg.columnWidths === 'object' ? cfg.columnWidths : null;
    if (widths) {
        columns.forEach((col) => {
            const x = widths[col.key] ?? widths[col.label];
            if (x != null && x !== '') col.width = typeof x === 'number' ? x + 'px' : String(x);
        });
    }

    if (cfg.sortBy != null && cfg.sortBy !== '') {
        data = sortTableData(data, cfg.sortBy, cfg.sortOrder || 'asc');
    }

    columns = applyColumnFormatters(columns, cfg);

    const visibleKeys = getVisibleColumnKeys(cfg, columns);
    const columnsForRender = columns.filter((c) => visibleKeys.includes(c.key));

    const html = buildTableHTML(tableId, prefix, data, columnsForRender, cfg);
    el.innerHTML = html;
    const pinCount = Math.min(Math.max(0, parseInt(cfg.pinnedColumns, 10) || 0), columnsForRender.length);
    if (pinCount > 0) applyPinnedColumnsLayout(el, prefix, pinCount);
    initTableEvents(el, tableId, prefix, data, cfg);

    const useVirtualized = !!cfg.virtualized && data.length >= (cfg.virtualizedThreshold ?? 100);
    if (useVirtualized) {
        initVirtualizedScroll(el, tableId, prefix, data, columnsForRender, cfg);
    }
}

/**
 * Строит HTML одной строки таблицы (для обычного рендера и виртуализации).
 * @param {string} prefix
 * @param {Array} columns
 * @param {Object} cfg
 * @param {Object} row
 * @param {number} rowIndex
 * @param {number} [fixedRowHeight] - при виртуализации задаёт высоту строки в px
 * @returns {string}
 */
function buildSingleRow(prefix, columns, cfg, row, rowIndex, fixedRowHeight) {
    const pinCount = Math.min(Math.max(0, parseInt(cfg.pinnedColumns, 10) || 0), columns.length);
    const isScrolling = cfg.isScrolling === true || pinCount > 0;
    const tdCellStyle = cellStyleFromOptions(cfg.styleTd, {});

    const rowExtraClass = resolveRowClass(row, rowIndex, cfg.rowClassName);
    const rowExtraStyle = cfg.rowStyle
        ? resolveRowStyle(row, rowIndex, cfg.rowStyle, styleFromOptions)
        : '';

    const cells = columns
        .map((col, colIndex) => {
            const value = row[col.key];
            let displayValue = value;
            if (col.format != null) {
                try {
                    displayValue = formatValueBySpec(col.format, value, row, rowIndex, col.key);
                } catch (_) {
                    displayValue = value;
                }
            }
            let formattedHtml = unwrapFormattedHtml(displayValue);
            if (!formattedHtml && displayValue && typeof displayValue === 'object' && !Array.isArray(displayValue)) {
                const h = displayValue.html ?? displayValue.__html;
                if (h != null && (typeof h === 'string' || h instanceof String)) {
                    formattedHtml = { html: String(h), title: displayValue.title != null ? String(displayValue.title) : String(h).replace(/<[^>]*>/g, '').trim() };
                }
            }
            const text = formattedHtml ? formattedHtml.title : safeToDisplayString(displayValue);
            const cellContent = formattedHtml ? String(formattedHtml.html) : escapeHtml(text);
            let w = '';
            if (isScrolling) {
                w = col.width
                    ? `width: ${col.width}; min-width: ${col.width}; max-width: ${col.width};`
                    : `min-width: ${DEFAULT_MIN_COL_WIDTH};`;
            } else if (col.width) {
                w = `width: ${escapeAttr(col.width)}; min-width: 0;`;
            }
            const tdExtra = col.tdStyle ? cellStyleFromOptions(col.tdStyle) : '';

            const cellExtraClass = resolveCellClass(row, col.key, value, rowIndex, cfg.cellClassName);
            const cellExtraStyle = cfg.cellStyle
                ? resolveCellStyle(row, col.key, value, rowIndex, cfg.cellStyle, cellStyleFromOptions)
                : '';

            const isPinned = colIndex < pinCount;
            const pinClass = isPinned ? ` ${prefix}-pin` : '';
            const pinAttr = isPinned ? ` data-pin-index="${colIndex}"` : '';
            const pinStyle = isPinned ? ' position:sticky; z-index:2;' : '';
            const rowStyleOnCell = cfg.rowColorPinnedOnly && pinCount > 0 && rowExtraStyle && !isPinned ? rowExtraStyle : '';
            const tdStyle = `padding: 10px 12px; ${w} ${tdCellStyle} ${tdExtra} ${cellExtraStyle} ${rowStyleOnCell}${pinStyle}`;
            const tdClass = [ `${prefix}-td`, cellExtraClass, pinClass.trim() ].filter(Boolean).join(' ');

            return `<td class="${tdClass}" style="${tdStyle}" title="${escapeAttr(text)}" data-col="${escapeAttr(col.key)}" data-row-index="${rowIndex}"${pinAttr}>${cellContent}</td>`;
        })
        .join('');

    const clickable = cfg.onRowClick || cfg.onCellClick ? ` ${prefix}-row-clickable` : '';
    const stripeClass = rowIndex % 2 === 0 ? ` ${prefix}-tr-even` : ` ${prefix}-tr-odd`;
    const trClass = [`${prefix}-tr`, clickable.trim(), stripeClass.trim(), rowExtraClass].filter(Boolean).join(' ');
    let trStyle = (cfg.rowColorPinnedOnly && pinCount > 0 && rowExtraStyle) ? '' : rowExtraStyle;
    if (fixedRowHeight != null && fixedRowHeight > 0) {
        trStyle = (trStyle ? trStyle + ' ' : '') + `height: ${fixedRowHeight}px; box-sizing: border-box;`;
    }
    return `<tr class="${trClass}" style="${trStyle}" data-row-index="${rowIndex}">${cells}</tr>`;
}

/**
 * Строка-спейсер для виртуализации (держит высоту скролла).
 */
function buildSpacerRow(prefix, columnCount, heightPx) {
    if (heightPx <= 0) return '';
    return `<tr class="${prefix}-tr ${prefix}-tr-spacer" aria-hidden="true"><td class="${prefix}-td" colspan="${columnCount}" style="height: ${heightPx}px; padding: 0; border: none; line-height: 0; vertical-align: top;"></td></tr>`;
}

function buildTableHTML(tableId, prefix, data, columns, cfg) {
    const stickyHeader = cfg.stickyHeader !== false;
    const pinnedColumns = Math.max(0, parseInt(cfg.pinnedColumns, 10) || 0);
    const pinCount = Math.min(pinnedColumns, columns.length);
    const isScrolling = cfg.isScrolling === true || pinCount > 0;

    // Стили виджета (w.style): если передан widgetStyle — подмешиваем к table/th/td; отсутствующее — из дефолтов библиотеки
    if (cfg.widgetStyle && typeof cfg.widgetStyle === 'object') {
        const baseFromWidget = { ...DEFAULT_TABLE_FONT, ...widgetStyleToTableStyle(cfg.widgetStyle) };
        cfg = {
            ...cfg,
            styleTable: { ...baseFromWidget, ...cfg.styleTable },
            styleTh: { ...baseFromWidget, ...cfg.styleTh },
            styleTd: { ...baseFromWidget, ...cfg.styleTd },
        };
    }

    const wrapperStyle = { borderRadius: '12px', overflow: 'hidden', ...(cfg.style || {}) };

    // Удобные короткие ключи: borderColor в th/td/table превращаем в CSS-переменные,
    // чтобы базовые CSS-правила могли применять разные цвета бордера.
    if (cfg?.styleTh?.borderColor != null && cfg.styleTh.borderColor !== '') wrapperStyle['--tbl-border-th'] = cfg.styleTh.borderColor;
    if (cfg?.styleTh?.borderWidth != null && cfg.styleTh.borderWidth !== '') wrapperStyle['--tbl-border-th-width'] = toCssLength(cfg.styleTh.borderWidth);
    if (cfg?.styleTh?.borderStyle != null && cfg.styleTh.borderStyle !== '') wrapperStyle['--tbl-border-th-style'] = String(cfg.styleTh.borderStyle);
    if (cfg?.styleTd?.borderColor != null && cfg.styleTd.borderColor !== '') wrapperStyle['--tbl-border-td'] = cfg.styleTd.borderColor;
    if (cfg?.styleTd?.borderWidth != null && cfg.styleTd.borderWidth !== '') wrapperStyle['--tbl-border-td-width'] = toCssLength(cfg.styleTd.borderWidth);
    if (cfg?.styleTd?.borderStyle != null && cfg.styleTd.borderStyle !== '') wrapperStyle['--tbl-border-td-style'] = String(cfg.styleTd.borderStyle);
    if (cfg?.styleTable?.borderColor != null && cfg.styleTable.borderColor !== '') wrapperStyle['--tbl-table-border'] = cfg.styleTable.borderColor;
    if (cfg?.styleTable?.borderWidth != null && cfg.styleTable.borderWidth !== '') wrapperStyle['--tbl-table-border-width'] = toCssLength(cfg.styleTable.borderWidth);

    // Компенсация микросдвига sticky-заголовка на старте скролла.
    // Если у таблицы есть верхний бордер, то <th> часто имеет offsetTop > 0 (обычно 1px),
    // из-за чего при первом скролле шапка «едва» смещается вверх до момента прилипания.
    // Сдвигаем sticky-top на толщину бордера таблицы (или 1px по умолчанию при заданном borderColor).
    const tableBorderLikelyExists = !!(
        cfg?.styleTable &&
        typeof cfg.styleTable === 'object' &&
        (
            (cfg.styleTable.border && cfg.styleTable.border !== '') ||
            (cfg.styleTable.borderStyle && cfg.styleTable.borderStyle !== '') ||
            (cfg.styleTable.borderColor && cfg.styleTable.borderColor !== '') ||
            (cfg.styleTable.borderWidth != null && cfg.styleTable.borderWidth !== '')
        )
    );
    if (tableBorderLikelyExists) {
        wrapperStyle['--tbl-sticky-top'] = cfg?.styleTable?.borderWidth != null && cfg.styleTable.borderWidth !== ''
            ? toCssLength(cfg.styleTable.borderWidth)
            : 'var(--tbl-table-border-width, 1px)';
    }

    const wrapperStyleStr = Object.entries(wrapperStyle)
        .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}:${v}`)
        .join(';');

    const scrollStyle = `flex: 1; min-height: 0; overflow-x: ${isScrolling ? 'auto' : 'hidden'}; overflow-y: auto;`;

    const defaultsTh = { whiteSpace: 'nowrap' };
    const defaultsTd = {};
    const thCellStyle = cellStyleFromOptions(cfg.styleTh, defaultsTh);
    const headerLinesInnerStyle = headerLinesToStyle(cfg.headerLines);
    const tdCellStyle = cellStyleFromOptions(cfg.styleTd, defaultsTd);

    let thStyle = `padding: 10px 12px; text-align: left; font-weight: 600; ${thCellStyle}`;
    if (stickyHeader) {
        const hasBg = hasBackgroundStyle(cfg.styleTh);
        const bg = hasBg ? '' : ' background: var(--tbl-head-bg, #1e2a4a);';
        thStyle += ` position: sticky; top: var(--tbl-sticky-top, 0px); z-index: 2;${bg}`;
    }

    const colgroup = columns
        .map((col) => {
            if (!isScrolling && col.width) return `<col style="width:${escapeAttr(col.width)}">`;
            if (isScrolling) return `<col style="min-width:${DEFAULT_MIN_COL_WIDTH}">`;
            return `<col>`;
        })
        .join('');
    const headerWordBreak = cfg.styleTh && cfg.styleTh.wordBreak != null && cfg.styleTh.wordBreak !== ''
        ? `word-break: ${cfg.styleTh.wordBreak};`
        : '';
    const headerCells = columns
        .map((col, colIndex) => {
            let w = '';
            if (isScrolling) {
                w = col.width
                    ? `width:${col.width};min-width:${col.width};max-width:${col.width};`
                    : `min-width:${DEFAULT_MIN_COL_WIDTH};`;
            } else if (col.width) {
                w = `width:${escapeAttr(col.width)};min-width:0;`;
            }
            const isPinned = colIndex < pinCount;
            const pinClass = isPinned ? ` ${prefix}-pin` : '';
            const pinAttr = isPinned ? ` data-pin-index="${colIndex}"` : '';
            const pinStyle = isPinned ? ' position:sticky; z-index:3;' : '';
            const labelHtml = escapeHtml(col.label);
            const innerStyle = [headerLinesInnerStyle, headerWordBreak, 'width:100%;min-width:0;box-sizing:border-box;'].filter(Boolean).join(' ');
            const innerContent = headerLinesInnerStyle || headerWordBreak
                ? `<span class="${prefix}-th-inner" style="${innerStyle}">${labelHtml}</span>`
                : labelHtml;
            const thExtra = col.thStyle ? cellStyleFromOptions(col.thStyle) : '';
            return `<th class="${prefix}-th${pinClass}" style="${thStyle} ${thExtra} ${w}${pinStyle}" title="${labelHtml}" data-col="${escapeAttr(col.key)}"${pinAttr}>${innerContent}</th>`;
        })
        .join('');
    const useVirtualized = !!cfg.virtualized && data.length >= (cfg.virtualizedThreshold ?? 100);
    const rowHeight = Math.max(1, parseInt(cfg.virtualizedRowHeight, 10) || 44);
    const overscan = Math.max(0, parseInt(cfg.virtualizedOverscan, 10) || 8);

    let rows;
    if (useVirtualized) {
        const total = data.length;
        const initialEnd = Math.min(total, Math.max(20, overscan * 3));
        const topSpacer = buildSpacerRow(prefix, columns.length, 0);
        const visibleRows = data.slice(0, initialEnd).map((row, i) => buildSingleRow(prefix, columns, cfg, row, i, rowHeight)).join('');
        const bottomSpacer = buildSpacerRow(prefix, columns.length, (total - initialEnd) * rowHeight);
        rows = topSpacer + visibleRows + bottomSpacer;
    } else {
        rows = data.map((row, rowIndex) => buildSingleRow(prefix, columns, cfg, row, rowIndex)).join('');
    }

    const hasExplicitWidths = isScrolling && columns.some((col) => col.width);
    const tableWidthStyle = hasExplicitWidths
        ? 'width: max-content; min-width: 100%;'
        : 'width: 100%;';
    const tableLayoutStyle = isScrolling ? 'table-layout: auto;' : 'table-layout: fixed;';
    const borderCollapse = cfg.borderCollapse === 'separate' ? 'separate' : 'collapse';
    const borderSpacing = cfg.borderCollapse === 'separate' ? (cfg.borderSpacing || '0.5em 0.5em') : '0';
    const tableBorderStyle = `border-collapse: ${borderCollapse}; border-spacing: ${borderSpacing};`;

    const tableStyleExtra = styleFromOptions(cfg.styleTable);
    const tableBorderAuto = tableBorderFromColor(cfg.styleTable);

    const wrapClasses = [
        `${prefix}-wrap`,
        borderSidesToClass(prefix, 'th', cfg?.styleTh?.borderSides),
        borderSidesToClass(prefix, 'td', cfg?.styleTd?.borderSides),
    ].filter(Boolean).join(' ');

    return `
<div id="tbl-wrap-${tableId}" class="${wrapClasses}" style="${wrapperStyleStr}; display: flex; flex-direction: column; height: 100%; min-height: 0;">
  <div class="${prefix}-scroll" style="${scrollStyle}">
    <table id="tbl-${tableId}" class="${prefix}-table" style="${tableWidthStyle} ${tableBorderStyle} ${tableLayoutStyle} ${tableBorderAuto} ${tableStyleExtra}">
      <colgroup>${colgroup}</colgroup>
      <thead class="${prefix}-thead">
        <tr class="${prefix}-tr ${prefix}-tr-head">${headerCells}</tr>
      </thead>
      <tbody class="${prefix}-tbody">${rows}</tbody>
    </table>
  </div>
</div>
<style>${tableStyles(prefix, { stripedRows: cfg.stripedRows !== false, hoverRows: cfg.hoverRows !== false })}</style>`;
}

/**
 * Стили для ограничения заголовка по числу строк (line-clamp).
 * @param {number|string|null|undefined} headerLines - макс. строк (2 по умолчанию); 0 / null / 'unlimited' — без ограничения
 * @returns {string}
 */
function headerLinesToStyle(headerLines) {
    const n = parseInt(headerLines, 10);
    if (headerLines === null || headerLines === undefined || headerLines === 'unlimited' || headerLines === '' || Number.isNaN(n) || n <= 0) return '';
    const base = `display: -webkit-box; -webkit-line-clamp: ${n}; -webkit-box-orient: vertical; overflow: hidden;`;
    return n > 1 ? `${base} white-space: normal;` : base;
}

/**
 * Собирает строку CSS из объекта опций ячейки (th/td).
 * Поддерживает: whiteSpace, borderRadius, wordBreak и любые другие ключи (camelCase → kebab-case).
 * @param {Object} opts - styleTh или styleTd
 * @param {Object} defaults - значения по умолчанию
 * @returns {string}
 */
function cellStyleFromOptions(opts, defaults = {}) {
    if (!opts || typeof opts !== 'object') return '';
    const merged = { ...defaults, ...opts };
    const parts = [];
    if (merged.whiteSpace != null && merged.whiteSpace !== '') parts.push(`white-space: ${merged.whiteSpace}`);
    if (merged.borderRadius != null && merged.borderRadius !== '') parts.push(`border-radius: ${merged.borderRadius}`);
    if (merged.wordBreak != null && merged.wordBreak !== '') parts.push(`word-break: ${merged.wordBreak}`);
    for (const [k, v] of Object.entries(merged)) {
        if (v == null || v === '' || ['whiteSpace', 'borderRadius', 'wordBreak', 'headerLines', 'borderColor', 'borderWidth', 'borderStyle', 'borderSides'].includes(k)) continue;
        const cssKey = k.replace(/([A-Z])/g, '-$1').toLowerCase();
        parts.push(`${cssKey}: ${v}`);
    }
    return parts.length ? parts.join('; ') + ';' : '';
}

function styleFromOptions(opts) {
    if (!opts || typeof opts !== 'object') return '';
    const parts = [];
    for (const [k, v] of Object.entries(opts)) {
        if (v == null || v === '') continue;
        if (k === 'borderColor') continue; // обрабатывается отдельной логикой/переменными
        const cssKey = k.replace(/([A-Z])/g, '-$1').toLowerCase();
        parts.push(`${cssKey}: ${v}`);
    }
    return parts.length ? parts.join('; ') + ';' : '';
}

function hasBackgroundStyle(opts) {
    if (!opts || typeof opts !== 'object') return false;
    return (
        (opts.background != null && opts.background !== '') ||
        (opts.backgroundColor != null && opts.backgroundColor !== '')
    );
}

function tableBorderFromColor(styleTable) {
    if (!styleTable || typeof styleTable !== 'object') return '';
    const bc = styleTable.borderColor;
    if (bc == null || bc === '') return '';

    const hasBorder = styleTable.border != null && styleTable.border !== '';
    const hasBorderStyle = styleTable.borderStyle != null && styleTable.borderStyle !== '';
    const hasBorderWidth = styleTable.borderWidth != null && styleTable.borderWidth !== '';

    // Если пользователь задал только borderColor — делаем адекватный 1px solid.
    if (!hasBorder && !hasBorderStyle) {
        const w = hasBorderWidth ? `var(--tbl-table-border-width, ${toCssLength(styleTable.borderWidth)})` : '1px';
        return `border: ${w} solid var(--tbl-table-border, ${bc});`;
    }
    // Иначе просто применим цвет (border-style/width пользователь задаёт сам).
    return `border-color: var(--tbl-table-border, ${bc});`;
}

function toCssLength(v) {
    if (v == null) return '';
    if (typeof v === 'number' && Number.isFinite(v)) return `${v}px`;
    return String(v);
}

function borderSidesToClass(prefix, kind, value) {
    if (value == null || value === '' || value === 'all') return '';
    const v = String(value).toLowerCase();
    const base = `${prefix}-${kind}-border-`;
    if (v === 'none') return base + 'none';
    if (v === 'bottom') return base + 'bottom';
    if (v === 'top') return base + 'top';
    if (v === 'left') return base + 'left';
    if (v === 'right') return base + 'right';
    if (v === 'x') return base + 'x';
    if (v === 'y') return base + 'y';
    return '';
}

function escapeAttr(s) {
    if (s == null) return '';
    const str = String(s);
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeHtml(s) {
    if (s == null) return '';
    const str = String(s);
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function tableStyles(prefix, options = {}) {
    const stripedRows = options.stripedRows !== false;
    const hoverRows = options.hoverRows !== false;
    return `
.${prefix}-wrap {
  --tbl-head-bg: rgb(18 32 66 / 1);
  --tbl-row-bg: rgb(39 43 76);
  --tbl-row-hover: rgba(255,255,255,.06);
  --tbl-cell-selected-bg: rgba(96, 165, 250, 0.2);
  --tbl-cell-selected-outline: 2px solid rgba(96, 165, 250, 0.8);
  --tbl-border: rgba(255,255,255,.08);
  --tbl-text: rgba(255,255,255,.92);
  --tbl-text-muted: rgba(255,255,255,.65);
  background: rgb(18 32 66 / 0.71);
}

/* Стили для скролла внутри этого конкретного контейнера */
.${prefix}-scroll::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

.${prefix}-scroll::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
}

.${prefix}-scroll::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
}

.${prefix}-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
}

.${prefix}-table {
  color: var(--tbl-text);
  font-size: 14px;
}
.${prefix}-thead .${prefix}-tr-head {
  background: var(--tbl-head-bg);
  color: var(--tbl-text);
}
.${prefix}-tbody .${prefix}-tr {
  background: var(--tbl-row-bg);
  transition: background .15s ease;
}
${stripedRows ? `.${prefix}-tbody .${prefix}-tr.${prefix}-tr-odd {
  background: color-mix(in srgb, var(--tbl-row-bg) 95%, white);
}` : ''}
.${prefix}-row-clickable {
  cursor: pointer;
}
${hoverRows ? `.${prefix}-tbody .${prefix}-row-clickable:hover {
  background: color-mix(in srgb, var(--tbl-row-bg) 88%, white) !important;
}` : ''}
.${prefix}-tbody .${prefix}-tr.${prefix}-tr-selected,
.${prefix}-tbody .${prefix}-tr.${prefix}-tr-selected.${prefix}-tr-odd {
  background: #555a89 !important;
}
.${prefix}-td.${prefix}-td-selected {
  background: var(--tbl-cell-selected-bg) !important;
  outline: var(--tbl-cell-selected-outline);
  outline-offset: -2px;
  z-index: 1;
  position: relative;
}
.${prefix}-th, .${prefix}-td {
  overflow: hidden;
  text-overflow: ellipsis;
}

.${prefix}-th {
  border: var(--tbl-border-th-width, 1px) var(--tbl-border-th-style, solid) var(--tbl-border-th, var(--tbl-border));
}

.${prefix}-td {
  border: var(--tbl-border-td-width, 1px) var(--tbl-border-td-style, solid) var(--tbl-border-td, var(--tbl-border));
}

/* Управление сторонами бордера (по умолчанию — со всех сторон) */
.${prefix}-wrap.${prefix}-th-border-none .${prefix}-th { border: none; }
.${prefix}-wrap.${prefix}-th-border-bottom .${prefix}-th {
  border: none;
  border-bottom: var(--tbl-border-th-width, 1px) var(--tbl-border-th-style, solid) var(--tbl-border-th, var(--tbl-border));
}
.${prefix}-wrap.${prefix}-th-border-top .${prefix}-th {
  border: none;
  border-top: var(--tbl-border-th-width, 1px) var(--tbl-border-th-style, solid) var(--tbl-border-th, var(--tbl-border));
}
.${prefix}-wrap.${prefix}-th-border-left .${prefix}-th {
  border: none;
  border-left: var(--tbl-border-th-width, 1px) var(--tbl-border-th-style, solid) var(--tbl-border-th, var(--tbl-border));
}
.${prefix}-wrap.${prefix}-th-border-right .${prefix}-th {
  border: none;
  border-right: var(--tbl-border-th-width, 1px) var(--tbl-border-th-style, solid) var(--tbl-border-th, var(--tbl-border));
}
.${prefix}-wrap.${prefix}-th-border-x .${prefix}-th {
  border: none;
  border-left: var(--tbl-border-th-width, 1px) var(--tbl-border-th-style, solid) var(--tbl-border-th, var(--tbl-border));
  border-right: var(--tbl-border-th-width, 1px) var(--tbl-border-th-style, solid) var(--tbl-border-th, var(--tbl-border));
}
.${prefix}-wrap.${prefix}-th-border-y .${prefix}-th {
  border: none;
  border-top: var(--tbl-border-th-width, 1px) var(--tbl-border-th-style, solid) var(--tbl-border-th, var(--tbl-border));
  border-bottom: var(--tbl-border-th-width, 1px) var(--tbl-border-th-style, solid) var(--tbl-border-th, var(--tbl-border));
}

.${prefix}-wrap.${prefix}-td-border-none .${prefix}-td { border: none; }
.${prefix}-wrap.${prefix}-td-border-bottom .${prefix}-td {
  border: none;
  border-bottom: var(--tbl-border-td-width, 1px) var(--tbl-border-td-style, solid) var(--tbl-border-td, var(--tbl-border));
}
.${prefix}-wrap.${prefix}-td-border-top .${prefix}-td {
  border: none;
  border-top: var(--tbl-border-td-width, 1px) var(--tbl-border-td-style, solid) var(--tbl-border-td, var(--tbl-border));
}
.${prefix}-wrap.${prefix}-td-border-left .${prefix}-td {
  border: none;
  border-left: var(--tbl-border-td-width, 1px) var(--tbl-border-td-style, solid) var(--tbl-border-td, var(--tbl-border));
}
.${prefix}-wrap.${prefix}-td-border-right .${prefix}-td {
  border: none;
  border-right: var(--tbl-border-td-width, 1px) var(--tbl-border-td-style, solid) var(--tbl-border-td, var(--tbl-border));
}
.${prefix}-wrap.${prefix}-td-border-x .${prefix}-td {
  border: none;
  border-left: var(--tbl-border-td-width, 1px) var(--tbl-border-td-style, solid) var(--tbl-border-td, var(--tbl-border));
  border-right: var(--tbl-border-td-width, 1px) var(--tbl-border-td-style, solid) var(--tbl-border-td, var(--tbl-border));
}
.${prefix}-wrap.${prefix}-td-border-y .${prefix}-td {
  border: none;
  border-top: var(--tbl-border-td-width, 1px) var(--tbl-border-td-style, solid) var(--tbl-border-td, var(--tbl-border));
  border-bottom: var(--tbl-border-td-width, 1px) var(--tbl-border-td-style, solid) var(--tbl-border-td, var(--tbl-border));
}
.${prefix}-td {
  color: var(--tbl-text-muted);
}
@media (prefers-reduced-motion: reduce) {
  .${prefix}-tbody .${prefix}-tr { transition: none; }
}
/* Закреплённые столбцы: фон, чтобы при прокрутке контент не просвечивал */
.${prefix}-th.${prefix}-pin, .${prefix}-td.${prefix}-pin {
  background: inherit;
}
`;
}

/**
 * После рендера вычисляет left для sticky-колонок и подставляет фон, чтобы закреплённые ячейки не просвечивали.
 * @param {HTMLElement} wrapEl - обёртка таблицы (#tbl-wrap-*)
 * @param {string} prefix - класс-префикс
 * @param {number} pinCount - количество закреплённых столбцов
 */
function applyPinnedColumnsLayout(wrapEl, prefix, pinCount) {
    const table = wrapEl.querySelector(`.${prefix}-table`);
    if (!table) return;
    const thead = table.querySelector(`.${prefix}-thead`);
    const tbody = table.querySelector(`.${prefix}-tbody`);
    if (!thead || !tbody) return;

    const headerRow = thead.querySelector('tr');
    if (!headerRow) return;
    const ths = headerRow.querySelectorAll(`.${prefix}-th.${prefix}-pin`);
    if (ths.length === 0) return;

    const lefts = [];
    let cumulative = 0;
    for (let i = 0; i < ths.length; i++) {
        lefts.push(cumulative);
        cumulative += ths[i].offsetWidth;
    }

    const headBg = getComputedStyle(ths[0]).backgroundColor;

    for (let i = 0; i < ths.length; i++) {
        ths[i].style.left = `${lefts[i]}px`;
        ths[i].style.backgroundColor = headBg;
        if (i === ths.length - 1) ths[i].style.boxShadow = '2px 0 6px rgba(0,0,0,0.15)';
    }

    const rows = tbody.querySelectorAll(`.${prefix}-tr`);
    rows.forEach((tr, rowIndex) => {
        const cells = tr.querySelectorAll(`.${prefix}-td.${prefix}-pin`);
        cells.forEach((td, colIndex) => {
            td.style.left = `${lefts[colIndex]}px`;
            const bg = getComputedStyle(td).backgroundColor;
            td.style.backgroundColor = bg;
            if (colIndex === cells.length - 1) td.style.boxShadow = '2px 0 6px rgba(0,0,0,0.15)';
        });
    });
}

/**
 * Инициализирует виртуализацию: при скролле подставляет в tbody только видимые строки.
 */
function initVirtualizedScroll(wrapEl, tableId, prefix, data, columns, cfg) {
    const scrollEl = wrapEl.querySelector(`.${prefix}-scroll`);
    const tbody = wrapEl.querySelector(`.${prefix}-tbody`);
    if (!scrollEl || !tbody) return;

    const rowHeight = Math.max(1, parseInt(cfg.virtualizedRowHeight, 10) || 44);
    const overscan = Math.max(0, parseInt(cfg.virtualizedOverscan, 10) || 8);
    const total = data.length;
    const pinCount = Math.min(Math.max(0, parseInt(cfg.pinnedColumns, 10) || 0), columns.length);

    let lastStart = 0;
    let lastEnd = Math.min(total, Math.max(20, overscan * 3));
    let rafId = null;

    function updateVisibleWindow() {
        const scrollTop = scrollEl.scrollTop;
        const clientHeight = scrollEl.clientHeight;
        const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
        const endIndex = Math.min(total, Math.ceil((scrollTop + clientHeight) / rowHeight) + overscan);

        if (startIndex === lastStart && endIndex === lastEnd) return;

        lastStart = startIndex;
        lastEnd = endIndex;

        const topSpacer = buildSpacerRow(prefix, columns.length, startIndex * rowHeight);
        const slice = data.slice(startIndex, endIndex);
        const visibleRows = slice.map((row, i) => buildSingleRow(prefix, columns, cfg, row, startIndex + i, rowHeight)).join('');
        const bottomSpacer = buildSpacerRow(prefix, columns.length, (total - endIndex) * rowHeight);

        tbody.innerHTML = topSpacer + visibleRows + bottomSpacer;

        if (pinCount > 0) applyPinnedColumnsLayout(wrapEl, prefix, pinCount);
    }

    function onScroll() {
        if (rafId != null) return;
        rafId = requestAnimationFrame(() => {
            rafId = null;
            updateVisibleWindow();
        });
    }

    scrollEl.addEventListener('scroll', onScroll, { passive: true });
    // На случай изменения размера контейнера
    const ro = typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => onScroll())
        : null;
    if (ro) ro.observe(scrollEl);
    // Синхронизировать окно с текущим видимым участком (на случай если контейнер уже с прокруткой)
    updateVisibleWindow();
}

function initTableEvents(wrapEl, tableId, prefix, data, cfg) {
    const tbody = wrapEl.querySelector(`.${prefix}-tbody`);
    if (!tbody || (!cfg.onRowClick && !cfg.onCellClick)) return;

    tbody.addEventListener('click', (e) => {
        const tr = e.target.closest(`.${prefix}-tr`);
        if (!tr || tr.classList.contains(`${prefix}-tr-head`)) return;
        const rowIndex = parseInt(tr.getAttribute('data-row-index'), 10);
        if (rowIndex < 0 || rowIndex >= data.length) return;
        const row = data[rowIndex];

        const td = e.target.closest(`.${prefix}-td`);
        const hasCellClick = typeof cfg.onCellClick === 'function';
        const hasRowClick = typeof cfg.onRowClick === 'function';

        if (td && hasCellClick) {
            const cellKey = td.getAttribute('data-col') || '';
            const value = row[cellKey];
            const handled = cfg.onCellClick(row, cellKey, value, rowIndex);
            if (handled) {
                tbody.querySelectorAll(`.${prefix}-tr.${prefix}-tr-selected`).forEach((r) => r.classList.remove(`${prefix}-tr-selected`));
                tr.classList.add(`${prefix}-tr-selected`);
                tbody.querySelectorAll(`.${prefix}-td.${prefix}-td-selected`).forEach((c) => c.classList.remove(`${prefix}-td-selected`));
                td.classList.add(`${prefix}-td-selected`);
            } else {
                tbody.querySelectorAll(`.${prefix}-tr.${prefix}-tr-selected`).forEach((r) => r.classList.remove(`${prefix}-tr-selected`));
                tbody.querySelectorAll(`.${prefix}-td.${prefix}-td-selected`).forEach((c) => c.classList.remove(`${prefix}-td-selected`));
            }
            if (hasRowClick && handled) cfg.onRowClick(row, rowIndex);
        } else {
            tbody.querySelectorAll(`.${prefix}-td.${prefix}-td-selected`).forEach((c) => c.classList.remove(`${prefix}-td-selected`));
            if (hasRowClick) {
                tbody.querySelectorAll(`.${prefix}-tr.${prefix}-tr-selected`).forEach((r) => r.classList.remove(`${prefix}-tr-selected`));
                tr.classList.add(`${prefix}-tr-selected`);
                cfg.onRowClick(row, rowIndex);
            } else {
                tbody.querySelectorAll(`.${prefix}-tr.${prefix}-tr-selected`).forEach((r) => r.classList.remove(`${prefix}-tr-selected`));
            }
        }
    });
}
// [EOF]: ./Table.js
;
// [EOF]: ./components/table/index.js
;


// [06:20:07] LOAD: ./api/indexVisi.js
// [06:20:07] LOAD: ./visiology/getMetricsMono
/**
 * Получает метрики мониторинга из одной рабочей области (в которой находится)
 * 
 * Функция выполняет сбор и агрегацию данных из различных эндпоинтов одной API для одной рабочей области :
 * 1. Получает данные шедулеров (расписаний)
 * 2. Получает данные дашбордов
 * 3. Обогащает данные шедулеров дополнительной информацией
 * 4. Группирует датасеты для удобного использования
 * 5. Проверяет неактивные шедулеры
 * 
 * @async
 * @function getMetricsMono
 * @returns {Promise<Object>} Объект с агрегированными данными метрик, содержащий:
 * @property {Array} dataShedulers - Обогащенные данные шедулеров
 * @property {Array} dataDashboards - Данные дашбордов
 * @property {Array} dataAll - Сгруппированные датасеты
 * @property {Array} deadshedulers - Список неактивных шедулеров
 * 
 * @throws {Error} Если произошла ошибка при выполнении HTTP-запросов
 * @example
 * try {
 *   const metrics = await getMetricsMono();
 *   console.log(metrics.dataAll);
 * } catch (error) {
 *   console.error('Ошибка получения метрик:', error);
 * }
 */


// [06:20:07] LOAD: ../utils/getAccessToken
/**
 * Извлекает access token из sessionStorage по указанному ключу
 * 
 * Функция безопасно получает JWT токен доступа из хранилища браузера.
 * Токен используется для аутентификации запросов к защищенным API эндпоинтам.
 * 
 * @function getAccessToken
 * @param {string} p - Ключ для поиска данных в sessionStorage
 * @returns {string|null} Access token или null, если:
 *                        1. Токен не найден
 *                        2. Произошла ошибка парсинга
 *                        3. Структура данных не соответствует ожидаемой
 * 
 * @throws Не выбрасывает исключения наружу, ошибки обрабатываются внутри
 * @sideeffect Выводит ошибки в консоль при проблемах с доступом или парсингомв
 * 
 * @example
 * // sessionStorage содержит: { "user_session": "{\"access_token\":\"eyJhbGciOiJ...\"}" }
 * const token = getAccessToken('user_session');
 * // token = "eyJhbGciOiJ..."
 * 
 * @example
 * // Если ключ не существует или данные некорректны
 * const token = getAccessToken('non_existent_key');
 * // token = null
 * // В консоли: "Ошибка при получении токена: ..."
 * 
 * @note
 * - Использует sessionStorage (данные очищаются при закрытии вкладки)
 * - Ожидает данные в формате JSON с полем access_token
 * - НЕ валидирует срок действия токена
 * - НЕ проверяет структуру токена (JWT)
 * 
 * @security
 * - Не хранит токен в глобальных переменных
 * - Использует безопасный парсинг JSON с try/catch
 * - Ограничивает область видимости токена сессией браузера
 * - Не логирует сам токен (только ошибки доступа)
 */
function getAccessToken(p) {
    try {
        // Временные логи для отладки (раскомментировать при необходимости)
        // console.log(p, 'наш keypath');
        // console.log(sessionStorage, 'наш sessionStorage');
        
        // Получаем строку данных из sessionStorage по ключу
        const userData = sessionStorage.getItem(p);

        // Проверяем наличие данных и парсим JSON
        // Используем тернарный оператор для краткости
        return userData 
            ? JSON.parse(userData).access_token // Извлекаем access_token из распарсенного объекта
            : null; // Возвращаем null если данных нет
        
    } catch (error) {
        // Логируем ошибку для диагностики, но не прерываем выполнение программы
        // Типичные ошибки:
        // 1. SyntaxError: Некорректный JSON в sessionStorage
        // 2. TypeError: Отсутствует поле access_token после парсинга
        // 3. SecurityError: Доступ к sessionStorage заблокирован (например, в iframe)
        console.log('Ошибка при получении токена:', error);
        
        // fallback
        return null;
    }
}

;
// [EOF]: ../utils/getAccessToken
;

// [06:20:07] LOAD: ../utils/getMonoPath
/**
 * Формирует URL-адреса для доступа к API на основе текущего домена и workspaceId
 * 
 * Функция анализирует текущий URL страницы, извлекает домен и workspaceId из query-параметров,
 * затем формирует полные пути к различным эндпоинтам API системы мониторинга.
 * 
 * @function getMonoPath
 * @returns {Object} Объект с полными URL для доступа к API
 * @returns {string} returns.shedulersLink - URL для получения данных шедулеров
 * @returns {string} returns.dashesLink - URL для получения данных дашбордов
 * @returns {string} returns.moreInfoLink - URL для получения детальной информации о датасетах
 * @returns {string} returns.workspaceAllLink - URL для получения информации о рабочих пространствах
 * @returns {string} returns.keyPath - Ключ для доступа к данным авторизации в sessionStorage
 * 
 * @example
 * // При URL: https://monitoring.example.com/app?workspaceId=12345&view=dashboard
 * const paths = getMonoPath();
 * // paths.shedulersLink = 'https://visiology/data-management-service/api/v1/workspaces/12345/scheduled-refresh/GetAll'
 * // paths.keyPath = 'oidc.user:https://visiology/keycloak/realms/Visiology:visiology_designer'
 * 
 * @dependency
 * - Требует наличия workspaceId в query-параметрах URL
 * - Зависит от стандартного API браузера (window.location, URL)
 * 
 * @note
 * - workspaceId должен присутствовать в URL как параметр запроса
 * - Все сгенерированные URL используют HTTPS протокол
 * - Домен берется из текущего окна браузера
 * - В случае отсутствия workspaceId, в URL будет подставлено значение "undefined"
 * 
 * @log
 * - Выводит в консоль найденный workspaceId или сообщение об его отсутствии
 * - Предназначено для отладки, в production может быть отключено
 * 
 * @security
 * - Использует только HTTPS протокол
 * - Не передает чувствительные данные в URL
 * - Ключ для sessionStorage формируется на основе домена
 */
function getMonoPath() {
    // Получаем текущий URL страницы для анализа
    let mainHref = window.location.href;
    let url = new URL(mainHref);
    // Извлекаем доменное имя (без протокола и порта)
    let domain = url.hostname;
    
    // Разбиваем URL на части по амперсанду для поиска query-параметров
    // Это альтернатива использованию url.searchParams, оставлена для совместимости
    let paramsArray = mainHref.split('&');
    
    // Ищем параметр workspaceId среди всех query-параметров
    let workspaceId = paramsArray.find(param => param.includes('workspaceId='));
    
    if (workspaceId) {
        // Извлекаем значение параметра (часть после '=')
        // Пример: "workspaceId=12345" -> "12345"
        workspaceId = workspaceId.split('=')[1];
        
        // Логирование для отладки
        // console.log('Найден workspaceId:', workspaceId);
    } else {
        // Предупреждение о потенциальной проблеме конфигурации
        console.log('workspaceId не найден');
        // workspaceId останется undefined, что приведет к некорректным URL
    }
    
    const shedulersLink = 'https://' + domain + 
        '/data-management-service/api/v1/workspaces/' + workspaceId + 
        '/scheduled-refresh/GetAll';
    
    const dashesLink = 'https://' + domain + 
        '/dashboard-service/api/workspaces/' + workspaceId + 
        '/dashboards';
    
    const moreInfoLink = 'https://' + domain + 
        '/formula-engine/api/v1/workspaces/' + workspaceId + 
        '/datasets/';
    
    const workspaceAllLink = 'https://' + domain + 
        '/workspace-service/api/v1/evaluate-workspaces-with-role';
    
    const keyPath = 'oidc.user:https://' + domain + 
        '/keycloak/realms/Visiology:visiology_designer';
    
    // Собираем все сгенерированные пути в единый объект
    const path = {
        shedulersLink,    // API шедулеров
        dashesLink,       // API дашбордов
        moreInfoLink,     // API детальной информации
        workspaceAllLink, // API рабочих пространств
        keyPath          // Ключ для токена
    };
    
    return path;
}

;
// [EOF]: ../utils/getMonoPath
;

// [06:20:07] LOAD: ../utils/groupDatasets
/**
 * Группирует шедулеры с привязанными к ним дашбордами
 * Создает структуру "один шедулер → множество дашбордов" для удобства анализа
 * 
 * @function groupDatasets
 * @param {Object[]} shedulersWithMoreInfo - Массив объектов шедулеров
 * @param {string} shedulersWithMoreInfo[].id - Уникальный идентификатор шедулера
 * @param {Object[]} dataDashboards - Массив объектов дашбордов
 * @param {Object} [dataDashboards[].dataset] - Опциональный объект датасета
 * @param {string} [dataDashboards[].dataset.datasetId] - ID связанного шедулера
 * @returns {Object[]} Массив объектов сгруппированных данных
 * @returns {Object} returns[].sheduler - Исходный объект шедулера
 * @returns {Object[]} returns[].dashboards - Массив связанных дашбордов
 * @returns {number} returns[].dashboardCount - Количество связанных дашбордов
 * 
 * @example
 * // Шедулер с двумя дашбордами
 * const sheduler = { id: 's1', name: 'Daily Sync' };
 * const dashboards = [
 *   { id: 'd1', dataset: { datasetId: 's1' } },
 *   { id: 'd2', dataset: { datasetId: 's1' } }
 * ];
 * const result = groupDatasets([sheduler], dashboards);
 * // result[0].dashboardCount === 2
 * 
 * @example
 * // Шедулер без дашбордов
 * const result = groupDatasets([{ id: 's2' }], []);
 * // result[0].dashboards === []
 * // result[0].dashboardCount === 0
 * 
 * @complexity O(n*m) где n - количество шедулеров, m - количество дашбордов
 * @performance Используйте с осторожностью при больших объемах данных (>1000 элементов)
 * @sideeffect Чистая функция, не изменяет входные данные
 */
function groupDatasets(shedulersWithMoreInfo, dataDashboards) {
    // Раскомментировать для отладки
    // console.log('Шедулеры:', shedulersWithMoreInfo);
    // console.log('Дашборды:', dataDashboards);
    
    return shedulersWithMoreInfo.map(sheduler => {
        // Находим все дашборды, ссылающиеся на текущий шедулер
        const relatedDashboards = dataDashboards.filter(dashboard => 
            dashboard.dataset?.datasetId === sheduler.id
        );

        return {
            sheduler,                    // Исходный шедулер
            dashboards: relatedDashboards, // Привязанные дашборды
            dashboardCount: relatedDashboards.length // Количество для быстрого доступа
        };
    });
}

;
// [EOF]: ../utils/groupDatasets
;

// [06:20:07] LOAD: ../utils/checkDeadShedulers
/**
 * Проверяет и идентифицирует "мертвые" шедулеры (неработающие планировщики)
 * 
 * "Мертвым" считается шедулер, который:
 * 1. Имеет статус включенного (isEnabled === true)
 * 2. Не имеет связанного дашборда в системе мониторинга
 * 
 * Такая ситуация может возникать, когда:
 * - Шедулер был создан, но не настроен для отображения метрик
 * - Дашборд был удален, а шедулер остался активным
 * - Возникли проблемы с привязкой датасетов
 * 
 * @function checkerDeadshedulers
 * @param {Array} shedulersWithMoreInfo - Массив обогащенных данных шедулеров
 * @param {Object[]} shedulersWithMoreInfo[].id - Уникальный идентификатор шедулера
 * @param {boolean} shedulersWithMoreInfo[].isEnabled - Статус активности шедулера
 * @param {Object} dataDashboards - Данные дашбордов из системы мониторинга
 * @param {Object} dataDashboards.dataset - Объект датасета дашборда
 * @param {string} dataDashboards.dataset.datasetId - ID связанного шедулера
 * @returns {Object} Объект, содержащий массив "мертвых" шедулеров
 * @returns {Array} returns.deadshedulers - Отфильтрованный массив шедулеров, соответствующих критериям
 * 
 * @example
 * const result = checkerDeadshedulers(
 *   [
 *     { id: 'scheduler-1', isEnabled: true, name: 'Daily Report' },
 *     { id: 'scheduler-2', isEnabled: false, name: 'Weekly Backup' }
 *   ],
 *   [
 *     { dataset: { datasetId: 'scheduler-2' } }
 *   ]
 * );
 * // result.deadshedulers = [{ id: 'scheduler-1', isEnabled: true, name: 'Daily Report' }]
 * 
 * @complexity
 * Временная сложность: O(n*m), где:
 * n - количество шедулеров
 * m - количество дашбордов
 * 
 * Пространственная сложность: O(k), где k - количество "мертвых" шедулеров
 */
function checkerDeadshedulers(shedulersWithMoreInfo, dataDashboards) {
    const deadshedulers = shedulersWithMoreInfo.filter(sheduler => {
        // Условие 1: Шедулер должен быть включен
        const isShedulerEnabled = sheduler.isEnabled === true;
        
        // Условие 2: Не должно быть связанного дашборда
        // Проверяем, существует ли хотя бы один дашборд, ссылающийся на этот шедулер
        const hasLinkedDashboard = dataDashboards.some(dashboard => {
            return dashboard.dataset?.datasetId === sheduler.id;
        });
        
        // Шедулер считается "мертвым", если он включен И не имеет связанного дашборда
        return isShedulerEnabled && !hasLinkedDashboard;
    });

    // Возвращаем результат в структурированном формате
    return {
        deadshedulers
    };
}

;
// [EOF]: ../utils/checkDeadShedulers
;

// [06:20:07] LOAD: ../utils/getShedulersMore
/**
 * Обогащает данные шедулеров дополнительной информацией из API
 * 
 * Функция последовательно запрашивает детальную информацию для каждого шедулера,
 * добавляя поля name, modifiedTime и modifiedBy. Для исключения перегрузки API
 * добавляет задержки между запросами.
 * 
 * @async
 * @function getShedulersMore
 * @param {string} accessToken - JWT токен для авторизации запросов к API
 * @param {Array} dataShedulers - Массив шедулеров для обогащения
 * @param {Object} dataShedulers[] - Объект шедулера
 * @param {string} dataShedulers[].id - Уникальный идентификатор шедулера
 * @param {boolean} dataShedulers[].isEnabled - Флаг активности шедулера
 * @param {string} [moreInfoLink] - Базовый URL для запросов детальной информации. Если не передан — будет получен через getMonoPath().
 * 
 * @returns {Promise<Array>} Массив обогащенных данных шедулеров с дополнительными полями:
 * @returns {Object} returns[] - Обогащенный объект шедулера
 * @returns {string|null} returns[].name - Название шедулера
 * @returns {string|null} returns[].modifiedTime - Время последнего изменения
 * @returns {string|null} returns[].modifiedBy - Идентификатор пользователя, внесшего изменения
 * 
 * @throws Не выбрасывает исключения наружу, ошибки обрабатываются внутри и логируются
 * 
 * @example
 * const accessToken = 'eyJhbGciOiJ...';
 * const sheddulers = [{ id: 'sched-1', isEnabled: true }];
 * const enriched = await getShedulersMore(accessToken, sheddulers);
 * // enriched = [{ id: 'sched-1', isEnabled: true, name: 'Daily Report', ... }]
 * 
 * @algorithm
 * 1. Инициализация результирующего массива
 * 2. Последовательная обработка каждого шедулера:
 *    a. Пропуск запроса для отключенных шедулеров
 *    b. Добавление задержки между запросами (кроме первого)
 *    c. Выполнение запроса к API
 *    d. Обработка успешного ответа
 *    e. Обработка ошибок и HTTP ошибок
 * 3. Возврат обогащенных данных
 * 
 * @performance
 * - Линейная сложность O(n), где n - количество шедулеров
 * - Общее время выполнения ≈ (n-1) * 20ms + n * время_запроса
 * - Использует rate limiting (задержки) для защиты API
 * 
 * @errorHandling
 * - Для отключенных шедулеров сразу возвращает null значения
 * - При HTTP ошибках возвращает null значения и логирует предупреждение
 * - При сетевых ошибках возвращает null значения и логирует ошибку
 * - Не прерывает выполнение при ошибках отдельных шедулеров
 */
// [06:20:07] SKIP (already loaded): ./getMonoPath.js
;

async function getShedulersMore(accessToken, dataShedulers, moreInfoLink) {
    // Совместимость с бандлом: в dist/prxz.min.js moreInfoLink "приходит" из внешнего скоупа.
    // В исходниках делаем этот параметр опциональным и можем вычислить его на основе текущего URL.
    if (moreInfoLink == null || moreInfoLink === '') {
        try {
            moreInfoLink = getMonoPath().moreInfoLink;
        } catch (_) {
            // noop
        }
    }

    if (moreInfoLink == null || moreInfoLink === '') {
        throw new Error('getShedulersMore: moreInfoLink is required');
    }

    // Инициализация массива для хранения обогащенных данных
    const shedulersWithMoreInfo = [];
    
    // Временные логи для отладки (раскомментировать при необходимости)
    // console.log('Внутри getShedulersMore');
    // console.log(dataShedulers, 'dataShedulers');
    
    // Последовательно обрабатываем каждый шедулер
    for (let i = 0; i < dataShedulers.length; i++) {
        const sheduler = dataShedulers[i];
        
        try {
            // Обработка отключенных шедулеров - пропускаем запрос к API
            if (!sheduler.isEnabled) {
                shedulersWithMoreInfo.push({
                    ...sheduler, // Копируем все существующие поля
                    name: null,        // Дополнительные поля заполняем null
                    modifiedTime: null, 
                    modifiedBy: null
                });
                continue; // Переходим к следующему шедулеру
            }

            // Rate limiting: добавляем задержку между запросами, начиная со второго
            // Защищает API от перегрузки и соблюдает ограничения rate limit
            if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 20)); // 20ms задержка
            }

            // Выполняем запрос к API для получения детальной информации
            const moreInfoResponse = await fetch(`${moreInfoLink}${sheduler.id}/model`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            // Обработка успешного ответа
            if (moreInfoResponse.ok) {
                const moreInfoData = await moreInfoResponse.json();
                
                // Добавляем обогащенный шедулер в результат
                shedulersWithMoreInfo.push({
                    ...sheduler, // Сохраняем оригинальные данные
                    name: moreInfoData.name || null,             // Название из API или null
                    modifiedTime: moreInfoData.modifiedTime || null, // Время изменения
                    modifiedBy: moreInfoData.modifiedBy || null     // Автор изменений
                });
            } else {
                // Обработка HTTP ошибок (4xx, 5xx)
                console.warn(`Не удалось получить дополнительную информацию для шедулера ${sheduler.id}`);
                
                // Добавляем шедулер с null значениями при ошибке API
                shedulersWithMoreInfo.push({
                    ...sheduler,
                    name: null,
                    modifiedTime: null,
                    modifiedBy: null
                });
            }
        } catch (error) {
            // Обработка сетевых ошибок и исключений
            console.error(`Ошибка при получении информации для шедулера ${sheduler.id}:`, error);
            
            // Добавляем шедулер с null значениями при любой ошибке
            shedulersWithMoreInfo.push({
                ...sheduler,
                name: null,
                modifiedTime: null,
                modifiedBy: null
            });
        }
    }

    return shedulersWithMoreInfo;
}

;
// [EOF]: ../utils/getShedulersMore
;

async function getMetricsMono() {
    // Получение конфигурационных путей для работы с Mono API
    const path = getMonoPath();
    const { shedulersLink, dashesLink, moreInfoLink, keyPath } = path;
    
    // Получение токена доступа для аутентификации
    const token = getAccessToken(keyPath);
    
    // Параллельное выполнение запросов для оптимизации времени выполнения
    // Используем Promise.all для одновременного получения данных шедулеров и дашбордов
    const [responseShedulers, responseDashboards, responseMetrics] = await Promise.all([
        // Запрос данных шедулеров (расписаний)
        fetch(shedulersLink, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }).then(response => {
            // Валидация ответа сервера
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, name: responseShedulers`);
            }
            return response;
        }),
        
        // Запрос данных дашбордов
        fetch(dashesLink, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }).then(response => {
            // Валидация ответа сервера
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, name: responseDashboards`);
            }
            return response;
        }),
        // Примечание: responseMetrics в текущей реализации всегда null,
        // так как соответствующий fetch запрос отсутствует
        // Это может быть задел на будущую функциональность
    ]);

    // Параллельный парсинг JSON ответов
    const [dataShedulers, dataDashboards] = await Promise.all([
        responseShedulers.json(),
        responseDashboards.json(),
        // responseMetrics всегда null в текущей реализации
        responseMetrics ? responseMetrics.json() : Promise.resolve(null)
    ]);

    // Обогащение данных шедулеров дополнительной информацией
    // Это позволяет получить более полную картину о каждом шедулере
    const shedulersWithMoreInfo = await getShedulersMore(token, dataShedulers, moreInfoLink);

    // Группировка датасетов для структурированного представления данных
    // Объединяет данные шедулеров и дашбордов в логические группы
    const groupedData = groupDatasets(shedulersWithMoreInfo, dataDashboards);
    
    // Проверка шедулеров на активность
    // Выявляет неработающие или "мертвые" шедулеры для дальнейшего анализа
    const deadshedulers = checkerDeadshedulers(shedulersWithMoreInfo, dataDashboards);

    // Формирование финального объекта с агрегированными данными
    const dataset = {
        // Обогащенные данные шедулеров
        dataShedulers: shedulersWithMoreInfo,
        // Данные дашбордов
        dataDashboards: dataDashboards,
        // Сгруппированные данные для удобного анализа
        dataAll: groupedData,
        // Список неактивных шедулеров для мониторинга проблем
        deadshedulers: deadshedulers
    };

    return dataset;
}

;
// [EOF]: ./visiology/getMetricsMono

// [06:20:07] SKIP (already loaded): ./utils/getAccessToken

// [06:20:07] SKIP (already loaded): ./utils/getShedulersMore

// [06:20:07] SKIP (already loaded): ./utils/groupDatasets


const visi = {
    final: {
        getMetricsMono
    }, 
    methods: {
        getAccessToken,
        getShedulersMore,
        groupDatasets
    }
};

visi
// [EOF]: ./api/indexVisi.js
;

const prxz = {
    version: '1.0.1',
    api: {
        visi,
    },
    lg: Logger,
    frm: {
        v: FormatValue,
        d: FormatDate,
    },
    func: {
        other: {
            FilterReplaceText,
            genId
        },
    },
    comp: {
        table: {
            render: renderTable,
        },
        slider: {
            render: renderSlider,
        },
    },
};


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
    
    })();