// prxz.js - Библиотека форматирования данных
    // Версия 1.0.0 | 2026-01-26T11:21:14.627Z
    // MIT License | Compiled by Bundler
    // Github: https://github.com/mizuki666
    // Build ID: 19bfa09564a
    // ====================================

(function() {
        'use strict';


// [11:21:14] LOAD: ./utils/formatValue.js
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

// [11:21:14] LOAD: ./utils/formatDate.js
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

// [11:21:14] LOAD: ./components/log/Logger.js
// [11:21:14] LOAD: ./LoggerStyle.js
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

// [11:21:14] LOAD: ./api/indexVisi.js
// [11:21:14] LOAD: ./visiology/getMetricsMono
// [11:21:14] LOAD: ../utils/getAccessToken
function getAccessToken(p) {
    try {
        //console.log(p,'наш keypath') // --- временно keypath
        //console.log(sessionStorage,'наш sessionStorage') // --- временно sessionStorage
        const userData = sessionStorage.getItem(p); 

        return userData ? JSON.parse(userData).access_token : null;
    } catch (error) {
        console.log('Ошибка при получении токена:', error);
        return null;
    }
}
// [EOF]: ../utils/getAccessToken
;

// [11:21:14] LOAD: ../utils/getMonoPath
function getMonoPath(){
    let mainHref = window.location.href; // получаем базовую ссылку
    let url = new URL(mainHref);
    let domain = url.hostname; // получаем домен
    let paramsArray = mainHref.split('&');
    
    // Найти параметр с workspaceId
    let workspaceId = paramsArray.find(param => param.includes('workspaceId='));
    
    if (workspaceId) {
        // Извлекаем только значение ID
        workspaceId = workspaceId.split('=')[1];
        console.log('Найден workspaceId:', workspaceId);
    } else {
        console.log('workspaceId не найден');
    }
    
    // формируем ссылки
    const shedulersLink = 'https://'+ domain +'/data-management-service/api/v1/workspaces/' + workspaceId + '/scheduled-refresh/GetAll'
    const dashesLink = 'https://'+ domain +'/dashboard-service/api/workspaces/' + workspaceId + '/dashboards'
    const moreInfoLink = 'https://'+ domain +'/formula-engine/api/v1/workspaces/' + workspaceId + '/datasets/'
    const workspaceAllLink = 'https://'+ domain + '/workspace-service/api/v1/evaluate-workspaces-with-role'
    const keyPath = 'oidc.user:https://' + domain + '/keycloak/realms/Visiology:visiology_designer'

    const path ={
        shedulersLink,
        dashesLink,
        moreInfoLink,
        workspaceAllLink,
        keyPath
    }
    return path    
}
// [EOF]: ../utils/getMonoPath
;

// [11:21:14] LOAD: ../utils/groupDatasets
function groupDatasets(schedulersWithMoreInfo, dataDashboards){
    // console.log(schedulersWithMoreInfo,'schedulersWithMoreInfo')
    // console.log(dataDashboards,'dataDashboards')

    return schedulersWithMoreInfo.map(scheduler => {
        const relatedDashboards = dataDashboards.filter(
            dashboard => dashboard.dataset?.datasetId === scheduler.id
        );

        return {
            scheduler: scheduler,
            dashboards: relatedDashboards,
            dashboardCount: relatedDashboards.length,
        };
    });
}
// [EOF]: ../utils/groupDatasets
;

// [11:21:14] LOAD: ../utils/checkDeadShedulers
function checkerDeadSchedulers(schedulersWithMoreInfo, dataDashboards){
    const deadSchedulers = schedulersWithMoreInfo.filter(scheduler => {
        return (
            scheduler.isEnabled === true &&
            !dataDashboards.some(dashboard => 
                dashboard.dataset?.datasetId === scheduler.id
            )
        );
    });

    return {
        deadSchedulers
    };
}
// [EOF]: ../utils/checkDeadShedulers
;

// [11:21:14] LOAD: ../utils/getShedulersMore
async function getShedulersMore (accessToken, dataShedulers) {
    const schedulersWithMoreInfo = [];
    // console.log('Внутри getShedulersMore')
    // console.log(dataShedulers,'dataShedulers') // --- временно

    for (let i = 0; i < dataShedulers.length; i++) {
        const scheduler = dataShedulers[i];
        
        try {
            if (!scheduler.isEnabled) {
                schedulersWithMoreInfo.push({
                    ...scheduler,
                    name: null,
                    modifiedTime: null, 
                    modifiedBy: null
                });
                continue;
            }

            if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 20));
            }

            const moreInfoResponse = await fetch(`${moreInfoLink}${scheduler.id}/model`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (moreInfoResponse.ok) {
                const moreInfoData = await moreInfoResponse.json();
                schedulersWithMoreInfo.push({
                    ...scheduler,
                    name: moreInfoData.name || null,
                    modifiedTime: moreInfoData.modifiedTime || null,
                    modifiedBy: moreInfoData.modifiedBy || null
                });
            } else {
                console.warn(`Не удалось получить дополнительную информацию для шедулера ${scheduler.id}`);
                schedulersWithMoreInfo.push({
                    ...scheduler,
                    name: null,
                    modifiedTime: null,
                    modifiedBy: null
                });
            }
        } catch (error) {
            console.error(`Ошибка при получении информации для шедулера ${scheduler.id}:`, error);
            schedulersWithMoreInfo.push({
                ...scheduler,
                name: null,
                modifiedTime: null,
                modifiedBy: null
            });
        }
    }

    return schedulersWithMoreInfo;
}
// [EOF]: ../utils/getShedulersMore
;

async function getMetricsMono(){
    const path = getMonoPath()
    const {shedulersLink, dashesLink, moreInfoLink, keyPath} = path
    //console.log(keyPath) // --- временно убрать
    const token = getAccessToken(keyPath)
    
    const [responseShedulers, responseDashboards, responseMetrics] = await Promise.all([
        fetch(shedulersLink, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }).then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, name: responseShedulers`);
            }
            return response;
        }),
        
        fetch(dashesLink, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }).then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, name: responseDashboards`);
            }
            return response; 
        }),
    ]);

    const [dataShedulers, dataDashboards] = await Promise.all([
        responseShedulers.json(),
        responseDashboards.json(),
        responseMetrics ? responseMetrics.json() : Promise.resolve(null)
    ]);
    // console.log('---СТАРТ getShedulersMore')
    const schedulersWithMoreInfo = await getShedulersMore(token, dataShedulers);

    // console.log('---СТАРТ groupDatasets')
    const groupedData = groupDatasets(schedulersWithMoreInfo, dataDashboards);
    
    // console.log('---СТАРТ checkerDeadSchedulers')
    const deadSchedulers = checkerDeadSchedulers(schedulersWithMoreInfo, dataDashboards);

    const dataset = {
        dataShedulers: schedulersWithMoreInfo,
        dataDashboards: dataDashboards,
        dataAll: groupedData,
        deadSchedulers: deadSchedulers
    }

    return dataset
}
// [EOF]: ./visiology/getMetricsMono


// [11:21:14] LOAD: ./utils/getAccessToken
function getAccessToken(p) {
    try {
        //console.log(p,'наш keypath') // --- временно keypath
        //console.log(sessionStorage,'наш sessionStorage') // --- временно sessionStorage
        const userData = sessionStorage.getItem(p); 

        return userData ? JSON.parse(userData).access_token : null;
    } catch (error) {
        console.log('Ошибка при получении токена:', error);
        return null;
    }
}
// [EOF]: ./utils/getAccessToken


// [11:21:14] LOAD: ./utils/getShedulersMore
async function getShedulersMore (accessToken, dataShedulers) {
    const schedulersWithMoreInfo = [];
    // console.log('Внутри getShedulersMore')
    // console.log(dataShedulers,'dataShedulers') // --- временно

    for (let i = 0; i < dataShedulers.length; i++) {
        const scheduler = dataShedulers[i];
        
        try {
            if (!scheduler.isEnabled) {
                schedulersWithMoreInfo.push({
                    ...scheduler,
                    name: null,
                    modifiedTime: null, 
                    modifiedBy: null
                });
                continue;
            }

            if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 20));
            }

            const moreInfoResponse = await fetch(`${moreInfoLink}${scheduler.id}/model`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (moreInfoResponse.ok) {
                const moreInfoData = await moreInfoResponse.json();
                schedulersWithMoreInfo.push({
                    ...scheduler,
                    name: moreInfoData.name || null,
                    modifiedTime: moreInfoData.modifiedTime || null,
                    modifiedBy: moreInfoData.modifiedBy || null
                });
            } else {
                console.warn(`Не удалось получить дополнительную информацию для шедулера ${scheduler.id}`);
                schedulersWithMoreInfo.push({
                    ...scheduler,
                    name: null,
                    modifiedTime: null,
                    modifiedBy: null
                });
            }
        } catch (error) {
            console.error(`Ошибка при получении информации для шедулера ${scheduler.id}:`, error);
            schedulersWithMoreInfo.push({
                ...scheduler,
                name: null,
                modifiedTime: null,
                modifiedBy: null
            });
        }
    }

    return schedulersWithMoreInfo;
}
// [EOF]: ./utils/getShedulersMore


// [11:21:14] LOAD: ./utils/groupDatasets
function groupDatasets(schedulersWithMoreInfo, dataDashboards){
    // console.log(schedulersWithMoreInfo,'schedulersWithMoreInfo')
    // console.log(dataDashboards,'dataDashboards')

    return schedulersWithMoreInfo.map(scheduler => {
        const relatedDashboards = dataDashboards.filter(
            dashboard => dashboard.dataset?.datasetId === scheduler.id
        );

        return {
            scheduler: scheduler,
            dashboards: relatedDashboards,
            dashboardCount: relatedDashboards.length,
        };
    });
}
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