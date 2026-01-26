/**
 * Группирует шедулеры с привязанными к ним дашбордами
 * Создает структуру "один шедулер → множество дашбордов" для удобства анализа
 * 
 * @function groupDatasets
 * @param {Object[]} shedulersWithMoreInfo - Массив объектов шедулеров
 * @param {string} shedulersWithMoreInfo[].id - Уникальный идентификатор шедулера
 * @param {Object[]} dataDashboards - Массив объектов дашбордов
 * @param {Object} [dataDashboards[].dataset] - Опциональный объект датасета
 * @param {string} [dataDashboards[].dataset.datasetId] - ID связанного шедулера
 * @returns {Object[]} Массив объектов сгруппированных данных
 * @returns {Object} returns[].sheduler - Исходный объект шедулера
 * @returns {Object[]} returns[].dashboards - Массив связанных дашбордов
 * @returns {number} returns[].dashboardCount - Количество связанных дашбордов
 * 
 * @example
 * // Шедулер с двумя дашбордами
 * const sheduler = { id: 's1', name: 'Daily Sync' };
 * const dashboards = [
 *   { id: 'd1', dataset: { datasetId: 's1' } },
 *   { id: 'd2', dataset: { datasetId: 's1' } }
 * ];
 * const result = groupDatasets([sheduler], dashboards);
 * // result[0].dashboardCount === 2
 * 
 * @example
 * // Шедулер без дашбордов
 * const result = groupDatasets([{ id: 's2' }], []);
 * // result[0].dashboards === []
 * // result[0].dashboardCount === 0
 * 
 * @complexity O(n*m) где n - количество шедулеров, m - количество дашбордов
 * @performance Используйте с осторожностью при больших объемах данных (>1000 элементов)
 * @sideeffect Чистая функция, не изменяет входные данные
 */
function groupDatasets(shedulersWithMoreInfo, dataDashboards) {
    // Раскомментировать для отладки
    // console.log('Шедулеры:', shedulersWithMoreInfo);
    // console.log('Дашборды:', dataDashboards);
    
    return shedulersWithMoreInfo.map(sheduler => {
        // Находим все дашборды, ссылающиеся на текущий шедулер
        const relatedDashboards = dataDashboards.filter(dashboard => 
            dashboard.dataset?.datasetId === sheduler.id
        );

        return {
            sheduler,                    // Исходный шедулер
            dashboards: relatedDashboards, // Привязанные дашборды
            dashboardCount: relatedDashboards.length // Количество для быстрого доступа
        };
    });
}

export { groupDatasets };