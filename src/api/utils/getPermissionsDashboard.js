/**
 * Обогащает данные шедулеров дополнительной информацией из API
 * 
 * Функция последовательно запрашивает детальную информацию для каждого шедулера,
 * добавляя поля name, modifiedTime и modifiedBy. Для исключения перегрузки API
 * добавляет задержки между запросами.
 */

async function getPermissionsDashboard(accessToken, id_dashboard, dashesLink) {


    if (dashesLink == null || dashesLink === '') {
        throw new Error('getMonoShedulerMore: dashesLink is required');
    }

    // Выполняем запрос к API для получения детальной информации
    const permissionsDataset = await fetch(`${dashesLink}/${id_dashboard}/permission-mappings`, {
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
        console.warn(`Не удалось получить дополнительную информацию для шедулера ${id_dashboard}`);
    }
}

export { getPermissionsDashboard };