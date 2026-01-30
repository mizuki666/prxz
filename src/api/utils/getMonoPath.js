/**
 * Формирует URL-адреса для доступа к API на основе текущего домена и workspaceId
 * 
 * Функция анализирует текущий URL страницы, извлекает домен и workspaceId из query-параметров,
 * затем формирует полные пути к различным эндпоинтам API системы мониторинга.
 * 
 * @function getMonoPath
 * @returns {Object} Объект с полными URL для доступа к API
 * @returns {string} returns.shedulersLink - URL для получения данных шедулеров
 * @returns {string} returns.dashesLink - URL для получения данных дашбордов
 * @returns {string} returns.moreInfoLink - URL для получения детальной информации о датасетах
 * @returns {string} returns.workspaceAllLink - URL для получения информации о рабочих пространствах
 * @returns {string} returns.keyPath - Ключ для доступа к данным авторизации в sessionStorage
 * 
 * @example
 * // При URL: https://monitoring.example.com/app?workspaceId=12345&view=dashboard
 * const paths = getMonoPath();
 * // paths.shedulersLink = 'https://visiology/data-management-service/api/v1/workspaces/12345/scheduled-refresh/GetAll'
 * // paths.keyPath = 'oidc.user:https://visiology/keycloak/realms/Visiology:visiology_designer'
 * 
 * @dependency
 * - Требует наличия workspaceId в query-параметрах URL
 * - Зависит от стандартного API браузера (window.location, URL)
 * 
 * @note
 * - workspaceId должен присутствовать в URL как параметр запроса
 * - Все сгенерированные URL используют HTTPS протокол
 * - Домен берется из текущего окна браузера
 * - В случае отсутствия workspaceId, в URL будет подставлено значение "undefined"
 * 
 * @log
 * - Выводит в консоль найденный workspaceId или сообщение об его отсутствии
 * - Предназначено для отладки, в production может быть отключено
 * 
 * @security
 * - Использует только HTTPS протокол
 * - Не передает чувствительные данные в URL
 * - Ключ для sessionStorage формируется на основе домена
 */
function getMonoPath() {
    // Получаем текущий URL страницы для анализа
    let mainHref = window.location.href;
    let url = new URL(mainHref);
    // Извлекаем доменное имя (без протокола и порта)
    let domain = url.hostname;
    
    // Разбиваем URL на части по амперсанду для поиска query-параметров
    // Это альтернатива использованию url.searchParams, оставлена для совместимости
    let paramsArray = mainHref.split('&');
    
    // Ищем параметр workspaceId среди всех query-параметров
    let workspaceId = paramsArray.find(param => param.includes('workspaceId='));
    
    if (workspaceId) {
        // Извлекаем значение параметра (часть после '=')
        // Пример: "workspaceId=12345" -> "12345"
        workspaceId = workspaceId.split('=')[1];
        
        // Логирование для отладки
        // console.log('Найден workspaceId:', workspaceId);
    } else {
        // Предупреждение о потенциальной проблеме конфигурации
        console.log('workspaceId не найден');
        // workspaceId останется undefined, что приведет к некорректным URL
    }
    
    const shedulersLink = 'https://' + domain + 
        '/data-management-service/api/v1/workspaces/' + workspaceId + 
        '/scheduled-refresh/GetAll';
    
    const dashesLink = 'https://' + domain + 
        '/dashboard-service/api/workspaces/' + workspaceId + 
        '/dashboards';
    
    const moreInfoLink = 'https://' + domain + 
        '/formula-engine/api/v1/workspaces/' + workspaceId + 
        '/datasets/';
    
    const workspaceAllLink = 'https://' + domain + 
        '/workspace-service/api/v1/evaluate-workspaces-with-role';
    
    const keyPath = 'oidc.user:https://' + domain + 
        '/keycloak/realms/Visiology:visiology_designer';
    
    // Собираем все сгенерированные пути в единый объект
    const path = {
        shedulersLink,    // API шедулеров
        dashesLink,       // API дашбордов
        moreInfoLink,     // API детальной информации
        workspaceAllLink, // API рабочих пространств
        keyPath          // Ключ для токена
    };
    
    return path;
}

export { getMonoPath };