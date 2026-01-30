//tests/helper/logHelper.js
import { Logger } from '../../bundler/Logger.js';
const { success, error } = Logger;

/**
 * Универсальная функция для тестирования
 * @param {Function} testFunc - Функция для тестирования
 * @param {string} description - Описание теста
 * @param {Array|Object} input - Входные параметры (массив или объект)
 * @param {*} expected - Ожидаемый результат
 * @param {Function} [comparator] - Функция сравнения результатов (по умолчанию строгое равенство)
 * @returns {boolean} - Результат теста (true/false)
 */

export function logHelper(testFunc, description, input, expected, comparator = (a, b) => a === b) {
    const result = Array.isArray(input) 
        ? testFunc(...input)  // Если входные данные - массив, распаковываем как аргументы
        : testFunc(input);    // Иначе передаем как есть
    
    const passed = comparator(result, expected);
    
    if (passed) {
        success(`✓ ${description}: ${JSON.stringify(input)} -> ${JSON.stringify(result)}`);
    } else {
        error(`✗ ${description}: ${JSON.stringify(input)} -> ${JSON.stringify(result)} (expected: ${JSON.stringify(expected)})`);
    }
    
    return passed;
}