import { Logger } from '../bundler/Logger.js';
import { logHelper } from './helper/logHelper.js';
import { loadPrxz } from './utils/loadLibrary.js';

// Конфигурация тестов
export const testConfig = {
  // Основные функции для тестирования
  formatDate: false,
  
  // Группы тестов
  formatDateBasicTests: true,
  formatDateEdgeTests: true,
  formatDateStringTests: true,
  formatDateInvalidTests: true,
  formatDateTimezoneTests: true,
  
  // Тесты производительности
  performanceTests: true
};

// Загружаем prxz и получаем formatDate
async function getPrxz() {
  const prxz = await loadPrxz();
  const { formatDate } = prxz.frm.d;
  return { formatDate };
}

/**
 * Создает тестовую функцию для formatDate
 */
function createTestFormatDate(formatDate) {
  return function testFormatDate(description, value, expected, format = 'dd.mm.yyyy') {
    return logHelper(
      formatDate,
      description,
      [value, format],
      expected
    );
  };
}

/**
 * Создает все тесты для formatDate
 */
function createFormatDateTests(testFormatDate) {
  // Тесты для базовых форматов дат
  const basicTests = [
    () => testFormatDate('Формат dd.mm.yyyy', '2024-12-25', '25.12.2024', 'dd.mm.yyyy'),
    // Учитываем, что функция добавляет 3 часа (Московское время)
    () => testFormatDate('Формат dd.mm.yyyy HH:MM', '2024-12-25T14:30:00', '25.12.2024 17:30', 'dd.mm.yyyy HH:MM'),
    () => testFormatDate('Формат dd.mm.yyyy HH:MM:SS', '2024-12-25T14:30:45', '25.12.2024 17:30:45', 'dd.mm.yyyy HH:MM:SS'),
    () => testFormatDate('Формат d mmm yyyy', '2024-12-25', '25 дек 2024', 'd mmm yyyy'),
    // В русском языке "декабрь", а не "декабря"
    () => testFormatDate('Формат dddd, d mmmm yyyy', '2024-12-25', 'среда, 25 декабрь 2024', 'dddd, d mmmm yyyy'),
    () => testFormatDate('Формат yyyy-mm-dd', '2024-12-25', '2024-12-25', 'yyyy-mm-dd'),
    // 14:30 UTC -> 17:30 MSK
    () => testFormatDate('Формат HH:MM', '2024-12-25T14:30:00', '17:30', 'HH:MM'),
    // 14:30 UTC -> 17:30 MSK = 05:30 PM
    () => testFormatDate('Формат hh:MM tt', '2024-12-25T14:30:00', '05:30 PM', 'hh:MM tt'),
  ];
  
  // Тесты для граничных значений
  const edgeTests = [
    // 0 UTC = 1970-01-01T00:00:00Z -> 1970-01-01T03:00:00 MSK
    () => testFormatDate('Начало эпохи Unix', new Date(0), '01.01.1970 03:00', 'dd.mm.yyyy HH:MM'),
    // 23:59:59.999 UTC -> следующий день 02:59:59 MSK
    () => testFormatDate('Конец дня', '2024-12-31T23:59:59.999', '01.01.2025 02:59:59', 'dd.mm.yyyy HH:MM:SS'),
    // 00:00:00 UTC -> 03:00 MSK
    () => testFormatDate('Начало дня', '2024-12-31T00:00:00', '31.12.2024 03:00', 'dd.mm.yyyy HH:MM'),
    () => testFormatDate('Високосный год', '2024-02-29', '29.02.2024', 'dd.mm.yyyy'),
    () => testFormatDate('Невисокосный год', '2023-02-28', '28.02.2023', 'dd.mm.yyyy'),
  ];
  
  // Тесты для строковых форматов дат
  const stringTests = [
    // 14:30 UTC -> 17:30 MSK
    () => testFormatDate('Строка ISO', '2024-12-25T14:30:00Z', '25.12.2024 17:30', 'dd.mm.yyyy HH:MM'),
    // Уже в MSK, поэтому без смещения
    () => testFormatDate('Строка с временной зоной', '2024-12-25T14:30:00+03:00', '25.12.2024 14:30', 'dd.mm.yyyy HH:MM'),
    () => testFormatDate('Строка без времени', '2024-12-25', '25.12.2024', 'dd.mm.yyyy'),
    () => testFormatDate('Строка с миллисекундами', '2024-12-25T14:30:45.123', '25.12.2024 17:30:45', 'dd.mm.yyyy HH:MM:SS'),
    () => testFormatDate('Строка RFC 2822', 'Wed, 25 Dec 2024 14:30:00 GMT', '25.12.2024 17:30', 'dd.mm.yyyy HH:MM'),
    () => testFormatDate('Строка человекочитаемая', 'December 25, 2024 14:30:00', '25.12.2024 17:30', 'dd.mm.yyyy HH:MM'),
  ];
  
  // Тесты для невалидных дат
  const invalidTests = [
    () => testFormatDate('null значение', null, '-'),
    () => testFormatDate('undefined значение', undefined, '-'),
    () => testFormatDate('Пустая строка', '', '-'),
    () => testFormatDate('Некорректная строка', 'не дата', 'Неверная дата'),
    () => testFormatDate('Некорректный формат', '2024-13-45', 'Неверная дата'),
    () => testFormatDate('NaN', NaN, '-'),
    () => testFormatDate('Infinity', Infinity, 'Неверная дата'),
    () => testFormatDate('-Infinity', -Infinity, 'Неверная дата'),
    () => testFormatDate('Массив', [2024, 12, 25, 65], 'Неверная дата'),
    () => testFormatDate('Объект', {year: 2024, month: 12}, 'Неверная дата'),
  ];
  
  // Тесты для временных зон (Московское время UTC+3)
  const timezoneTests = [
    // 21:00 UTC -> 00:00 MSK (следующий день)
    () => testFormatDate('МСК время UTC', '2024-12-25T21:00:00Z', '26.12.2024 00:00', 'dd.mm.yyyy HH:MM'),
    // Уже в MSK
    () => testFormatDate('МСК время GMT+3', '2024-12-25T21:00:00+03:00', '25.12.2024 21:00', 'dd.mm.yyyy HH:MM'),
    // 20:59:59 UTC -> 23:59:59 MSK
    () => testFormatDate('Полуночный переход', '2024-12-25T20:59:59Z', '25.12.2024 23:59:59', 'dd.mm.yyyy HH:MM:SS'),
    // 21:00 UTC -> 00:00 MSK (следующий день)
    () => testFormatDate('Переход через полночь', '2024-12-25T21:00:00Z', '26.12.2024 00:00', 'dd.mm.yyyy HH:MM'),
    () => testFormatDate('Летнее время (предполагая UTC+3 всегда)', '2024-06-25T21:00:00Z', '26.06.2024 00:00', 'dd.mm.yyyy HH:MM'),
  ];
  
  // Тесты для специальных форматов
  const specialFormatTests = [
    () => testFormatDate('Специальный формат {date}', '2024-12-25', '25.12.2024', '{date}'),
    // {time} показывает только часы и минуты (учитываем смещение)
    () => testFormatDate('Специальный формат {time}', '2024-12-25T14:30:45', '17:30', '{time}'),
    () => testFormatDate('Специальный формат {time:s}', '2024-12-25T14:30:45', '17:30:45', '{time:s}'),
    () => testFormatDate('Комбинированный формат', '2024-12-25T14:30:00', 'Дата: 25.12.2024 Время: 17:30', 'Дата: {date} Время: {time}'),
  ];
  
  // Тесты для месяцев и дней недели
  const localeTests = [
    ...Array.from({length: 12}, (_, i) => {
      const monthNum = i + 1;
      const date = `2024-${monthNum.toString().padStart(2, '0')}-01`;
      const expected = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'][i];
      return () => testFormatDate(
        `Месяц ${monthNum} короткий`,
        date,
        expected,
        'mmm'
      );
    }),
    ...Array.from({length: 12}, (_, i) => {
      const monthNum = i + 1;
      const date = `2024-${monthNum.toString().padStart(2, '0')}-01`;
      const expected = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'][i];
      return () => testFormatDate(
        `Месяц ${monthNum} полный`,
        date,
        expected,
        'mmmm'
      );
    }),
    ...Array.from({length: 7}, (_, i) => {
      // 2024-01-01 - понедельник (индекс 1), создаем дату в UTC
      const date = new Date(Date.UTC(2024, 0, 1 + i));
      // Массив дней недели: ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']
      // 2024-01-01 UTC -> 2024-01-01 03:00 MSK (понедельник)
      const expected = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'][(i + 1) % 7];
      return () => testFormatDate(
        `День недели ${i} короткий`,
        date,
        expected,
        'ddd'
      );
    }),
  ];

  return {
    basicTests,
    edgeTests,
    stringTests,
    invalidTests,
    timezoneTests,
    specialFormatTests,
    localeTests
  };
}

/**
 * Запускает группу тестов
 */
function runTestGroup(tests, groupName, config, groupConfigKey) {
  // ОТКЛЮЧАЕМ ГРУППУ ТЕСТОВ ЕСЛИ formatDate = false
  if (!config.formatDate || !config[groupConfigKey]) {
    console.log(`\x1b[90m[${groupName}] Пропущено\x1b[0m`);
    return { passed: 0, total: 0 };
  }
  
  console.log(`\n\x1b[36m=== ${groupName} ===\x1b[0m`);
  let passed = 0;
  let total = 0;
  
  for (const test of tests) {
    total++;
    try {
      if (test()) passed++;
    } catch (e) {
      console.log(`❌ Test failed with error: ${e.message}`);
    }
  }
  
  return { passed, total };
}

/**
 * Запускает тесты производительности
 */
function runPerformanceTests(formatDate, config) {
  // ОТКЛЮЧАЕМ ТЕСТЫ ПРОИЗВОДИТЕЛЬНОСТИ ЕСЛИ formatDate = false
  if (!config.formatDate || !config.performanceTests) {
    console.log('\n\x1b[90m[Производительность] Пропущено\x1b[0m');
    return {};
  }
  
  console.log('\n\x1b[36m=== Производительность ===\x1b[0m');
  
  const results = {};
  
  console.log('\n\x1b[90m[Тест formatDate]\x1b[0m');
  
  // Тест разных форматов
  const formats = ['dd.mm.yyyy', 'dd.mm.yyyy HH:MM', 'dd.mm.yyyy HH:MM:SS', 'd mmm yyyy', 'dddd, d mmmm yyyy'];
  const testDate = '2024-12-25T14:30:45';
  
  const start = performance.now();
  for (let i = 0; i < 10000; i++) {
    const format = formats[i % formats.length];
    formatDate(testDate, format);
  }
  const end = performance.now();
  results.formatDate = end - start;
  console.log(`10k вызовов formatDate: ${results.formatDate.toFixed(2)}ms`);
  
  // Тест с разными датами
  console.log('\n\x1b[90m[Тест разных дат]\x1b[0m');
  const dates = [
    '2024-01-01',
    '2024-06-15T12:00:00',
    '2024-12-31T23:59:59',
    new Date(),
    null,
    undefined
  ];
  
  const startDates = performance.now();
  for (let i = 0; i < 10000; i++) {
    const date = dates[i % dates.length];
    formatDate(date);
  }
  const endDates = performance.now();
  results.formatDateDifferentDates = endDates - startDates;
  console.log(`10k вызовов с разными датами: ${results.formatDateDifferentDates.toFixed(2)}ms`);
  
  return results;
}

/**
 * Основная функция для запуска всех тестов formatDate
 */
export async function runFrmD(customConfig = {}) {
  // Объединяем конфиг по умолчанию с пользовательским
  const config = { ...testConfig, ...customConfig };
  
  // Получаем функцию из библиотеки
  const { formatDate } = await getPrxz();
  
  console.log('\n=== STARTING FRM.D TESTS (formatDate) ===\n');
  console.log('\x1b[90mКонфигурация:\x1b[0m');
  console.log(`  formatDate: ${config.formatDate ? '\x1b[32mвключено\x1b[0m' : '\x1b[90mвыключено\x1b[0m'}`);
  console.log(`  Базовые тесты: ${config.formatDate && config.formatDateBasicTests ? '\x1b[32mвключено\x1b[0m' : '\x1b[90mвыключено\x1b[0m'}`);
  console.log(`  Граничные значения: ${config.formatDate && config.formatDateEdgeTests ? '\x1b[32mвключено\x1b[0m' : '\x1b[90mвыключено\x1b[0m'}`);
  console.log(`  Строковые тесты: ${config.formatDate && config.formatDateStringTests ? '\x1b[32mвключено\x1b[0m' : '\x1b[90mвыключено\x1b[0m'}`);
  console.log(`  Невалидные даты: ${config.formatDate && config.formatDateInvalidTests ? '\x1b[32mвключено\x1b[0m' : '\x1b[90mвыключено\x1b[0m'}`);
  console.log(`  Временные зоны: ${config.formatDate && config.formatDateTimezoneTests ? '\x1b[32mвключено\x1b[0m' : '\x1b[90mвыключено\x1b[0m'}`);
  console.log(`  Производительность: ${config.formatDate && config.performanceTests ? '\x1b[32mвключено\x1b[0m' : '\x1b[90mвыключено\x1b[0m'}`);
  
  // ЕСЛИ formatDate = false, ТО ПРОПУСКАЕМ ВСЕ ТЕСТЫ
  if (!config.formatDate) {
    return { passed: 0, failed: 0, total: 0, message: 'All formatDate tests are disabled' };
  }
  
  let passed = 0;
  let total = 0;
  const results = {};
  
  // Создаем тестовую функцию
  const testFormatDate = createTestFormatDate(formatDate);
  
  // Получаем все тесты
  const formatDateTests = createFormatDateTests(testFormatDate);
  
  // Запускаем группы тестов если включены
  const testGroups = [
    { name: 'Базовые форматы', tests: formatDateTests.basicTests, configKey: 'formatDateBasicTests' },
    { name: 'Граничные значения', tests: formatDateTests.edgeTests, configKey: 'formatDateEdgeTests' },
    { name: 'Строковые форматы', tests: formatDateTests.stringTests, configKey: 'formatDateStringTests' },
    { name: 'Невалидные даты', tests: formatDateTests.invalidTests, configKey: 'formatDateInvalidTests' },
    { name: 'Временные зоны (МСК)', tests: formatDateTests.timezoneTests, configKey: 'formatDateTimezoneTests' },
    { name: 'Специальные форматы', tests: formatDateTests.specialFormatTests, configKey: 'formatDateBasicTests' },
    { name: 'Локализация', tests: formatDateTests.localeTests, configKey: 'formatDateBasicTests' },
  ];
  
  for (const group of testGroups) {
    const result = runTestGroup(group.tests, group.name, config, group.configKey);
    passed += result.passed;
    total += result.total;
    results[group.configKey] = result;
  }
  
  // Запускаем тесты производительности
  const perfResults = runPerformanceTests(formatDate, config);
  
  // Выводим итоги
  console.log('\n' + Logger.createBox([
    '\x1b[32m[✓]\x1b[0m TEST SUMMARY',
    `\x1b[90mPassed:   \x1b[0m ${passed}/${total}`,
    `\x1b[90mSuccess:  \x1b[0m ${total > 0 ? (passed/total*100).toFixed(1) : 0}%`,
    `\x1b[90mTotal tests: \x1b[0m ${total}`,
    ...(perfResults.formatDate ? [`\x1b[90mformatDate performance: \x1b[0m ${perfResults.formatDate.toFixed(2)}ms`] : []),
    ...(perfResults.formatDateDifferentDates ? [`\x1b[90mразные даты: \x1b[0m ${perfResults.formatDateDifferentDates.toFixed(2)}ms`] : [])
  ]));
  
  if (passed === total && total > 0) {
    console.log('\n✅ All tests passed!');
  } else if (total === 0) {

  } else {
    throw new Error(`${total - passed} test(s) failed`);
  }
  
  return { 
    passed, 
    failed: total - passed, 
    total,
    ...perfResults
  };
}

/**
 * Функция для запуска тестов отдельной группы
 */
export async function runFormatDateGroup(groupName, customConfig = {}) {
  const config = { ...testConfig, ...customConfig };
  
  // ОТКЛЮЧАЕМ ГРУППУ ТЕСТОВ ЕСЛИ formatDate = false
  if (!config.formatDate) {
    console.log(`\n\x1b[33m⚠️ Все тесты formatDate отключены (formatDate = false)\x1b[0m`);
    return { passed: 0, total: 0, failed: 0, message: 'All formatDate tests are disabled' };
  }
  
  // Получаем функцию из библиотеки
  const { formatDate } = await getPrxz();
  
  console.log(`\n=== STARTING TESTS FOR formatDate (${groupName}) ===\n`);
  
  const testFormatDate = createTestFormatDate(formatDate);
  const formatDateTests = createFormatDateTests(testFormatDate);
  
  let groupTests;
  let displayName;
  
  switch (groupName) {
    case 'basic':
      groupTests = formatDateTests.basicTests;
      displayName = 'Базовые форматы';
      break;
    case 'edge':
      groupTests = formatDateTests.edgeTests;
      displayName = 'Граничные значения';
      break;
    case 'string':
      groupTests = formatDateTests.stringTests;
      displayName = 'Строковые форматы';
      break;
    case 'invalid':
      groupTests = formatDateTests.invalidTests;
      displayName = 'Невалидные даты';
      break;
    case 'timezone':
      groupTests = formatDateTests.timezoneTests;
      displayName = 'Временные зоны';
      break;
    case 'locale':
      groupTests = formatDateTests.localeTests;
      displayName = 'Локализация';
      break;
    default:
      throw new Error(`Unknown test group: ${groupName}`);
  }
  
  let passed = 0;
  let total = 0;
  
  console.log(`\n\x1b[36m=== ${displayName} ===\x1b[0m`);
  for (const test of groupTests) {
    total++;
    try {
      if (test()) passed++;
    } catch (e) {
      console.log(`❌ Test failed with error: ${e.message}`);
    }
  }
  
  console.log('\n' + Logger.createBox([
    '\x1b[32m[✓]\x1b[0m TEST SUMMARY',
    `\x1b[90mGroup:    \x1b[0m ${displayName}`,
    `\x1b[90mPassed:   \x1b[0m ${passed}/${total}`,
    `\x1b[90mSuccess:  \x1b[0m ${total > 0 ? (passed/total*100).toFixed(1) : 0}%`,
  ]));
  
  return { passed, total, failed: total - passed };
}

export default runFrmD;