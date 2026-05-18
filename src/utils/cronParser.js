/**
 * Парсер cron выражений
 * Преобразует cron выражение в читаемое описание для пользователя
 * 
 * @param {string} cronExpression - cron выражение (5 или 6 полей)
 * @returns {string} человекочитаемое описание
 * 
 */

export function cronParser(cronExpression) {
  const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
                  'июля', 'августа', 'сентябре', 'октября', 'ноября', 'декабря'];
  const DAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 
                'четверг', 'пятница', 'суббота'];
  const DAYS_SHORT = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

  if (!cronExpression) return '';

  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length < 5) return 'Неверный формат cron';

  const [minutes, hours, dayOfMonth, month, dayOfWeek] = parts;

  /**
   * Парсит поле cron
   */
  function parseField(field, type) {
    // Каждое значение
    if (field === '*') {
      return { type: 'every' };
    }

    // Список значений
    if (field.includes(',') && !field.includes('/')) {
      const values = field.split(',').map(v => {
        const num = parseInt(v);
        return isNaN(num) ? v : num;
      });
      return { type: 'list', values };
    }

    // Шаг
    if (field.includes('/')) {
      const [range, step] = field.split('/');
      const stepNum = parseInt(step);
      
      if (range === '*') {
        return { type: 'step', step: stepNum, start: 0 };
      }
      
      if (range.includes('-')) {
        const [start, end] = range.split('-').map(Number);
        return { type: 'step', step: stepNum, start, end };
      }
      
      return { type: 'step', step: stepNum, start: parseInt(range) };
    }

    // Диапазон
    if (field.includes('-')) {
      const [start, end] = field.split('-').map(v => {
        const num = parseInt(v);
        return isNaN(num) ? v : num;
      });
      return { type: 'range', start, end };
    }

    // Конкретное значение
    const num = parseInt(field);
    return { 
      type: 'exact', 
      value: isNaN(num) ? field.toUpperCase() : num 
    };
  }

  /**
   * Форматирует минуты
   */
  function formatMinutes(minutesField) {
    const parsed = parseField(minutesField, 'minutes');
    
    if (parsed.type === 'every') return '';
    if (parsed.type === 'step') {
      if (parsed.step === 1 || !parsed.start) return `Каждую минуту`;
      return `Каждые ${parsed.step} минут`;
    }
    if (parsed.type === 'exact') {
      return `${parsed.value} минут(а/ы)`;
    }
    if (parsed.type === 'list') {
      return `В минуты: ${parsed.values.join(', ')}`;
    }
    if (parsed.type === 'range') {
      return `С ${parsed.start} по ${parsed.end} минуту`;
    }
    return '';
  }

  /**
   * Форматирует часы
   */
  function formatHours(hoursField) {
    const parsed = parseField(hoursField, 'hours');
    
    if (parsed.type === 'every') return '';
    if (parsed.type === 'step') {
      if (parsed.step === 1) return 'Каждый час';
      return `Каждые ${parsed.step} часа(ов)`;
    }
    if (parsed.type === 'exact') {
      return `в ${String(parsed.value).padStart(2, '0')}:00`;
    }
    if (parsed.type === 'list') {
      const formatted = parsed.values.map(v => `${String(v).padStart(2, '0')}:00`);
      return `В ${formatted.join(', ')}`;
    }
    if (parsed.type === 'range') {
      return `с ${String(parsed.start).padStart(2, '0')}:00 до ${String(parsed.end).padStart(2, '0')}:00`;
    }
    return '';
  }

  /**
   * Форматирует дни месяца
   */
  function formatDayOfMonth(field) {
    const parsed = parseField(field, 'dayOfMonth');
    
    if (parsed.type === 'every') return '';
    if (parsed.type === 'exact') {
      return `${parsed.value} числа`;
    }
    if (parsed.type === 'list') {
      return `${parsed.values.join(', ')} числа`;
    }
    if (parsed.type === 'range') {
      return `с ${parsed.start} по ${parsed.end} число`;
    }
    if (parsed.type === 'step') {
      return `каждые ${parsed.step} дня`;
    }
    return '';
  }

  /**
   * Форматирует месяцы
   */
  function formatMonth(field) {
    const parsed = parseField(field, 'month');
    
    if (parsed.type === 'every') return '';
    if (parsed.type === 'exact') {
      if (typeof parsed.value === 'string') {
        const idx = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].indexOf(parsed.value);
        return idx !== -1 ? MONTHS[idx] : parsed.value;
      }
      return MONTHS[parsed.value - 1];
    }
    if (parsed.type === 'list') {
      return parsed.values.map(v => {
        if (typeof v === 'string') {
          const idx = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                      'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].indexOf(v);
          return idx !== -1 ? MONTHS[idx] : v;
        }
        return MONTHS[v - 1];
      }).join(', ');
    }
    if (parsed.type === 'range') {
      const start = typeof parsed.start === 'string' ? parsed.start : MONTHS[parsed.start - 1];
      const end = typeof parsed.end === 'string' ? parsed.end : MONTHS[parsed.end - 1];
      return `с ${start} по ${end}`;
    }
    if (parsed.type === 'step') {
      return `каждые ${parsed.step} месяца`;
    }
    return '';
  }

  /**
   * Форматирует дни недели
   */
  function formatDayOfWeek(field) {
    const parsed = parseField(field, 'dayOfWeek');
    
    if (parsed.type === 'every') return '';
    if (parsed.type === 'exact') {
      if (typeof parsed.value === 'string') {
        const idx = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
                      .indexOf(parsed.value);
        return idx !== -1 ? DAYS[idx] : parsed.value;
      }
      return DAYS[parsed.value];
    }
    if (parsed.type === 'list') {
      return parsed.values.map(v => {
        if (typeof v === 'string') {
          const idx = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
                        .indexOf(v);
          return idx !== -1 ? DAYS_SHORT[idx] : v;
        }
        return DAYS_SHORT[v];
      }).join(', ');
    }
    if (parsed.type === 'range') {
      const start = typeof parsed.start === 'string' ? parsed.start : DAYS[parsed.start];
      const end = typeof parsed.end === 'string' ? parsed.end : DAYS[parsed.end];
      return `с ${start} по ${end}`;
    }
    return '';
  }

  // Строим итоговое описание
  const parts_desc = [];
  
  const minDesc = formatMinutes(minutes);
  const hourDesc = formatHours(hours);
  const dayMonDesc = formatDayOfMonth(dayOfMonth);
  const monDesc = formatMonth(month);
  const dayWeekDesc = formatDayOfWeek(dayOfWeek);

  // Собираем время
  let timeStr = '';
  if (hourDesc && minDesc) {
    const hour = hours !== '*' ? parseInt(hours) : 0;
    const min = minutes !== '*' ? parseInt(minutes) : 0;
    timeStr = `В ${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  } else if (hourDesc) {
    timeStr = hourDesc;
  } else if (minDesc) {
    timeStr = minDesc;
  }

  if (timeStr) parts_desc.push(timeStr);

  // Дни недели
  if (dayWeekDesc) {
    parts_desc.push(`по ${dayWeekDesc}`);
  }

  // Дни месяца
  if (dayMonDesc) {
    parts_desc.push(dayMonDesc);
  }

  // Месяцы
  if (monDesc) {
    parts_desc.push(monDesc);
  }

  // Особые случаи
  if (minutes === '*' && hours === '*' && dayOfMonth === '*' && 
      month === '*' && dayOfWeek === '*') {
    return 'Каждую минуту';
  }

  if (minutes === '0' && hours === '0' && dayOfMonth === '*' && 
      month === '*' && dayOfWeek === '*') {
    return 'Каждый день в полночь';
  }

  if (minutes === '*/5' && hours === '*' && dayOfMonth === '*' && 
      month === '*' && dayOfWeek === '*') {
    return 'Каждые 5 минут';
  }

  if (minutes === '0' && /^\d+$/.test(hours) && dayOfMonth === '*' && 
      month === '*' && dayOfWeek === '*' && parseInt(hours) >= 0 && parseInt(hours) <= 23) {
    return `Каждый день в ${String(parseInt(hours)).padStart(2, '0')}:00`;
  }

  return parts_desc.join(', ') || 'Каждую минуту';
}