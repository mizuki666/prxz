/**
 * Обогащает данные шедулеров дополнительной информацией из API
 * 
 * Функция последовательно запрашивает детальную информацию для каждого шедулера,
 * добавляя поля name, modifiedTime и modifiedBy. Для исключения перегрузки API
 * добавляет задержки между запросами.
 */

async function getPermissionsDataset(accessToken, id_scheduler, moreInfoLink) {


    if (moreInfoLink == null || moreInfoLink === '') {
        throw new Error('getMonoShedulerMore: moreInfoLink is required');
    }

    // Выполняем запрос к API для получения детальной информации
    const permissionsDataset = await fetch(`${moreInfoLink}${id_scheduler}/permission-mappings`, {
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

export { getPermissionsDataset };