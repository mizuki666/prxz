import { LoggerStyles } from "./LoggerStyle.js";

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

export { Logger };