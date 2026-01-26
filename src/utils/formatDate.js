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

export { FormatDate };