/**
 * Проверяет и идентифицирует "мертвые" шедулеры (неработающие планировщики)
 * 
 * "Мертвым" считается шедулер, который:
 * 1. Имеет статус включенного (isEnabled === true)
 * 2. Не имеет связанного дашборда в системе мониторинга
 * 
 * Такая ситуация может возникать, когда:
 * - Шедулер был создан, но не настроен для отображения метрик
 * - Дашборд был удален, а шедулер остался активным
 * - Возникли проблемы с привязкой датасетов
 * 
 * @function checkerDeadshedulers
 * @param {Array} shedulersWithMoreInfo - Массив обогащенных данных шедулеров
 * @param {Object[]} shedulersWithMoreInfo[].id - Уникальный идентификатор шедулера
 * @param {boolean} shedulersWithMoreInfo[].isEnabled - Статус активности шедулера
 * @param {Object} dataDashboards - Данные дашбордов из системы мониторинга
 * @param {Object} dataDashboards.dataset - Объект датасета дашборда
 * @param {string} dataDashboards.dataset.datasetId - ID связанного шедулера
 * @returns {Object} Объект, содержащий массив "мертвых" шедулеров
 * @returns {Array} returns.deadshedulers - Отфильтрованный массив шедулеров, соответствующих критериям
 * 
 * @example
 * const result = checkerDeadshedulers(
 *   [
 *     { id: 'scheduler-1', isEnabled: true, name: 'Daily Report' },
 *     { id: 'scheduler-2', isEnabled: false, name: 'Weekly Backup' }
 *   ],
 *   [
 *     { dataset: { datasetId: 'scheduler-2' } }
 *   ]
 * );
 * // result.deadshedulers = [{ id: 'scheduler-1', isEnabled: true, name: 'Daily Report' }]
 * 
 * @complexity
 * Временная сложность: O(n*m), где:
 * n - количество шедулеров
 * m - количество дашбордов
 * 
 * Пространственная сложность: O(k), где k - количество "мертвых" шедулеров
 */
function checkerDeadshedulers(shedulersWithMoreInfo, dataDashboards) {
    const deadshedulers = shedulersWithMoreInfo.filter(sheduler => {
        // Условие 1: Шедулер должен быть включен
        const isShedulerEnabled = sheduler.isEnabled === true;
        
        // Условие 2: Не должно быть связанного дашборда
        // Проверяем, существует ли хотя бы один дашборд, ссылающийся на этот шедулер
        const hasLinkedDashboard = dataDashboards.some(dashboard => {
            return dashboard.dataset?.datasetId === sheduler.id;
        });
        
        // Шедулер считается "мертвым", если он включен И не имеет связанного дашборда
        return isShedulerEnabled && !hasLinkedDashboard;
    });

    // Возвращаем результат в структурированном формате
    return {
        deadshedulers
    };
}

export { checkerDeadshedulers };