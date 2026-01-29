import { getMetricsMono } from "./visiology/getMetricsMono"
import { getAccessToken } from "./utils/getAccessToken"
import { getShedulersMore } from "./utils/getShedulersMore"
import { groupDatasets } from "./utils/groupDatasets"

const visi = {
    final: {
        getMetricsMono
    }, 
    methods: {
        getAccessToken,
        getShedulersMore,
        groupDatasets
    }
};

export default visi