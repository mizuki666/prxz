function getAccessToken(p) {
    try {
        //console.log(p,'наш keypath') // --- временно keypath
        //console.log(sessionStorage,'наш sessionStorage') // --- временно sessionStorage
        const userData = sessionStorage.getItem(p); 

        return userData ? JSON.parse(userData).access_token : null;
    } catch (error) {
        console.log('Ошибка при получении токена:', error);
        return null;
    }
}

export {getAccessToken}