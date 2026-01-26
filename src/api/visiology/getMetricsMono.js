/**
 * Получает метрики мониторинга из одной рабочей области (в которой находится)
 * 
 * Функция выполняет сбор и агрегацию данных из различных эндпоинтов одной API для одной рабочей области :
 * 1. Получает данные шедулеров (расписаний)
 * 2. Получает данные дашбордов
 * 3. Обогащает данные шедулеров дополнительной информацией
 * 4. Группирует датасеты для удобного использования
 * 5. Проверяет неактивные шедулеры
 * 
 * @async
 * @function getMetricsMono
 * @returns {Promise<Object>} Объект с агрегированными данными метрик, содержащий:
 * @property {Array} dataShedulers - Обогащенные данные шедулеров
 * @property {Array} dataDashboards - Данные дашбордов
 * @property {Array} dataAll - Сгруппированные датасеты
 * @property {Array} deadshedulers - Список неактивных шедулеров
 * 
 * @throws {Error} Если произошла ошибка при выполнении HTTP-запросов
 * @example
 * try {
 *   const metrics = await getMetricsMono();
 *   console.log(metrics.dataAll);
 * } catch (error) {
 *   console.error('Ошибка получения метрик:', error);
 * }
 */
async function getMetricsMono() {
    // Получение конфигурационных путей для работы с Mono API
    const path = getMonoPath();
    const { shedulersLink, dashesLink, moreInfoLink, keyPath } = path;
    
    // Получение токена доступа для аутентификации
    const token = getAccessToken(keyPath);
    
    // Параллельное выполнение запросов для оптимизации времени выполнения
    // Используем Promise.all для одновременного получения данных шедулеров и дашбордов
    const [responseShedulers, responseDashboards, responseMetrics] = await Promise.all([
        // Запрос данных шедулеров (расписаний)
        fetch(shedulersLink, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }).then(response => {
            // Валидация ответа сервера
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, name: responseShedulers`);
            }
            return response;
        }),
        
        // Запрос данных дашбордов
        fetch(dashesLink, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }).then(response => {
            // Валидация ответа сервера
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, name: responseDashboards`);
            }
            return response;
        }),
        // Примечание: responseMetrics в текущей реализации всегда null,
        // так как соответствующий fetch запрос отсутствует
        // Это может быть задел на будущую функциональность
    ]);

    // Параллельный парсинг JSON ответов
    const [dataShedulers, dataDashboards] = await Promise.all([
        responseShedulers.json(),
        responseDashboards.json(),
        // responseMetrics всегда null в текущей реализации
        responseMetrics ? responseMetrics.json() : Promise.resolve(null)
    ]);

    // Обогащение данных шедулеров дополнительной информацией
    // Это позволяет получить более полную картину о каждом шедулере
    const shedulersWithMoreInfo = await getShedulersMore(token, dataShedulers);

    // Группировка датасетов для структурированного представления данных
    // Объединяет данные шедулеров и дашбордов в логические группы
    const groupedData = groupDatasets(shedulersWithMoreInfo, dataDashboards);
    
    // Проверка шедулеров на активность
    // Выявляет неработающие или "мертвые" шедулеры для дальнейшего анализа
    const deadshedulers = checkerDeadshedulers(shedulersWithMoreInfo, dataDashboards);

    // Формирование финального объекта с агрегированными данными
    const dataset = {
        // Обогащенные данные шедулеров
        dataShedulers: shedulersWithMoreInfo,
        // Данные дашбордов
        dataDashboards: dataDashboards,
        // Сгруппированные данные для удобного анализа
        dataAll: groupedData,
        // Список неактивных шедулеров для мониторинга проблем
        deadshedulers: deadshedulers
    };

    return dataset;
}

export { getMetricsMono };