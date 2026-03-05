import { FormatValue } from './utils/formatValue.js';
import { FormatDate } from './utils/formatDate.js';
import { Logger } from './components/log/Logger.js';
import { FilterReplaceText } from './utils/filterText.js';
import { genId } from './utils/genId.js';
import { renderSlider } from './components/slider/Slider.js';
import { renderTable } from './components/table/Table.js';

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
        other: {
            FilterReplaceText,
            genId
        },
    },
    comp: {
        photo: {
            slider: {
                render: renderSlider,
            },
        },
        table: {
            simple:{
                render: renderTable
            }
        }
    },
};

export default prxz;