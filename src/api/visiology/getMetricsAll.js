import { getAccessToken } from "../utils/getAccessToken";
import { getAnyPath } from "../utils/getMonoPath";
import { groupDatasets } from "../utils/groupDatasets";
import { checkerDeadshedulers } from "../utils/checkDeadShedulers";
import { getShedulersMore } from "../utils/getShedulersMore";

async function getMetricsAll(){
    const path = getAnyPath()
    const {shedulersLink, dashesLink, moreInfoLink, keyPath} = path
    //console.log(keyPath) // --- временно убрать
    const token = getAccessToken(keyPath)
    
    const [responseShedulers, responseDashboards, responseMetrics] = await Promise.all([
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
        }),
    ]);

    const [dataShedulers, dataDashboards] = await Promise.all([
        responseShedulers.json(),
        responseDashboards.json(),
        responseMetrics ? responseMetrics.json() : Promise.resolve(null)
    ]);
    // console.log('---СТАРТ getShedulersMore')
    const shedulersWithMoreInfo = await getShedulersMore(token, dataShedulers);

    // console.log('---СТАРТ groupDatasets')
    const groupedData = groupDatasets(shedulersWithMoreInfo, dataDashboards);
    
    // console.log('---СТАРТ checkerDeadshedulers')
    const deadshedulers = checkerDeadshedulers(shedulersWithMoreInfo, dataDashboards);

    const dataset = {
        dataShedulers: shedulersWithMoreInfo,
        dataDashboards: dataDashboards,
        dataAll: groupedData,
        deadshedulers: deadshedulers
    }

    return dataset
}

export {getMetricsAll}