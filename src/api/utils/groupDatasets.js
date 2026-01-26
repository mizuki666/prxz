function groupDatasets(schedulersWithMoreInfo, dataDashboards){
    // console.log(schedulersWithMoreInfo,'schedulersWithMoreInfo')
    // console.log(dataDashboards,'dataDashboards')

    return schedulersWithMoreInfo.map(scheduler => {
        const relatedDashboards = dataDashboards.filter(
            dashboard => dashboard.dataset?.datasetId === scheduler.id
        );

        return {
            scheduler: scheduler,
            dashboards: relatedDashboards,
            dashboardCount: relatedDashboards.length,
        };
    });
}

export {groupDatasets}