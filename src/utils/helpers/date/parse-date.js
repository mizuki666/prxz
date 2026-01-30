/**
 * Парсит дату и проверяет валидность
 * @param {string|Date} dateInput - Дата для парсинга
 * @returns {Object} Объект с полями date и isValid
 */
export function parseDate(dateInput) {
    if (!dateInput) {
        return { date: null, isValid: false };
    }

    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    const isValid = !isNaN(date.getTime());
    
    return { date, isValid };
}