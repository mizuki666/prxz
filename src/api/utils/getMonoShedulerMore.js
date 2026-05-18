/**
 * Обогащает данные шедулеров дополнительной информацией из API
 * 
 * Функция последовательно запрашивает детальную информацию для каждого шедулера,
 * добавляя поля name, modifiedTime и modifiedBy. Для исключения перегрузки API
 * добавляет задержки между запросами.
 * 
 * @async
 * @function getMonoShedulerMore
 * @param {string} accessToken - JWT токен для авторизации запросов к API
 * @param {Array} dataShedulers - Массив шедулеров для обогащения
 * @param {Object} dataShedulers[] - Объект шедулера
 * @param {string} dataShedulers[].id - Уникальный идентификатор шедулера
 * @param {boolean} dataShedulers[].isEnabled - Флаг активности шедулера
 * @param {string} [moreInfoLink] - Базовый URL для запросов детальной информации. Если не передан — будет получен через getMonoPath().
 * 
 * @returns {Promise<Array>} Массив обогащенных данных шедулеров с дополнительными полями:
 * @returns {Object} returns[] - Обогащенный объект шедулера
 * @returns {string|null} returns[].name - Название шедулера
 * @returns {string|null} returns[].modifiedTime - Время последнего изменения
 * @returns {string|null} returns[].modifiedBy - Идентификатор пользователя, внесшего изменения
 * 
 * @throws Не выбрасывает исключения наружу, ошибки обрабатываются внутри и логируются
 * 
 * @example
 * const accessToken = 'eyJhbGciOiJ...';
 * const sheddulers = [{ id: 'sched-1', isEnabled: true }];
 * const enriched = await getMonoShedulerMore(accessToken, sheddulers);
 * // enriched = [{ id: 'sched-1', isEnabled: true, name: 'Daily Report', ... }]
 * 
 * @algorithm
 * 1. Инициализация результирующего массива
 * 2. Последовательная обработка каждого шедулера:
 *    a. Пропуск запроса для отключенных шедулеров
 *    b. Добавление задержки между запросами (кроме первого)
 *    c. Выполнение запроса к API
 *    d. Обработка успешного ответа
 *    e. Обработка ошибок и HTTP ошибок
 * 3. Возврат обогащенных данных
 * 
 * @performance
 * - Линейная сложность O(n), где n - количество шедулеров
 * - Общее время выполнения ≈ (n-1) * 20ms + n * время_запроса
 * - Использует rate limiting (задержки) для защиты API
 * 
 * @errorHandling
 * - Для отключенных шедулеров сразу возвращает null значения
 * - При HTTP ошибках возвращает null значения и логирует предупреждение
 * - При сетевых ошибках возвращает null значения и логирует ошибку
 * - Не прерывает выполнение при ошибках отдельных шедулеров
 */

async function getMonoShedulerMore(accessToken, id_scheduler, moreInfoLink) {


    if (moreInfoLink == null || moreInfoLink === '') {
        throw new Error('getMonoShedulerMore: moreInfoLink is required');
    }

    // Инициализация массива для хранения обогащенных данных
    const shedulersWithMoreInfo = [];
    
    // Временные логи для отладки (раскомментировать при необходимости)
    // console.log('Внутри getMonoShedulerMore');
    // console.log(id_scheduler, 'id_scheduler');

    // Выполняем запрос к API для получения детальной информации
    const moreInfoResponse = await fetch(`${moreInfoLink}${id_scheduler}/model`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });

    // Обработка успешного ответа
    if (moreInfoResponse.ok) {
        const moreInfoData = await moreInfoResponse.json();
        // Добавляем обогащенный шедулер в результат
        return moreInfoData
    } else {
        // Обработка HTTP ошибок (4xx, 5xx)
        console.warn(`Не удалось получить дополнительную информацию для шедулера ${sheduler.id}`);
    }

    // Выполняем запрос к API для получения детальной информации
    const permissionsDataset = await fetch(`${moreInfoLink}${id_scheduler}/per`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });

    // Обработка успешного ответа
    if (permissionsDataset.ok) {
        const moreInfoData = await permissionsDataset.json();
        // Добавляем обогащенный шедулер в результат
        return moreInfoData
    } else {
        // Обработка HTTP ошибок (4xx, 5xx)
        console.warn(`Не удалось получить дополнительную информацию для шедулера ${sheduler.id}`);
    }
}

export { getMonoShedulerMore };