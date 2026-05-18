/**
 * Получает метрики мониторинга только для текущего дашборда
 * 
 * @async
 * @function getMetricsCurrent
 * @param {string|number} currentDashboardId - ID текущего дашборда
 * @returns {Promise<Object>} Объект с данными только текущего дашборда
 */

import { getAccessToken } from "../utils/getAccessToken";
import { getMonoPath } from "../utils/getMonoPath";
import { getMonoShedulerMore } from "../utils/getMonoShedulerMore";
import { getPermissionsDataset } from "../utils/getPermissionsDataset";
import { getPermissionsDashboard } from "../utils/getPermissionsDashboard";
import { getApiRLS } from "../utils/getApiRLS";

async function getMetricsCurrent() {
    const urlParams = new URLSearchParams(window.location.search);
    const currentDashboardId = urlParams.get('dashboardGuid');

    // Получение конфигурационных путей
    const path = getMonoPath();
    const { shedulersLink, moreInfoLink, dashesLink, tablesLink, keyPath, rlsRows } = path;
    
    // Получение токена доступа для аутентификации
    const token = getAccessToken(keyPath);
    
    // Параллельное выполнение запросов
    const [responseShedulers, responseDashboards] = await Promise.all([
        fetch(shedulersLink, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }).then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, name: responseShedulers`);
            }
            return response;
        }),
        
        fetch(dashesLink, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }).then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, name: responseDashboards`);
            }
            return response;
        })
    ]);

    // Парсинг JSON ответов
    const [dataShedulers, dataDashboards] = await Promise.all([
        responseShedulers.json(),
        responseDashboards.json()
    ]);

    const indexSX = dataDashboards.findIndex(v => v.guid === currentDashboardId);

    if (indexSX === -1) {
        console.warn(`Dashboard with guid ${currentDashboardId} not found`);
        return { indexSX: -1, schedulerSX: [] };
    }
    
    const targetSX = dataDashboards[indexSX];
    const targetSXdataset = targetSX.dataset.datasetId;
    const targetSXGuid = targetSX.guid
    const schedulerSX = targetSXdataset 
        ? dataShedulers.filter(v => v.id === targetSXdataset)
        : [];


    const moreInfoDataset = await getMonoShedulerMore(token, schedulerSX[0].id, moreInfoLink);
    const permissionsDataset = await getPermissionsDataset(token, schedulerSX[0].id, moreInfoLink)
    const permissionDashboard = await getPermissionsDashboard(token, targetSXGuid, dashesLink)
    const rlsDataset = await getApiRLS(token, moreInfoDataset, rlsRows)
    
    // Загружаем данные для всех таблиц
    const tables = await fastTable(moreInfoDataset.tables, tablesLink, token);
    
    const dataset = { targetSX, schedulerSX, moreInfoDataset, tables, permissionsDataset, permissionDashboard, rlsDataset, dataDashboards};

/**
 * Асинхронно загружает данные для всех таблиц из источников CSV/Excel
 * 
 * @async
 * @function fastTable
 * @param {Array} tb - Массив таблиц для обработки
 * @param {string} tablesLink - Базовый URL для запросов к таблицам
 * @param {string} token - Токен аутентификации
 * @param {string} targetSXdataset - ID целевого датасета
 * @param {number} [concurrency=10] - Лимит параллельных запросов
 * @returns {Promise<Array>} Массив таблиц, обогащенных полями tableData или error
 * 
 * @description
 * Функция загружает данные для таблиц, содержащих TempTableName или файлы .csv.
 * Запросы выполняются пакетами для предотвращения перегрузки сервера.
 * В случае ошибки таблица сохраняется с полем error, выполнение не прерывается.
 */

    async function fastTable(tb, tablesLink, token) {
        // Создаем массив промисов для параллельной загрузки данных всех таблиц
        const tablePromises = tb.map(async (v) => {
            try {
                const source = JSON.parse(v.source);
                const excel_id = source.DataSourceId

                if (source.TempTableName || source.SourceTableName?.includes('.csv')) {

                    const isCSV = source.SourceTableName?.includes('.csv')
                    if(isCSV){
                        const link = `${tablesLink}/datasets/${targetSXdataset}/datasources/CSV/${excel_id}`;

                        const response = await fetch(link, {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        });

                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status} for table ${source.TempTableName}`);
                        }

                        const tableData = await response.json();

                        // Возвращаем обогащенный объект таблицы с загруженными данными
                        return {
                            ...v,
                            tableData: tableData,
                        };
                    } else {
                        const link = `${tablesLink}/datasets/${targetSXdataset}/datasources/Excel/${excel_id}`;

                        const response = await fetch(link, {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        });

                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status} for table ${source.TempTableName}`);
                        }

                        const tableData = await response.json();
                        
                        // Возвращаем обогащенный объект таблицы с загруженными данными
                        return {
                            ...v,
                            tableData: tableData,
                        };
                    }
                }
                
                // Если нет TempTableName, возвращаем исходный объект
                return {
                    ...v,
                    source: source
                };
                
            } catch (error) {
                console.error(`Error loading table data:`, error);
                // В случае ошибки возвращаем исходный объект с информацией об ошибке
                return {
                    ...v,
                    source: JSON.parse(v.source),
                    error: error.message
                };
            }
        });

        // Ждем выполнения всех запросов параллельно
        return await Promise.all(tablePromises);
    }

    return dataset;
}

export { getMetricsCurrent };