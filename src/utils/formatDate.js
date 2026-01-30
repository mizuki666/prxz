import { parseDate } from './helpers/date/parse-date.js';
import { convertToMoscowTime } from './helpers/date/convert-time.js';
import { getLocalizedStrings } from './helpers/date/localization.js';
import { applyFormat } from './helpers/date/apply-format.js';

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

export { FormatDate };