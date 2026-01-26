import { FormatValue } from './utils/formatValue.js';
import { FormatDate } from './utils/formatDate.js';
import { Logger } from './components/log/Logger.js';
import visi from './api/indexVisi.js';

const prxz = {
    version: '1.0.0',
    api:{
        visi
    },
    lg: Logger,
    frm: {
        v: FormatValue,
        d: FormatDate,
    }
};

export default prxz;