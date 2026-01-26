async function getShedulersMore (accessToken, dataShedulers) {
    const schedulersWithMoreInfo = [];
    // console.log('Внутри getShedulersMore')
    // console.log(dataShedulers,'dataShedulers') // --- временно

    for (let i = 0; i < dataShedulers.length; i++) {
        const scheduler = dataShedulers[i];
        
        try {
            if (!scheduler.isEnabled) {
                schedulersWithMoreInfo.push({
                    ...scheduler,
                    name: null,
                    modifiedTime: null, 
                    modifiedBy: null
                });
                continue;
            }

            if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 20));
            }

            const moreInfoResponse = await fetch(`${moreInfoLink}${scheduler.id}/model`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (moreInfoResponse.ok) {
                const moreInfoData = await moreInfoResponse.json();
                schedulersWithMoreInfo.push({
                    ...scheduler,
                    name: moreInfoData.name || null,
                    modifiedTime: moreInfoData.modifiedTime || null,
                    modifiedBy: moreInfoData.modifiedBy || null
                });
            } else {
                console.warn(`Не удалось получить дополнительную информацию для шедулера ${scheduler.id}`);
                schedulersWithMoreInfo.push({
                    ...scheduler,
                    name: null,
                    modifiedTime: null,
                    modifiedBy: null
                });
            }
        } catch (error) {
            console.error(`Ошибка при получении информации для шедулера ${scheduler.id}:`, error);
            schedulersWithMoreInfo.push({
                ...scheduler,
                name: null,
                modifiedTime: null,
                modifiedBy: null
            });
        }
    }

    return schedulersWithMoreInfo;
}

export {getShedulersMore}