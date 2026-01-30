/**
 * Конвертирует дату в московское время (UTC+3)
 * @param {Date} date - Исходная дата
 * @returns {Date} Дата в московском времени
 */
export function convertToMoscowTime(date) {
    const MOSCOW_TIME_OFFSET_MS = 3 * 60 * 60 * 1000;
    return new Date(date.getTime() + MOSCOW_TIME_OFFSET_MS);
}