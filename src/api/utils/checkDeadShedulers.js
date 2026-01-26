function checkerDeadSchedulers(schedulersWithMoreInfo, dataDashboards){
    const deadSchedulers = schedulersWithMoreInfo.filter(scheduler => {
        return (
            scheduler.isEnabled === true &&
            !dataDashboards.some(dashboard => 
                dashboard.dataset?.datasetId === scheduler.id
            )
        );
    });

    return {
        deadSchedulers
    };
}

export {checkerDeadSchedulers}