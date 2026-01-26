// prxz.js - Библиотека форматирования данных
    // Версия 1.0.0 | 2026-01-26T12:43:01.555Z
    // MIT License | Compiled by Bundler
    // Github: https://github.com/mizuki666
    // Build ID: 19bfa543610
    // ====================================

(function() {
        'use strict';


// [12:43:01] LOAD: ./utils/formatValue.js
const FormatValue = {
    /**
     * Форматирует число с настройками
     * @param {number} value - Число для форматирования
     * @param {number} decimals - Знаков после запятой (по умолчанию: 2)
     * @param {boolean} localize - Локализация (разделители тысяч) (по умолчанию: true)
     * @returns {string} Отформатированная строка
     */
    fval(value, decimals = 2, localize = true) {
        if (value === null || value === undefined || value === '') {
            return '-';
        }
        
        const num = Number(value);
        if (isNaN(num)) return String(value);
        
        if (localize) {
            return num.toLocaleString('ru-RU', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
        }
        
        return num.toFixed(decimals);
    },

    /**
     * Форматирует число как проценты
     * @param {number} value - Число для форматирования (например: 25.5)
     * @param {number} decimals - Знаков после запятой (по умолчанию: 2)
     * @returns {string} Строка с процентами
     */
    fperc(value, decimals = 2) {
        if (value == null) return '-';
        
        const num = Number(value);
        if (isNaN(num)) return String(value);
        
        return `${num.toFixed(decimals)}%`;
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
        if (isNaN(num)) return String(value);
        
        return num.toLocaleString('ru-RU', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
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
        
        const absValue = Math.abs(num);
        
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

// [12:43:01] LOAD: ./utils/formatDate.js
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
    formatDate(dateString, format = 'dd.mm.yyyy') {
        const { date, isValid } = this._parseDate(dateString);
        if (!isValid) return this._getFallbackValue(dateString);
        
        const mskDate = this._convertToMoscowTime(date);
        
        return this._applyFormat(mskDate, format);
    },

    /**
     * Парсит дату и проверяет валидность
     * @private
     */
    _parseDate(dateInput) {
        if (!dateInput) {
            return { date: null, isValid: false };
        }

        const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
        const isValid = !isNaN(date.getTime());
        
        return { date, isValid };
    },

    /**
     * Конвертирует дату в московское время (UTC+3)
     * @private
     */
    _convertToMoscowTime(date) {
        const MOSCOW_TIME_OFFSET_MS = 3 * 60 * 60 * 1000;
        return new Date(date.getTime() + MOSCOW_TIME_OFFSET_MS);
    },

    /**
     * Возвращает fallback-значение для невалидной даты
     * @private
     */
    _getFallbackValue(dateString) {
        if (!dateString) return '-';
        return 'Неверная дата';
    },

    /**
     * Русские названия месяцев и дней недели
     * @private
     */
    _getLocalizedStrings() {
        return {
            months: {
                short: ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
                full: ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь']
            },
            days: {
                short: ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'],
                full: ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота']
            },
            ampm: {
                am: 'AM',
                pm: 'PM'
            }
        };
    },

    /**
     * Применяет формат к дате
     * @private
     */
    _applyFormat(date, format) {
        const loc = this._getLocalizedStrings();
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
        
        // Замены для форматирования
        const replacements = {
            // День месяца (1-31)
            'd': utcDate.toString(),
            'dd': utcDate.toString().padStart(2, '0'),
            
            // День недели
            'ddd': loc.days.short[utcDay],
            'dddd': loc.days.full[utcDay],
            
            // Месяц (1-12)
            'm': (utcMonth + 1).toString(),
            'mm': (utcMonth + 1).toString().padStart(2, '0'),
            'mmm': loc.months.short[utcMonth],
            'mmmm': loc.months.full[utcMonth],
            
            // Год
            'yy': utcYear.toString().slice(-2),
            'yyyy': utcYear.toString(),
            
            // Часы (24-часовой формат)
            'H': utcHours.toString(),
            'HH': utcHours.toString().padStart(2, '0'),
            
            // Часы (12-часовой формат)
            'h': hours12.toString(),
            'hh': hours12.toString().padStart(2, '0'),
            
            // Минуты
            'M': utcMinutes.toString(),
            'MM': utcMinutes.toString().padStart(2, '0'),
            
            // Секунды
            'S': utcSeconds.toString(),
            'SS': utcSeconds.toString().padStart(2, '0'),
            
            // AM/PM
            't': isPM ? 'p' : 'a',
            'tt': isPM ? loc.ampm.pm : loc.ampm.am,
            
            // Специальные форматы для обратной совместимости
            '\\{date\\}': `${utcDate.toString().padStart(2, '0')}.${(utcMonth + 1).toString().padStart(2, '0')}.${utcYear}`,
            '\\{time\\}': `${utcHours.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')}`,
            '\\{time:s\\}': `${utcHours.toString().padStart(2, '0')}:${utcMinutes.toString().padStart(2, '0')}:${utcSeconds.toString().padStart(2, '0')}`
        };

        // Сначала заменяем специальные форматы (если есть)
        let result = format;
        if (result.includes('{date}') || result.includes('{time}')) {
            result = result
                .replace('{date}', replacements['\\{date\\}'])
                .replace('{time:s}', replacements['\\{time:s\\}'])
                .replace('{time}', replacements['\\{time\\}']);
        }
        
        // Затем заменяем все токены
        const tokenRegex = /d{1,4}|m{1,4}|y{2,4}|H{1,2}|h{1,2}|M{1,2}|S{1,2}|t{1,2}|\\[dmyt]/g;
        
        return result.replace(tokenRegex, match => {
            // Если это экранированный символ, возвращаем его без экранирования
            if (match.startsWith('\\')) {
                return match.slice(1);
            }
            return replacements[match] || match;
        });
    }
};

;
// [EOF]: ./utils/formatDate.js
;

// [12:43:01] LOAD: ./components/log/Logger.js
// [12:43:01] LOAD: ./LoggerStyle.js
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
            console.log(`%cSUCCESS%c ${message}`, styles.badge, styles.text, ...args);
        },
        
        error(message, ...args) {
            const styles = LoggerStyles.getStyleForStatus('ERROR');
            console.log(`%cERROR%c ${message}`, styles.badge, styles.text, ...args);
        },
        
        info(message, ...args) {
            const styles = LoggerStyles.getStyleForStatus('INFO');
            console.log(`%cINFO%c ${message}`, styles.badge, styles.text, ...args);
        },
        
        warn(message, ...args) {
            const styles = LoggerStyles.getStyleForStatus('WARNING');
            console.log(`%cWARNING%c ${message}`, styles.badge, styles.text, ...args);
        },
        
        debug(message, ...args) {
            const styles = LoggerStyles.getStyleForStatus('DEBUG');
            console.log(`%cDEBUG%c ${message}`, styles.badge, styles.text, ...args);
        }
    }
};

;
// [EOF]: ./components/log/Logger.js
;

// [12:43:01] LOAD: ./api/indexVisi.js
// [12:43:01] LOAD: ./visiology/getMetricsMono
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


// [12:43:01] LOAD: ./utils/getAccessToken
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
// [EOF]: ./utils/getAccessToken


// [12:43:01] LOAD: ./utils/getShedulersMore
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
// [EOF]: ./utils/getShedulersMore


// [12:43:01] LOAD: ./utils/groupDatasets
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
// [EOF]: ./utils/groupDatasets


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
    version: '1.0.0',
    api:{
        visi
    },
    lg: Logger,
    frm: {
        v: FormatValue,
        d: FormatDate,
    }
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