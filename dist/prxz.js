// prxz.js - Библиотека форматирования данных
    // Версия 1.0.1 | 2026-03-04T11:01:03.140Z
    // MIT License | Compiled by Bundler
    // Author: mizuki666
    // Repository: https://github.com/mizuki666/prxz
    // Build ID: 19cb8822602
    // =============================================

(function() {
        'use strict';


// [11:01:03] LOAD: ./utils/formatValue.js
// [11:01:03] LOAD: ./helpers/values/validators.js
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

// [11:01:03] LOAD: ./helpers/values/parsers.js
// parsers.js
const Parsers = {

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
// [EOF]: ./helpers/values/parsers.js
;

// [11:01:03] LOAD: ./helpers/values/formatters.js
// formatters.js
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

// [11:01:03] LOAD: ./utils/formatDate.js
// [11:01:03] LOAD: ./helpers/date/parse-date.js
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

// [11:01:03] LOAD: ./helpers/date/convert-time.js
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

// [11:01:03] LOAD: ./helpers/date/localization.js
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

// [11:01:03] LOAD: ./helpers/date/apply-format.js
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

// [11:01:03] LOAD: ./components/log/Logger.js
// [11:01:03] LOAD: ./LoggerStyle.js
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

// [11:01:03] LOAD: ./utils/filterText.js
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

// [11:01:03] LOAD: ./components/slider/Slider.js
// [11:01:03] LOAD: ../../utils/genId.js
function genId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
// [EOF]: ../../utils/genId.js
;

const EASE = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
const SVG_PREV = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
const SVG_NEXT = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
const SVG_CLOSE = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>';

/**
 * Рендер слайдера в контейнер.
 * @param {string|HTMLElement} container - id элемента или сам DOM-элемент
 * @param {string[]} imageUrls - массив URL изображений
 * @param {{ ease?: string }} [options] - опции (ease для анимации)
 */
function renderSlider(container, imageUrls, options = {}) {
    const dataset = Array.isArray(imageUrls) ? imageUrls : [];
    const ease = options.ease || EASE;
    const sldID = genId();

    const el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) return;

    const html = buildSliderHTML(sldID, dataset, ease);
    el.innerHTML = html;
    initSlider(sldID, dataset, ease);
}

function buildSliderHTML(sldID, dataset, ease) {
    let slides = '';
    if (dataset.length > 0) {
        slides += `<div class="slide"><img src="${dataset[dataset.length - 1]}" alt=""></div>`;
    }
    dataset.forEach((img, i) => {
        slides += `<div class="slide"><img src="${img}" alt="slide ${i + 1}" class="sld-img" data-src="${img}"></div>`;
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
    <style>${sliderStyle(sldID, ease)}</style>`;
}

function sliderStyle(id, ease) {
    const s = `#sld-${id}`;
    return `
${s}{--sld-radius:16px;--sld-edge:rgba(255,255,255,.10);--sld-shadow:0 18px 60px rgba(0,0,0,.20);--sld-shadow2:0 10px 30px rgba(0,0,0,.16);--sld-ui-bg:rgba(18,18,20,.55);--sld-ui-bg2:rgba(255,255,255,.10);--sld-ui-stroke:rgba(255,255,255,.16);--sld-ui-text:#fff;--sld-ease:${ease};position:relative;width:100%;height:100%;overflow:hidden;border-radius:var(--sld-radius);background:radial-gradient(120% 120% at 10% 0%, rgba(255,255,255,.08), transparent 60%),linear-gradient(180deg, rgba(10,10,12,1), rgba(10,10,12,1));box-shadow:var(--sld-shadow);isolation:isolate}
${s}:before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(120% 90% at 50% 10%, rgba(0,0,0,.10), transparent 55%),linear-gradient(180deg, rgba(0,0,0,.10), rgba(0,0,0,.35));mix-blend-mode:multiply;opacity:.85;z-index:2}
${s}:after{content:"";position:absolute;inset:-1px;pointer-events:none;border-radius:calc(var(--sld-radius) + 1px);border:1px solid var(--sld-edge);opacity:.9;z-index:3}
${s} .sld-track{display:flex;transition:transform .7s var(--sld-ease);height:100%;flex-shrink:0;will-change:transform;position:relative;z-index:1}
${s} .slide{flex-shrink:0;min-width:0;height:100%;display:flex;align-items:stretch;justify-content:stretch;padding:0;box-sizing:border-box;background:#0a0a0c}
${s} .slide img{width:100%;height:100%;object-fit:cover;display:block;transform:translateZ(0)}
${s} .slide img.sld-img{cursor:pointer;transition:transform .45s var(--sld-ease),filter .45s var(--sld-ease);filter:saturate(1.02) contrast(1.02)}
${s} .slide img.sld-img:hover{transform:scale(1.03);filter:saturate(1.08) contrast(1.06)}
${s} .slide img.sld-img:active{transform:scale(.99)}

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

@media (max-width: 560px){
  ${s}{--sld-radius:14px;box-shadow:var(--sld-shadow2)}
  ${s} .sld-btn{width:42px;height:42px}
  ${s} .sld-btn.prev{left:10px}
  ${s} .sld-btn.next{right:10px}
  ${s} .sld-dots{bottom:10px;gap:7px;padding:7px 9px}
}
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
.sld-fs-modal .sld-fs-close{position:absolute;top:16px;right:16px;width:44px;height:44px;border:none;background:linear-gradient(180deg, rgba(255,255,255,.16), rgba(255,255,255,.08));color:#fff;cursor:pointer;border-radius:999px;z-index:10;display:flex;align-items:center;justify-content:center;box-shadow:0 14px 34px rgba(0,0,0,.42);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);transition:background .2s ease,transform .2s ease,box-shadow .2s ease}
.sld-fs-modal .sld-fs-close svg{display:block;opacity:.95}
.sld-fs-modal .sld-fs-close:hover{background:linear-gradient(180deg, rgba(255,255,255,.22), rgba(255,255,255,.10));transform:scale(1.06);box-shadow:0 16px 40px rgba(0,0,0,.5)}
.sld-fs-modal .sld-fs-close:active{transform:scale(.98)}
@media (max-width: 560px){
  .sld-fs-modal .sld-btn{width:46px;height:46px}
  .sld-fs-modal .sld-btn.prev{left:12px}
  .sld-fs-modal .sld-btn.next{right:12px}
  .sld-fs-modal .sld-fs-close{top:12px;right:12px}
  .sld-fs-modal .sld-dots{bottom:12px}
}
@media (prefers-reduced-motion: reduce){
  .sld-fs-modal,.sld-fs-modal .sld-track{transition:none!important}
  .sld-fs-modal .sld-btn,.sld-fs-modal .dot,.sld-fs-modal .sld-fs-close{transition:none!important}
}`;
}

function initSlider(sldID, dataset, ease) {
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
        dataset.forEach((img) => { fsSlides += `<div class="slide"><img src="${img}" alt=""></div>`; });
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
// [EOF]: ./components/slider/Slider.js
;


// [11:01:03] LOAD: ./api/indexVisi.js
// [11:01:03] LOAD: ./visiology/getMetricsMono
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


// [11:01:03] LOAD: ../utils/getAccessToken
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

// [11:01:03] LOAD: ../utils/getMonoPath
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

// [11:01:03] LOAD: ../utils/groupDatasets
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

// [11:01:03] LOAD: ../utils/checkDeadShedulers
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

// [11:01:03] LOAD: ../utils/getShedulersMore
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
 * @param {string} moreInfoLink - Базовый URL для запросов детальной информации (должен быть определен в области видимости)
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
async function getShedulersMore(accessToken, dataShedulers) {
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
    const shedulersWithMoreInfo = await getShedulersMore(token, dataShedulers);

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

// [11:01:03] SKIP (already loaded): ./utils/getAccessToken

// [11:01:03] SKIP (already loaded): ./utils/getShedulersMore

// [11:01:03] SKIP (already loaded): ./utils/groupDatasets


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
            FilterReplaceText
        },
    },
    comp: {
        photo: {
            slider: {
                render: renderSlider,
            },
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