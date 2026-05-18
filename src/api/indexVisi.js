import { getMetricsMono } from "./visiology/getMetricsMono"
import { getMetricsCurrent } from "./visiology/getMetricsCurrent"
import { getAccessToken } from "./utils/getAccessToken"
import { getShedulersMore } from "./utils/getShedulersMore"
import { groupDatasets } from "./utils/groupDatasets"

const visi = {
    final: {
        getMetricsMono,
        getMetricsCurrent
    }, 
    methods: {
        getAccessToken,
        getShedulersMore,
        groupDatasets
    }
};

export default visi