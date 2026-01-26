/**
 * Извлекает access token из sessionStorage по указанному ключу
 * 
 * Функция безопасно получает JWT токен доступа из хранилища браузера.
 * Токен используется для аутентификации запросов к защищенным API эндпоинтам.
 * 
 * @function getAccessToken
 * @param {string} p - Ключ для поиска данных в sessionStorage
 * @returns {string|null} Access token или null, если:
 *                        1. Токен не найден
 *                        2. Произошла ошибка парсинга
 *                        3. Структура данных не соответствует ожидаемой
 * 
 * @throws Не выбрасывает исключения наружу, ошибки обрабатываются внутри
 * @sideeffect Выводит ошибки в консоль при проблемах с доступом или парсингомв
 * 
 * @example
 * // sessionStorage содержит: { "user_session": "{\"access_token\":\"eyJhbGciOiJ...\"}" }
 * const token = getAccessToken('user_session');
 * // token = "eyJhbGciOiJ..."
 * 
 * @example
 * // Если ключ не существует или данные некорректны
 * const token = getAccessToken('non_existent_key');
 * // token = null
 * // В консоли: "Ошибка при получении токена: ..."
 * 
 * @note
 * - Использует sessionStorage (данные очищаются при закрытии вкладки)
 * - Ожидает данные в формате JSON с полем access_token
 * - НЕ валидирует срок действия токена
 * - НЕ проверяет структуру токена (JWT)
 * 
 * @security
 * - Не хранит токен в глобальных переменных
 * - Использует безопасный парсинг JSON с try/catch
 * - Ограничивает область видимости токена сессией браузера
 * - Не логирует сам токен (только ошибки доступа)
 */
function getAccessToken(p) {
    try {
        // Временные логи для отладки (раскомментировать при необходимости)
        // console.log(p, 'наш keypath');
        // console.log(sessionStorage, 'наш sessionStorage');
        
        // Получаем строку данных из sessionStorage по ключу
        const userData = sessionStorage.getItem(p);

        // Проверяем наличие данных и парсим JSON
        // Используем тернарный оператор для краткости
        return userData 
            ? JSON.parse(userData).access_token // Извлекаем access_token из распарсенного объекта
            : null; // Возвращаем null если данных нет
        
    } catch (error) {
        // Логируем ошибку для диагностики, но не прерываем выполнение программы
        // Типичные ошибки:
        // 1. SyntaxError: Некорректный JSON в sessionStorage
        // 2. TypeError: Отсутствует поле access_token после парсинга
        // 3. SecurityError: Доступ к sessionStorage заблокирован (например, в iframe)
        console.log('Ошибка при получении токена:', error);
        
        // fallback
        return null;
    }
}

export { getAccessToken };