/**
 * Применяет формат к дате
 * @param {Date} date - Дата для форматирования
 * @param {string} format - Формат вывода
 * @param {Object} loc - Локализованные строки
 * @returns {string} Отформатированная строка
 */
export function applyFormat(date, format, loc) {
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