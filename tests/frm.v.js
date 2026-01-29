// tests/frm.v.js
import { Logger } from '../bundler/Logger.js';
import { logHelper } from './helper/logHelper.js';
import { loadPrxz } from './utils/loadLibrary.js';

// Конфигурация тестов (можно менять через импортирующий код)
export const testConfig = {
  // Основные функции для тестирования
  fval: false,
  fperc: false,
  fmoney: false,
  fshortval: false,
  
  // Группы тестов для fval
  fvalBasicTests: true,
  fvalEdgeTests: true,
  fvalStringTests: true,
  fvalGarbageTests: true,
  fvalSpecialTests: true,
  
  // Группы тестов для других функций
  fpercTests: true,
  fmoneyTests: true,
  fshortvalTests: true,
  
  // Производительность
  performanceTests: true,
};

// Загружаем prxz и получаем fval
async function getPrxz() {
  const prxz = await loadPrxz();
  const { fval, fperc, fmoney, fshortval } = prxz.frm.v;
  return { fval, fperc, fmoney, fshortval };
}

/**
 * Создает тестовую функцию для fval
 */
function createTestFval(fval) {
  return function testFval(description, value, expected, decimals = 2, localize = true) {
    return logHelper(
      fval,
      description,
      [value, decimals, localize],
      expected
    );
  };
}

/**
 * Создает тестовую функцию для fperc
 */
function createTestFperc(fperc) {
  return function testFperc(description, value, expected, decimals = 2) {
    return logHelper(
      fperc,
      description,
      [value, decimals],
      expected
    );
  };
}

/**
 * Создает тестовую функцию для fmoney
 */
function createTestFmoney(fmoney) {
  return function testFmoney(description, value, expected, currency = 'RUB', decimals = 2) {
    return logHelper(
      fmoney,
      description,
      [value, currency, decimals],
      expected
    );
  };
}

/**
 * Создает тестовую функцию для fshortval
 */
function createTestFshortval(fshortval) {
  return function testFshortval(description, value, expected, decimals = 2) {
    return logHelper(
      fshortval,
      description,
      [value, decimals],
      expected
    );
  };
}

/**
 * Создает все тесты для fval
 */
function createFvalTests(testFval) {
  const basicTests = [
    () => testFval('Целое число', 123456789, '123\u202F456\u202F789,00'),
    () => testFval('Дробное число', 1234567.89, '1\u202F234\u202F567,89'),
    () => testFval('Меньше 1000', 999, '999,00'),
    () => testFval('Ровно 1000', 1000, '1\u202F000,00'),
    () => testFval('Ноль', 0, '0,00'),
    () => testFval('Отрицательное', -123456789, '-123\u202F456\u202F789,00'),
    () => testFval('Маленькое число', 0.0001, '0,0001'),
    () => testFval('Большое целое', 999999999999999, '999\u202F999\u202F999\u202F999\u202F999,00'),
  ];
  
  const edgeTests = [
    () => testFval('MAX_SAFE_INTEGER', Number.MAX_SAFE_INTEGER, '9\u202F007\u202F199\u202F254\u202F740\u202F991,00'),
    () => testFval('MIN_SAFE_INTEGER', Number.MIN_SAFE_INTEGER, '-9\u202F007\u202F199\u202F254\u202F740\u202F991,00'),
    () => testFval('Infinity', Infinity, '∞'),
    () => testFval('-Infinity', -Infinity, '-∞'),
    () => testFval('NaN', NaN, 'NaN'),
  ];
  
  const stringTests = [
    () => testFval('Строка целое', '123456789', '123\u202F456\u202F789,00'),
    () => testFval('Строка дробное', '1234567.89', '1\u202F234\u202F567,89'),
    () => testFval('С запятой как разделитель тысяч', '999,999.99', '999\u202F999,99'),
    () => testFval('С пробелом как разделителем', '999 999.99', '999\u202F999,99'),
    () => testFval('С несколькими пробелами', '999 999 999', '999\u202F999\u202F999,00'),
    () => testFval('Европейский формат', '1.234,56', '1,23'),
    () => testFval('С пробелами вокруг', '  123  ', '123,00'),
    () => testFval('С ведущими нулями', '0000123', '123,00'),
    () => testFval('С мусором в конце', '123abc', '123,00'),
    () => testFval('С мусором в начале', 'abc123', 'abc123'),
    () => testFval('Научная нотация', '1.234e5', '123\u202F400,00'),
    () => testFval('Научная нотация с +', '1.234E+5', '123\u202F400,00'),
  ];
  
  const garbageTests = [
    () => testFval('null', null, '-'),
    () => testFval('undefined', undefined, '-'),
    () => testFval('true', true, '1,00'),
    () => testFval('false', false, '0,00'),
    () => testFval('пустой массив', [], '-'),
    () => testFval('массив с числом', [123], '[123,00]'),
    () => testFval('массив с числами', [123, 456], '[123,00, 456,00]'),
    () => testFval('пустой объект', {}, null),
  ];
  
  const specialTests = [
    () => testFval('0.1 + 0.2', 0.1 + 0.2, '0,30'),
    () => testFval('1/3', 1/3, '0,33'),
    () => testFval('-0', -0, '0,00'),
    () => testFval('1e10', 1e10, '10\u202F000\u202F000\u202F000,00'),
  ];
  
  return { basicTests, edgeTests, stringTests, garbageTests, specialTests };
}

/**
 * Создает все тесты для fperc
 */
function createFpercTests(testFperc) {
  const fpercTests = [
    // Базовые тесты процентов
    () => testFperc('Простое число', 25.5, '25.50%'),
    () => testFperc('Целое число', 100, '100.00%'),
    () => testFperc('Ноль', 0, '0.00%'),
    () => testFperc('Отрицательное', -15.75, '-15.75%'),
    () => testFperc('Малое число', 0.123, '0.12%'),
    () => testFperc('Большое число', 9999.99, '9999.99%'),
    
    // Разное количество знаков после запятой
    () => testFperc('0 знаков после запятой', 25.5, '26%', 0),
    () => testFperc('1 знак после запятой', 25.55, '25.6%', 1),
    () => testFperc('3 знака после запятой', 25.5555, '25.556%', 3),
    () => testFperc('4 знака после запятой', 0.123456, '0.1235%', 4),
    
    // Граничные значения
    () => testFperc('null', null, '-'),
    () => testFperc('undefined', undefined, '-'),
    () => testFperc('Infinity', Infinity, 'Infinity%'),
    () => testFperc('-Infinity', -Infinity, '-Infinity%'),
    () => testFperc('NaN', NaN, 'NaN%'),
    
    // Строковые значения
    () => testFperc('Строка число', '25.5', '25.50%'),
    () => testFperc('Строка целое', '100', '100.00%'),
    () => testFperc('Строка отрицательное', '-15.75', '-15.75%'),
    () => testFperc('Строка не число', 'abc', 'abc'),
    () => testFperc('Строка с пробелами', '  25.5  ', '25.50%'),
    
    // Булевые значения
    () => testFperc('true', true, '1.00%'),
    () => testFperc('false', false, '0.00%'),
    
    // Очень маленькие и большие числа
    () => testFperc('Очень маленькое', 0.000001, '0.00%'),
    () => testFperc('Очень большое', 1000000, '1000000.00%'),
    () => testFperc('MAX_SAFE_INTEGER', Number.MAX_SAFE_INTEGER, '9007199254740991.00%'),
    () => testFperc('MIN_SAFE_INTEGER', Number.MIN_SAFE_INTEGER, '-9007199254740991.00%'),
    
    // Специальные математические случаи
    () => testFperc('1/3', 1/3, '0.33%'),
    () => testFperc('0.1 + 0.2', 0.1 + 0.2, '0.30%'),
    () => testFperc('PI', Math.PI, '3.14%'),
    () => testFperc('E', Math.E, '2.72%'),
    
    // Массивы и объекты (должны вести себя как строки)
    () => testFperc('Пустой массив', [], '-'),
    () => testFperc('Массив с числом', [25.5], '25.50%'),
    () => testFperc('Массив с числами', [25.5, 30], '25.50%'),
    () => testFperc('Объект', {value: 25.5}, '[object Object]%'),
  ];
  
  return fpercTests;
}

/**
 * Создает все тесты для fmoney
 */
function createFmoneyTests(testFmoney) {
    const fmoneyTests = [
      // Базовые тесты денежного формата (рубли)
      () => testFmoney('Целое число RUB', 123456789, '123\u202F456\u202F789,00 ₽', 'RUB'),
      () => testFmoney('Дробное число RUB', 1234567.89, '1\u202F234\u202F567,89 ₽', 'RUB'),
      () => testFmoney('Ноль RUB', 0, '0,00 ₽', 'RUB'),
      () => testFmoney('Отрицательное RUB', -1234567.89, '-1\u202F234\u202F567,89 ₽', 'RUB'),
      () => testFmoney('Малое число RUB', 0.01, '0,01 ₽', 'RUB'),
      
      // Разные валюты
      () => testFmoney('Доллары', 1234.56, '1\u202F234,56 $', 'USD'),
      () => testFmoney('Евро', 1234.56, '1\u202F234,56 €', 'EUR'),
      () => testFmoney('Фунты', 1234.56, '1\u202F234,56 £', 'GBP'),
      () => testFmoney('Йены', 1234.56, '1\u202F235 ¥', 'JPY', 0), // JPY обычно без копеек
      
      // Разное количество знаков после запятой
      () => testFmoney('0 знаков после запятой', 1234.56, '1\u202F235 ₽', 'RUB', 0),
      () => testFmoney('1 знак после запятой', 1234.56, '1\u202F234,6 ₽', 'RUB', 1),
      () => testFmoney('3 знака после запятой', 1234.567, '1\u202F234,567 ₽', 'RUB', 3),
      () => testFmoney('4 знака после запятой', 0.12345, '0,1235 ₽', 'RUB', 4),
      
      // Граничные значения
      () => testFmoney('null', null, '-', 'RUB'),
      () => testFmoney('undefined', undefined, '-', 'RUB'),
      () => testFmoney('Пустая строка', '', '-', 'RUB'),
      () => testFmoney('Infinity', Infinity, 'Infinity', 'RUB'),
      () => testFmoney('-Infinity', -Infinity, '-Infinity', 'RUB'),
      () => testFmoney('NaN', NaN, 'NaN', 'RUB'),
      
      // Строковые значения
      () => testFmoney('Строка число', '1234.56', '1\u202F234,56 ₽', 'RUB'),
      () => testFmoney('Строка отрицательное', '-1234.56', '-1\u202F234,56 ₽', 'RUB'),
      () => testFmoney('Строка не число', 'abc', 'abc', 'RUB'),
      () => testFmoney('Строка с пробелами', '  1234.56  ', '1\u202F234,56 ₽', 'RUB'),
      
      // Булевые значения
      () => testFmoney('true', true, '1,00 ₽', 'RUB'),
      () => testFmoney('false', false, '0,00 ₽', 'RUB'),
      
      // Очень большие и маленькие числа
      () => testFmoney('Очень большое число', 999999999999, '999\u202F999\u202F999\u202F999,00 ₽', 'RUB'),
      () => testFmoney('Очень маленькое число', 0.000001, '0,00 ₽', 'RUB'),
    ];
    
    return fmoneyTests;
  }

/**
 * Создает все тесты для fshortval
 */
function createFshortvalTests(testFshortval) {
  const fshortvalTests = [
    // Тысячи
    () => testFshortval('Тысячи положительные', 1234, '1.23 тыс'),
    () => testFshortval('Тысячи отрицательные', -1234, '-1.23 тыс'),
    () => testFshortval('Ровно 1000', 1000, '1.00 тыс'),
    () => testFshortval('Граница тысяч (999)', 999, '999.00'),
    () => testFshortval('Граница тысяч (1000)', 1000, '1.00 тыс'),
    () => testFshortval('Граница тысяч (999999)', 999999, '1000.00 тыс'),
    
    // Миллионы
    () => testFshortval('Миллионы положительные', 1234567, '1.23 млн'),
    () => testFshortval('Миллионы отрицательные', -1234567, '-1.23 млн'),
    () => testFshortval('Ровно 1 млн', 1000000, '1.00 млн'),
    () => testFshortval('Граница миллионов (999999)', 999999, '1000.00 тыс'),
    () => testFshortval('Граница миллионов (1000000)', 1000000, '1.00 млн'),
    () => testFshortval('Граница миллионов (999999999)', 999999999, '1000.00 млн'),
    
    // Миллиарды
    () => testFshortval('Миллиарды положительные', 1234567890, '1.23 млрд'),
    () => testFshortval('Миллиарды отрицательные', -1234567890, '-1.23 млрд'),
    () => testFshortval('Ровно 1 млрд', 1000000000, '1.00 млрд'),
    () => testFshortval('Граница миллиардов (999999999)', 999999999, '1000.00 млн'),
    () => testFshortval('Граница миллиардов (1000000000)', 1000000000, '1.00 млрд'),
    () => testFshortval('Граница миллиардов (999999999999)', 999999999999, '1000.00 млрд'),
    
    // Триллионы
    () => testFshortval('Триллионы положительные', 1234567890123, '1.23 трлн'),
    () => testFshortval('Триллионы отрицательные', -1234567890123, '-1.23 трлн'),
    () => testFshortval('Ровно 1 трлн', 1000000000000, '1.00 трлн'),
    () => testFshortval('Граница триллионов (999999999999)', 999999999999, '1000.00 млрд'),
    () => testFshortval('Граница триллионов (1000000000000)', 1000000000000, '1.00 трлн'),
    
    // Разное количество знаков после запятой
    () => testFshortval('0 знаков после запятой', 1234, '1 тыс', 0),
    () => testFshortval('1 знак после запятой', 1234, '1.2 тыс', 1),
    () => testFshortval('3 знака после запятой', 1234567, '1.235 млн', 3),
    () => testFshortval('4 знака после запятой', 1234567, '1.2346 млн', 4),
    
    // Граничные значения
    () => testFshortval('null', null, '-'),
    () => testFshortval('undefined', undefined, '-'),
    () => testFshortval('Пустая строка', '', '-'),
    () => testFshortval('Infinity', Infinity, 'Infinity'),
    () => testFshortval('-Infinity', -Infinity, '-Infinity'),
    () => testFshortval('NaN', NaN, 'NaN'),
    () => testFshortval('Ноль', 0, '0.00'),
    () => testFshortval('Очень маленькое число', 0.0001, '0.00'),
    
    // Строковые значения
    () => testFshortval('Строка число', '1234', '1.23 тыс'),
    () => testFshortval('Строка отрицательное', '-1234', '-1.23 тыс'),
    () => testFshortval('Строка не число', 'abc', 'abc'),
    () => testFshortval('Строка с пробелами', '  1234  ', '1.23 тыс'),
    
    // Булевые значения
    () => testFshortval('true', true, '1.00'),
    () => testFshortval('false', false, '0.00'),
    
    // Специальные кейсы округления
    () => testFshortval('Округление', 1544, '1.54 тыс'),
    () => testFshortval('Большое целое', 999999999999999, '1000.00 трлн'),
  ];
  
  return fshortvalTests;
}

/**
 * Запускает группу тестов
 */
function runTestGroup(tests, groupName, config, groupConfigKey) {
  if (!config[groupConfigKey]) {
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
function runPerformanceTests(fval, fperc, fmoney, fshortval, config) {
  if (!config.performanceTests) {
    console.log('\n\x1b[90m[Производительность] Пропущено\x1b[0m');
    return {};
  }
  
  console.log('\n\x1b[36m=== Производительность ===\x1b[0m');
  
  const results = {};
  
  if (config.fval) {
    console.log('\n\x1b[90m[Тест fval]\x1b[0m');
    const startFval = performance.now();
    for (let i = 0; i < 10000; i++) {
      fval(Math.random() * 1000000);
    }
    const endFval = performance.now();
    results.fval = endFval - startFval;
    console.log(`10k вызовов fval: ${results.fval.toFixed(2)}ms`);
  }
  
  if (config.fperc) {
    console.log('\n\x1b[90m[Тест fperc]\x1b[0m');
    const startFperc = performance.now();
    for (let i = 0; i < 10000; i++) {
      fperc(Math.random() * 100);
    }
    const endFperc = performance.now();
    results.fperc = endFperc - startFperc;
    console.log(`10k вызовов fperc: ${results.fperc.toFixed(2)}ms`);
  }
  
  if (config.fmoney) {
    console.log('\n\x1b[90m[Тест fmoney]\x1b[0m');
    const startFmoney = performance.now();
    for (let i = 0; i < 10000; i++) {
      fmoney(Math.random() * 1000000);
    }
    const endFmoney = performance.now();
    results.fmoney = endFmoney - startFmoney;
    console.log(`10k вызовов fmoney: ${results.fmoney.toFixed(2)}ms`);
  }
  
  if (config.fshortval) {
    console.log('\n\x1b[90m[Тест fshortval]\x1b[0m');
    const startFshortval = performance.now();
    for (let i = 0; i < 10000; i++) {
      fshortval(Math.random() * 1000000000000);
    }
    const endFshortval = performance.now();
    results.fshortval = endFshortval - startFshortval;
    console.log(`10k вызовов fshortval: ${results.fshortval.toFixed(2)}ms`);
  }
  
  return results;
}

/**
 * Основная функция для запуска всех тестов
 */
export async function runFrmV(customConfig = {}) {
  // Объединяем конфиг по умолчанию с пользовательским
  const config = { ...testConfig, ...customConfig };
  
  // Получаем функции из библиотеки
  const { fval, fperc, fmoney, fshortval } = await getPrxz();
  
  console.log('\n=== STARTING FRM.V TESTS ===\n');
  console.log('\x1b[90mКонфигурация:\x1b[0m');
  console.log(`  fval: ${config.fval ? '\x1b[32mвключено\x1b[0m' : '\x1b[90mвыключено\x1b[0m'}`);
  console.log(`  fperc: ${config.fperc ? '\x1b[32mвключено\x1b[0m' : '\x1b[90mвыключено\x1b[0m'}`);
  console.log(`  fmoney: ${config.fmoney ? '\x1b[32mвключено\x1b[0m' : '\x1b[90mвыключено\x1b[0m'}`);
  console.log(`  fshortval: ${config.fshortval ? '\x1b[32mвключено\x1b[0m' : '\x1b[90mвыключено\x1b[0m'}`);
  
  let passed = 0;
  let total = 0;
  const results = {};
  
  // Создаем тестовые функции
  const testFval = createTestFval(fval);
  const testFperc = createTestFperc(fperc);
  const testFmoney = createTestFmoney(fmoney);
  const testFshortval = createTestFshortval(fshortval);
  
  // Запускаем тесты fval если включены
  if (config.fval) {
    const fvalTests = createFvalTests(testFval);
    
    const fvalTestGroups = [
      { name: 'Базовые числа (fval)', tests: fvalTests.basicTests, configKey: 'fvalBasicTests' },
      { name: 'Граничные значения (fval)', tests: fvalTests.edgeTests, configKey: 'fvalEdgeTests' },
      { name: 'Строковые числа (fval)', tests: fvalTests.stringTests, configKey: 'fvalStringTests' },
      { name: 'Мусор и edge cases (fval)', tests: fvalTests.garbageTests, configKey: 'fvalGarbageTests' },
      { name: 'Специальные кейсы (fval)', tests: fvalTests.specialTests, configKey: 'fvalSpecialTests' },
    ];
    
    for (const group of fvalTestGroups) {
      const result = runTestGroup(group.tests, group.name, config, group.configKey);
      passed += result.passed;
      total += result.total;
      results[group.configKey] = result;
    }
  }
  
  // Запускаем тесты fperc если включены
  if (config.fperc && config.fpercTests) {
    const fpercTests = createFpercTests(testFperc);
    const result = runTestGroup(fpercTests, 'Тесты fperc (форматирование процентов)', config, 'fpercTests');
    passed += result.passed;
    total += result.total;
    results.fpercTests = result;
  }
  
  // Запускаем тесты fmoney если включены
  if (config.fmoney && config.fmoneyTests) {
    const fmoneyTests = createFmoneyTests(testFmoney);
    const result = runTestGroup(fmoneyTests, 'Тесты fmoney (денежный формат)', config, 'fmoneyTests');
    passed += result.passed;
    total += result.total;
    results.fmoneyTests = result;
  }
  
  // Запускаем тесты fshortval если включены
  if (config.fshortval && config.fshortvalTests) {
    const fshortvalTests = createFshortvalTests(testFshortval);
    const result = runTestGroup(fshortvalTests, 'Тесты fshortval (сокращенные числа)', config, 'fshortvalTests');
    passed += result.passed;
    total += result.total;
    results.fshortvalTests = result;
  }
  
  // Запускаем тесты производительности
  const perfResults = runPerformanceTests(fval, fperc, fmoney, fshortval, config);
  
  // Выводим итоги
  console.log('\n' + Logger.createBox([
    '\x1b[32m[✓]\x1b[0m TEST SUMMARY',
    `\x1b[90mPassed:   \x1b[0m ${passed}/${total}`,
    `\x1b[90mSuccess:  \x1b[0m ${total > 0 ? (passed/total*100).toFixed(1) : 0}%`,
    `\x1b[90mTotal tests: \x1b[0m ${total}`,
    ...(perfResults.fval ? [`\x1b[90mfval performance: \x1b[0m ${perfResults.fval.toFixed(2)}ms`] : []),
    ...(perfResults.fperc ? [`\x1b[90mfperc performance: \x1b[0m ${perfResults.fperc.toFixed(2)}ms`] : []),
    ...(perfResults.fmoney ? [`\x1b[90mfmoney performance: \x1b[0m ${perfResults.fmoney.toFixed(2)}ms`] : []),
    ...(perfResults.fshortval ? [`\x1b[90mfshortval performance: \x1b[0m ${perfResults.fshortval.toFixed(2)}ms`] : [])
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
 * Функция для запуска тестов отдельной функции
 */
export async function runFunctionTests(functionName, customConfig = {}) {
  const config = { ...testConfig, ...customConfig };
  
  // Получаем функции из библиотеки
  const { fval, fperc, fmoney, fshortval } = await getPrxz();
  
  let testFunction;
  let createTestsFunction;
  
  switch (functionName) {
    case 'fval':
      if (!config.fval) return { passed: 0, total: 0, message: 'fval tests are disabled' };
      testFunction = createTestFval(fval);
      createTestsFunction = createFvalTests;
      break;
    case 'fperc':
      if (!config.fperc) return { passed: 0, total: 0, message: 'fperc tests are disabled' };
      testFunction = createTestFperc(fperc);
      createTestsFunction = () => ({ allTests: createFpercTests(testFunction) });
      break;
    case 'fmoney':
      if (!config.fmoney) return { passed: 0, total: 0, message: 'fmoney tests are disabled' };
      testFunction = createTestFmoney(fmoney);
      createTestsFunction = () => ({ allTests: createFmoneyTests(testFunction) });
      break;
    case 'fshortval':
      if (!config.fshortval) return { passed: 0, total: 0, message: 'fshortval tests are disabled' };
      testFunction = createTestFshortval(fshortval);
      createTestsFunction = () => ({ allTests: createFshortvalTests(testFunction) });
      break;
    default:
      throw new Error(`Unknown function: ${functionName}`);
  }
  
  console.log(`\n=== STARTING TESTS FOR ${functionName.toUpperCase()} ===\n`);
  
  const tests = createTestsFunction(testFunction);
  let passed = 0;
  let total = 0;
  
  // Запускаем все тесты для этой функции
  if (functionName === 'fval') {
    const groups = [
      { name: 'Базовые числа', tests: tests.basicTests, configKey: 'fvalBasicTests' },
      { name: 'Граничные значения', tests: tests.edgeTests, configKey: 'fvalEdgeTests' },
      { name: 'Строковые числа', tests: tests.stringTests, configKey: 'fvalStringTests' },
      { name: 'Мусор и edge cases', tests: tests.garbageTests, configKey: 'fvalGarbageTests' },
      { name: 'Специальные кейсы', tests: tests.specialTests, configKey: 'fvalSpecialTests' },
    ];
    
    for (const group of groups) {
      if (config[group.configKey]) {
        console.log(`\n\x1b[36m=== ${group.name} ===\x1b[0m`);
        for (const test of group.tests) {
          total++;
          try {
            if (test()) passed++;
          } catch (e) {
            console.log(`❌ Test failed with error: ${e.message}`);
          }
        }
      }
    }
  } else {
    console.log(`\n\x1b[36m=== Все тесты для ${functionName} ===\x1b[0m`);
    for (const test of tests.allTests) {
      total++;
      try {
        if (test()) passed++;
      } catch (e) {
        console.log(`❌ Test failed with error: ${e.message}`);
      }
    }
  }
  
  console.log('\n' + Logger.createBox([
    '\x1b[32m[✓]\x1b[0m TEST SUMMARY',
    `\x1b[90mFunction: \x1b[0m ${functionName}`,
    `\x1b[90mPassed:   \x1b[0m ${passed}/${total}`,
    `\x1b[90mSuccess:  \x1b[0m ${total > 0 ? (passed/total*100).toFixed(1) : 0}%`,
  ]));
  
  return { passed, total, failed: total - passed };
}

export default runFrmV;