/**
 * Получает RLS-членства для каждой роли датасета
 * @param {string} accessToken - токен доступа
 * @param {object} dataset - объект датасета с id и массивом roles
 * @param {string} rlsLink - базовый URL для запросов
 * @returns {Promise<Array>} массив результатов RLS-членств с именами и временем
 */
async function getApiRLS(accessToken, dataset, rlsLink) {
    const {id, roles} = dataset

    if (rlsLink == null || rlsLink === '') {
        throw new Error('getApiRLS: rlsLink is required');
    }

    if (roles.length === 0) {
        return []
    }

    const results = await Promise.all(
        roles.map(async (v) => {
            const rlsGUID = v.id
            const {modifiedTime, name} = v
            
            try {
                const rlsDataset = await fetch(`${rlsLink}${id}/roles/${rlsGUID}/memberships?roleType=Rls`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (rlsDataset.ok) {
                    const moreInfoData = await rlsDataset.json();
                    // Возвращаем RLS данные вместе с именем и временем модификации роли
                    return {
                        roleName: name,
                        modifiedTime: modifiedTime,
                        rlsData: moreInfoData
                    }
                } else {
                    console.warn(`Не удалось получить RLS для роли ${rlsGUID} (${name})`);
                    return {
                        roleName: name,
                        modifiedTime: modifiedTime,
                        rlsData: null,
                        error: `HTTP ${rlsDataset.status}`
                    }
                }
            } catch (error) {
                console.error(`Ошибка при получении RLS для роли ${rlsGUID} (${name}):`, error);
                return {
                    roleName: name,
                    modifiedTime: modifiedTime,
                    rlsData: null,
                    error: error.message
                }
            }
        })
    )

    return results
}

export { getApiRLS };