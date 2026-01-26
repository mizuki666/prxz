function getMonoPath(){
    let mainHref = window.location.href; // получаем базовую ссылку
    let url = new URL(mainHref);
    let domain = url.hostname; // получаем домен
    let paramsArray = mainHref.split('&');
    
    // Найти параметр с workspaceId
    let workspaceId = paramsArray.find(param => param.includes('workspaceId='));
    
    if (workspaceId) {
        // Извлекаем только значение ID
        workspaceId = workspaceId.split('=')[1];
        console.log('Найден workspaceId:', workspaceId);
    } else {
        console.log('workspaceId не найден');
    }
    
    // формируем ссылки
    const shedulersLink = 'https://'+ domain +'/data-management-service/api/v1/workspaces/' + workspaceId + '/scheduled-refresh/GetAll'
    const dashesLink = 'https://'+ domain +'/dashboard-service/api/workspaces/' + workspaceId + '/dashboards'
    const moreInfoLink = 'https://'+ domain +'/formula-engine/api/v1/workspaces/' + workspaceId + '/datasets/'
    const workspaceAllLink = 'https://'+ domain + '/workspace-service/api/v1/evaluate-workspaces-with-role'
    const keyPath = 'oidc.user:https://' + domain + '/keycloak/realms/Visiology:visiology_designer'

    const path ={
        shedulersLink,
        dashesLink,
        moreInfoLink,
        workspaceAllLink,
        keyPath
    }
    return path    
}

export {getMonoPath}