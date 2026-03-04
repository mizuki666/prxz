import { FormatValue } from './utils/formatValue.js';
import { FormatDate } from './utils/formatDate.js';
import { Logger } from './components/log/Logger.js';
import { FilterReplaceText } from './utils/filterText.js';
import { renderSlider } from './components/slider/Slider.js';

import visi from './api/indexVisi.js';

const prxz = {
    version: '1.0.1',
    api: {
        visi,
    },
    lg: Logger,
    frm: {
        v: FormatValue,
        d: FormatDate,
    },
    func: {
        FilterReplaceText,
    },
    comp: {
        photo: {},
        slider: {
            render: renderSlider,
        },
    },
};

export default prxz;