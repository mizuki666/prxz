import { genId } from '../../utils/genId.js';
import { FormatValue } from '../../utils/formatValue.js';
import { FormatDate } from '../../utils/formatDate.js';

const DEFAULT_MIN_COL_WIDTH = 'auto';

/** Стили по умолчанию для таблицы (шрифт, цвет), если не заданы в widgetStyle. */
const DEFAULT_TABLE_FONT = {
    fontFamily: 'Open Sans',
    fontSize: '14px',
    color: '#333333',
    fontStyle: 'normal',
    fontWeight: 'normal',
    lineHeight: 1.5,
    textAlign: 'left',
};

/**
 * Преобразует объект стилей виджета (w.style: align, color, fontFamily, fontSize, …) в формат для styleTable/styleTh/styleTd.
 * @param {Object} w - { align?, color?, fontFamily?, fontSize?, fontStyle?, fontWeight?, lineHeight?, textOutline? }
 * @returns {Object}
 */
function widgetStyleToTableStyle(w) {
    if (!w || typeof w !== 'object') return {};
    const m = {};
    if (w.align != null && w.align !== '') m.textAlign = w.align;
    if (w.color != null && w.color !== '') m.color = w.color;
    if (w.fontFamily != null && w.fontFamily !== '') m.fontFamily = w.fontFamily;
    if (w.fontSize != null && w.fontSize !== '') m.fontSize = w.fontSize;
    if (w.fontStyle != null && w.fontStyle !== '') m.fontStyle = w.fontStyle;
    if (w.fontWeight != null && w.fontWeight !== '') m.fontWeight = w.fontWeight;
    if (w.lineHeight != null && w.lineHeight !== '') m.lineHeight = String(w.lineHeight);
    if (w.textOutline != null && w.textOutline !== 0 && w.textOutline !== '0') {
        m.webkitTextStroke = `${w.textOutline}px`;
    }
    return m;
}

const DEFAULT_CONFIG = {
    container: null,
    dataset: [],
    columns: [],
    columnWidths: null,
    columnFormatters: null,
    stickyHeader: true,
    borderCollapse: 'collapse',
    borderSpacing: '0',
    isScrolling: false,
    /** Количество столбцов, закреплённых слева (как в Excel). Остальные прокручиваются по горизонтали. 0 — отключено. */
    pinnedColumns: 0,
    /** При включённой прокрутке (pinnedColumns > 0): true — применять rowStyle только к ячейкам в области скролла; false — ко всей строке. */
    rowColorPinnedOnly: false,
    onRowClick: null,
    onCellClick: null,
    /** Удобное условное форматирование: классы / стили для строк и ячеек. */
    rowClassName: null,   // (row, rowIndex) => string | string[]
    rowStyle: null,       // (row, rowIndex) => Object
    cellClassName: null,  // (row, colKey, value, rowIndex) => string | string[]
    cellStyle: null,      // (row, colKey, value, rowIndex) => Object
    /** Управление hover-эффектом для кликабельных строк. true — подсветка при наведении, false — без подсветки. */
    hoverRows: true,
    classPrefix: 'prxz-tbl',
    style: {},
    styleTable: {},
    styleTh: {},
    styleTd: {},
    /** Макс. число строк в заголовке (по умолчанию 2). Число > 0 — обрезка с ellipsis; 0 / null / 'unlimited' — без ограничения. */
    headerLines: 2,
    /** Чередование цвета строк (чётные/нечётные). true — включено, false — отключено. */
    stripedRows: true,
    /** Список колонок, которые не показывать (массив ключей). */
    hiddenColumns: null,
    /** Явный список видимых колонок (массив ключей). Если задан — отображаются только они; иначе учитывается hiddenColumns. */
    visibleColumns: null,
    /** Стили из виджета (w.style): align, color, fontFamily, fontSize, fontStyle, fontWeight, lineHeight, textOutline. Подставляются в таблицу/ячейки; отсутствующие берутся из дефолтов библиотеки. */
    widgetStyle: null,
    /** Сортировка по умолчанию: ключ колонки (key). Если не задан — данные не сортируются. */
    sortBy: null,
    /** Направление сортировки по умолчанию: 'asc' | 'desc'. */
    sortOrder: 'asc',
    /** Виртуализация (ленивая загрузка строк): рендерятся только видимые строки. true — включить при любом числе строк; число — порог (включить при dataset.length >= N). */
    virtualized: false,
    /** Высота одной строки в px для виртуализации (нужна для расчёта скролла). */
    virtualizedRowHeight: 44,
    /** Сколько строк сверху/снизу от видимой области догружать (overscan) для плавности. */
    virtualizedOverscan: 8,
    /** Порог: включать виртуализацию автоматически при числе строк >= этого значения (если virtualized === true или не задан). */
    virtualizedThreshold: 100,
};

/**
 * Нормализует «интуитивный» конфиг в плоский внутренний формат.
 * Группы: target/data, columns (key -> { width }), style, on (rowClick, cellClick), scroll.
 * Старый плоский вызов (container, dataset, columnWidths, onRowClick...) по-прежнему поддерживается.
 * @param {Object} raw - входящий конфиг (группированный или плоский)
 * @returns {Object} плоский конфиг для renderTable
 */
function normalizeIntuitiveConfig(raw) {
    if (!raw || typeof raw !== 'object') return { ...DEFAULT_CONFIG };

    const flat = { ...DEFAULT_CONFIG, ...raw };

    // target / container
    if (raw.target !== undefined) flat.container = raw.target;
    // data / dataset
    if (raw.data !== undefined) flat.dataset = raw.data;

    // columns: { 'Колонка': { width: '10%', format, visible } } — только ширины/опции, список колонок из data
    if (raw.columns && typeof raw.columns === 'object' && !Array.isArray(raw.columns)) {
        const columnWidths = {};
        const columnFormatters = {};
        const hiddenColumns = [];
        for (const [key, opts] of Object.entries(raw.columns)) {
            const w = opts && (typeof opts === 'string' ? opts : (opts.width ?? opts.w));
            if (w != null) columnWidths[key] = w;

            const fmt = opts && typeof opts === 'object'
                ? (opts.format ?? opts.formatter ?? opts.fmt ?? opts.valueFormatter ?? opts.render)
                : null;
            if (fmt != null) columnFormatters[key] = fmt;
            if (opts && typeof opts === 'object' && opts.visible === false) hiddenColumns.push(key);
        }
        if (Object.keys(columnWidths).length) flat.columnWidths = { ...flat.columnWidths, ...columnWidths };
        if (Object.keys(columnFormatters).length) flat.columnFormatters = { ...flat.columnFormatters, ...columnFormatters };
        if (hiddenColumns.length && !flat.hiddenColumns?.length) flat.hiddenColumns = [...(flat.hiddenColumns || []), ...hiddenColumns];
    }

    // style: border, borderRadius, th, td, style; th/td: whiteSpace, borderRadius, wordBreak, и др.
    if (raw.style && typeof raw.style === 'object') {
        const a = raw.style;
        if (a.border) {
            if (a.border.collapse != null) flat.borderCollapse = a.border.collapse;
            if (a.border.spacing != null) flat.borderSpacing = a.border.spacing;
        }
        if (a.borderRadius != null) {
            flat.style = { ...flat.style, borderRadius: a.borderRadius };
        }
        if (a.table && typeof a.table === 'object') {
            flat.styleTable = { ...flat.styleTable, ...a.table };
        }
        if (a.th && typeof a.th === 'object') {
            flat.styleTh = { ...flat.styleTh, ...a.th };
            if (a.th.headerLines !== undefined) flat.headerLines = a.th.headerLines;
        }
        if (a.headerLines !== undefined) flat.headerLines = a.headerLines;
        if (a.stripedRows !== undefined) flat.stripedRows = !!a.stripedRows;
        if (a.td && typeof a.td === 'object') {
            flat.styleTd = { ...flat.styleTd, ...a.td };
        }
        // обратная совместимость: старые ключи в style
        if (a.borderRadiusHeader != null) flat.styleTh = { ...flat.styleTh, borderRadius: a.borderRadiusHeader };
        if (a.borderRadiusBody != null) flat.styleTd = { ...flat.styleTd, borderRadius: a.borderRadiusBody };
        if (a.whiteSpace != null) {
            flat.styleTh = { ...flat.styleTh, whiteSpace: a.whiteSpace };
            flat.styleTd = { ...flat.styleTd, whiteSpace: a.whiteSpace };
        }
        if (a.style && typeof a.style === 'object') {
            flat.style = { ...flat.style, ...a.style };
        }
    }

    // on: { rowClick, cellClick }
    if (raw.on && typeof raw.on === 'object') {
        if (typeof raw.on.rowClick === 'function') flat.onRowClick = raw.on.rowClick;
        if (typeof raw.on.cellClick === 'function') flat.onCellClick = raw.on.cellClick;
    }

    // scroll: { horizontal: true/false, pinnedColumns: number, rowColorPinnedOnly: boolean }
    if (raw.scroll && typeof raw.scroll === 'object') {
        if (raw.scroll.horizontal !== undefined) flat.isScrolling = !!raw.scroll.horizontal;
        if (typeof raw.scroll.pinnedColumns === 'number' && raw.scroll.pinnedColumns >= 0) {
            flat.pinnedColumns = raw.scroll.pinnedColumns;
        }
        if (raw.scroll.rowColorPinnedOnly !== undefined) flat.rowColorPinnedOnly = !!raw.scroll.rowColorPinnedOnly;
        if (raw.scroll.virtualized !== undefined) flat.virtualized = !!raw.scroll.virtualized;
        if (typeof raw.scroll.virtualizedRowHeight === 'number') flat.virtualizedRowHeight = raw.scroll.virtualizedRowHeight;
        if (typeof raw.scroll.virtualizedOverscan === 'number') flat.virtualizedOverscan = raw.scroll.virtualizedOverscan;
        if (typeof raw.scroll.virtualizedThreshold === 'number') flat.virtualizedThreshold = raw.scroll.virtualizedThreshold;
    }
    if (typeof raw.pinnedColumns === 'number' && raw.pinnedColumns >= 0) flat.pinnedColumns = raw.pinnedColumns;
    if (raw.virtualized !== undefined) flat.virtualized = !!raw.virtualized;
    if (typeof raw.virtualizedRowHeight === 'number') flat.virtualizedRowHeight = raw.virtualizedRowHeight;
    if (typeof raw.virtualizedOverscan === 'number') flat.virtualizedOverscan = raw.virtualizedOverscan;
    if (typeof raw.virtualizedThreshold === 'number') flat.virtualizedThreshold = raw.virtualizedThreshold;

    // visibleColumns, hiddenColumns
    if (Array.isArray(raw.visibleColumns)) flat.visibleColumns = raw.visibleColumns;
    if (Array.isArray(raw.hiddenColumns)) flat.hiddenColumns = raw.hiddenColumns;

    // Плоский вариант: borderRadius, styleTh/styleTd с верхнего уровня
    if (raw.borderRadius != null) flat.style = { ...flat.style, borderRadius: raw.borderRadius };
    if (raw.styleTable && typeof raw.styleTable === 'object') flat.styleTable = { ...flat.styleTable, ...raw.styleTable };
    if (raw.styleTh && typeof raw.styleTh === 'object') flat.styleTh = { ...flat.styleTh, ...raw.styleTh };
    if (raw.styleTd && typeof raw.styleTd === 'object') flat.styleTd = { ...flat.styleTd, ...raw.styleTd };
    // обратная совместимость: плоские whiteSpace, borderRadiusHeader/Body
    if (raw.whiteSpace != null) {
        flat.styleTh = { ...flat.styleTh, whiteSpace: raw.whiteSpace };
        flat.styleTd = { ...flat.styleTd, whiteSpace: raw.whiteSpace };
    }
    if (raw.borderRadiusHeader != null) flat.styleTh = { ...flat.styleTh, borderRadius: raw.borderRadiusHeader };
    if (raw.borderRadiusBody != null) flat.styleTd = { ...flat.styleTd, borderRadius: raw.borderRadiusBody };
    if (raw.headerLines !== undefined) flat.headerLines = raw.headerLines;
    if (raw.stripedRows !== undefined) flat.stripedRows = !!raw.stripedRows;

    if (raw.widgetStyle != null && typeof raw.widgetStyle === 'object') flat.widgetStyle = raw.widgetStyle;

    // sort: { by: string, order: 'asc'|'desc' } или плоские sortBy, sortOrder
    if (raw.sort && typeof raw.sort === 'object') {
        if (raw.sort.by != null) flat.sortBy = raw.sort.by;
        if (raw.sort.order === 'desc' || raw.sort.order === 'asc') flat.sortOrder = raw.sort.order;
    }
    if (raw.sortBy != null) flat.sortBy = raw.sortBy;
    if (raw.sortOrder === 'desc' || raw.sortOrder === 'asc') flat.sortOrder = raw.sortOrder;

    return flat;
}

/**
 * Проверяет, что данные в сыром формате { cols, values }.
 * @param {*} data
 * @returns {boolean}
 */
function isRawColsValues(data) {
    if (!Array.isArray(data) || data.length === 0) return false;
    const first = data[0];
    return first && Array.isArray(first.cols) && Array.isArray(first.values);
}

/**
 * Проверяет формат «обёртка»: ровно один объект с cols/keys/metaData и items (имена колонок и массив строк).
 * Не срабатывает для массива строк вида [ { cols, values }, ... ].
 * @param {*} data
 * @returns {boolean}
 */
function isWrappedColsItems(data) {
    if (!Array.isArray(data) || data.length !== 1) return false;
    const first = data[0];
    const meta = first && (first.metadata || first.metaData);
    const colNames = first && (Array.isArray(first.cols) || Array.isArray(first.keys) || (Array.isArray(meta) && meta.length > 0));
    const rowList = first && Array.isArray(first.items);
    return !!(colNames && rowList);
}

/**
 * Разворачивает формат { cols/keys/metaData, items } в массив строк и имена колонок.
 * Имена колонок берутся из metaData[].displayName (при наличии), иначе из cols/keys.
 * Элементы items могут быть { values: any[] } или уже объекты-строки { [key]: value }.
 * @param {Array<{cols?: string[], keys?: string[], metadata?: Array<{columnName: string, displayName?: string}>, metaData?: *, items: Array<{values?: *[]}|Object>}>} raw
 * @returns {{ rows: Object[], columnNames: string[] }}
 */
function unwrapColsItems(raw) {
    const wrapper = raw[0];
    const meta = wrapper.metadata || wrapper.metaData;
    const columnNames = Array.isArray(meta) && meta.length > 0
        ? meta.map((m) => (m && (m.displayName != null ? m.displayName : m.columnName)) || '')
        : (wrapper.cols || wrapper.keys || []);
    const items = wrapper.items || [];
    const colNameToDisplay = Array.isArray(meta) && meta.length > 0
        ? Object.fromEntries(meta.map((m) => [(m && m.columnName) || '', (m && (m.displayName != null ? m.displayName : m.columnName)) || '']))
        : null;

    const rows = items.map((item) => {
        const pv = Array.isArray(item?.values) ? item.values : null;
        if (pv) {
            const row = {};
            for (let j = 0; j < columnNames.length; j++) row[columnNames[j]] = pv[j];
            return row;
        }
        if (item && typeof item === 'object' && !Array.isArray(item) && !(Array.isArray(item.cols) && 'values' in item)) {
            if (colNameToDisplay) {
                const row = {};
                for (const [colName, displayName] of Object.entries(colNameToDisplay)) {
                    if (colName in item) row[displayName] = item[colName];
                }
                return row;
            }
            return item;
        }
        const row = {};
        const fallback = Array.isArray(item?.values) ? item.values : [];
        for (let j = 0; j < columnNames.length; j++) row[columnNames[j]] = fallback[j];
        return row;
    });
    return { rows, columnNames };
}

/**
 * Преобразует сырой массив { cols, values } в массив объектов-строк (как getDataTable).
 * Имена колонок берутся из первой строки: raw[0].metadata[].displayName, если есть; иначе из cols.
 * @param {Array<{cols?: string[], values?: *[], metadata?: Array<{displayName: string}>}>} raw
 * @returns {Object[]}
 */
function rawToRowObjects(raw) {
    const out = [];
    const first = raw[0];
    const columnNames = first && Array.isArray(first.metadata) && first.metadata.length > 0
        ? first.metadata.map((v) => v.displayName)
        : (first && (first.cols || [])) || [];

    for (const v of raw) {
        const row = {};
        const pc = v.cols || [];
        const pv = v.values || [];
        for (let j = 0; j < pv.length; j++) {
            const key = columnNames[j] ?? pc[j] ?? j;
            row[key] = pv[j];
        }
        out.push(row);
    }
    return out;
}

/**
 * Значение для сравнения при сортировке: число, дата или строка.
 * @param {*} v
 * @returns {{ type: 'number'|'date'|'string', value: number|Date|string }}
 */
function sortValue(v) {
    if (v == null) return { type: 'string', value: '' };
    if (typeof v === 'number' && !Number.isNaN(v)) return { type: 'number', value: v };
    if (v instanceof Date) return { type: 'date', value: v.getTime() };
    if (typeof v === 'string') {
        const trimmed = v.trim();
        const num = Number(trimmed);
        if (trimmed !== '' && !Number.isNaN(num)) return { type: 'number', value: num };
        const d = new Date(trimmed);
        if (!Number.isNaN(d.getTime())) return { type: 'date', value: d.getTime() };
        return { type: 'string', value: trimmed };
    }
    const s = String(v);
    const num = Number(s);
    if (!Number.isNaN(num)) return { type: 'number', value: num };
    return { type: 'string', value: s };
}

/**
 * Сортирует массив строк таблицы по колонке. Не мутирует исходный массив.
 * @param {Object[]} data - массив строк (объектов)
 * @param {string} sortBy - ключ колонки
 * @param {'asc'|'desc'} sortOrder
 * @returns {Object[]}
 */
function sortTableData(data, sortBy, sortOrder) {
    if (!Array.isArray(data) || data.length === 0 || sortBy == null || sortBy === '') return data;
    const order = sortOrder === 'desc' ? -1 : 1;
    return data.slice().sort((a, b) => {
        const va = sortValue(a[sortBy]);
        const vb = sortValue(b[sortBy]);
        if (va.type === 'number' && vb.type === 'number') {
            return order * (va.value - vb.value);
        }
        if (va.type === 'date' && vb.type === 'date') {
            return order * (va.value - vb.value);
        }
        const sa = String(va.value);
        const sb = String(vb.value);
        return order * (sa.localeCompare(sb, undefined, { numeric: true }));
    });
}

/**
 * Нормализует конфиг: колонки могут быть строками (ключ) или объектами { key, label?, width? }.
 * @param {Array<string|{key: string, label?: string, width?: string|number, format?: any, formatter?: any}>} columns
 * @returns {Array<{key: string, label: string, width: string, format?: any, thStyle?: Object, tdStyle?: Object}>}
 */
function normalizeColumns(columns) {
    if (!Array.isArray(columns) || columns.length === 0) return [];
    return columns.map((col) => {
        if (typeof col === 'string') {
            return { key: col, label: col, width: '' };
        }
        const key = col.key || col.field || '';
        const label = col.label != null ? col.label : key;
        let width = col.width != null ? col.width : '';
        if (typeof width === 'number') width = width + 'px';

        const format = col.format ?? col.formatter ?? col.fmt ?? col.valueFormatter ?? col.render ?? null;
        const thStyle = col.thStyle ?? col.styleTh ?? null;
        const tdStyle = col.tdStyle ?? col.styleTd ?? null;
        const visible = col.visible !== false;

        // Сохраняем остальные поля колонки (на будущее) и не ломаем текущий API.
        return { ...col, key, label, width: String(width), visible, ...(format != null ? { format } : {}), ...(thStyle ? { thStyle } : {}), ...(tdStyle ? { tdStyle } : {}) };
    });
}

/**
 * Возвращает массив ключей видимых колонок: из cfg.visibleColumns, или все кроме cfg.hiddenColumns, или по column.visible.
 * @param {Object} cfg - конфиг с visibleColumns / hiddenColumns
 * @param {Array<{key: string, visible?: boolean}>} columns - полный список колонок
 * @returns {string[]}
 */
function getVisibleColumnKeys(cfg, columns) {
    const allKeys = columns.map((c) => c.key);
    if (Array.isArray(cfg.visibleColumns) && cfg.visibleColumns.length > 0) {
        return cfg.visibleColumns.filter((k) => allKeys.includes(k));
    }
    if (Array.isArray(cfg.hiddenColumns) && cfg.hiddenColumns.length > 0) {
        return allKeys.filter((k) => !cfg.hiddenColumns.includes(k));
    }
    return columns.filter((c) => c.visible !== false).map((c) => c.key);
}

function applyColumnFormatters(columns, cfg) {
    const fmts = cfg?.columnFormatters && typeof cfg.columnFormatters === 'object' ? cfg.columnFormatters : null;
    if (!fmts) return columns;

    return columns.map((col) => {
        if (col && (col.format != null || col.formatter != null || col.valueFormatter != null || col.render != null)) return col;
        const v = fmts[col.key] ?? fmts[col.label];
        if (v == null) return col;
        return { ...col, format: v };
    });
}

function formatValueBySpec(spec, value, row, rowIndex, colKey) {
    if (spec == null) return value;

    // Функция-форматтер (value, row, rowIndex, colKey) => any
    if (typeof spec === 'function') return spec(value, row, rowIndex, colKey);

    // Пресет строкой
    if (typeof spec === 'string') {
        const s = spec.trim().toLowerCase();
        // 'fval' — как в библиотеке: decimals=2, localize=true
        if (s === 'fval') return FormatValue.fval(value);
        // 'number'/'num' — “умный” режим без лишних нулей
        if (s === 'number' || s === 'num') return FormatValue.fval(value, 'auto', true);
        if (s === 'short' || s === 'shortval' || s === 'fshortval') return FormatValue.fshortval(value, 2);
        if (s === 'percent' || s === 'perc' || s === 'fperc') return FormatValue.fperc(value);
        if (s === 'money' || s === 'currency' || s === 'fmoney') return FormatValue.fmoney(value);
        if (s === 'date' || s === 'fdate') return FormatDate.fdate(value);
        if (s === 'datetime') return FormatDate.fdate(value, 'dd.mm.yyyy HH:MM');
        return value;
    }

    // Спека объектом: { type, ...options }
    if (typeof spec === 'object') {
        const type = String(spec.type ?? spec.kind ?? spec.preset ?? '').toLowerCase();
        if (type === 'number' || type === 'num' || type === 'fval') {
            const decimals = spec.decimals ?? spec.d ?? 2;
            const localize = spec.localize ?? spec.locale ?? true;
            return FormatValue.fval(value, decimals, !!localize);
        }
        if (type === 'short' || type === 'shortval' || type === 'fshortval') {
            const decimals = spec.decimals ?? spec.d ?? 2;
            return FormatValue.fshortval(value, decimals);
        }
        if (type === 'percent' || type === 'perc' || type === 'fperc') {
            const decimals = spec.decimals ?? spec.d ?? 2;
            return FormatValue.fperc(value, decimals);
        }
        if (type === 'money' || type === 'currency' || type === 'fmoney') {
            const currency = spec.currency ?? spec.cur ?? 'RUB';
            const decimals = spec.decimals ?? spec.d ?? 2;
            return FormatValue.fmoney(value, currency, decimals);
        }
        if (type === 'date' || type === 'datetime' || type === 'fdate') {
            const fmt = spec.format ?? spec.fmt ?? (type === 'datetime' ? 'dd.mm.yyyy HH:MM' : 'dd.mm.yyyy');
            return FormatDate.fdate(value, fmt);
        }
        return value;
    }

    return value;
}

function safeToDisplayString(v) {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'bigint') return String(v);
    // Последний шанс — без падений на циклических структурах
    try {
        return String(v);
    } catch (_) {
        return '';
    }
}

/**
 * Проверяет, что опция форматирования задана как словарь: { column?, map }.
 * @param {*} opt
 * @returns {boolean}
 */
function isColumnMapFormat(opt) {
    return opt && typeof opt === 'object' && !Array.isArray(opt) && opt.map != null && typeof opt.map === 'object';
}

/**
 * Возвращает значение строки для подстановки в map (по имени колонки или getValue).
 * @param {Object} row
 * @param {Object} opt - { column?: string, getValue?: (row) => any }
 * @returns {*}
 */
function getRowValueForMap(row, opt) {
    if (typeof opt.getValue === 'function') return opt.getValue(row);
    const key = opt.column;
    return key != null ? row[key] : undefined;
}

/**
 * Разрешает класс строки: функция (row, rowIndex) => string|string[] или { column, map }.
 * @param {Object} row
 * @param {number} rowIndex
 * @param {*} rowClassName - function | { column: string, map: Object }
 * @returns {string}
 */
function resolveRowClass(row, rowIndex, rowClassName) {
    if (typeof rowClassName === 'function') {
        const rc = rowClassName(row, rowIndex);
        if (Array.isArray(rc)) return rc.filter(Boolean).join(' ');
        return rc ? String(rc) : '';
    }
    if (isColumnMapFormat(rowClassName)) {
        const val = getRowValueForMap(row, rowClassName);
        const mapped = rowClassName.map[val];
        if (mapped == null) return '';
        if (Array.isArray(mapped)) return mapped.filter(Boolean).join(' ');
        return String(mapped);
    }
    return '';
}

/**
 * Разрешает стиль строки: функция (row, rowIndex) => Object или { column, map } (значения map — цвет строки или объект стилей).
 * @param {Object} row
 * @param {number} rowIndex
 * @param {*} rowStyle - function | { column: string, map: Object }
 * @returns {string} CSS строка
 */
function resolveRowStyle(row, rowIndex, rowStyle, styleFromOptionsFn) {
    let obj = null;
    if (typeof rowStyle === 'function') {
        obj = rowStyle(row, rowIndex);
    } else if (isColumnMapFormat(rowStyle)) {
        const val = getRowValueForMap(row, rowStyle);
        const mapped = rowStyle.map[val];
        if (mapped != null) {
            obj = typeof mapped === 'string' ? { backgroundColor: mapped } : (typeof mapped === 'object' && mapped !== null ? mapped : null);
        }
    }
    if (obj && typeof obj === 'object') return styleFromOptionsFn(obj);
    return '';
}

/**
 * Разрешает класс ячейки: функция или { column, map } (применяется к ячейкам указанной колонки по значению).
 * @param {Object} row
 * @param {string} colKey
 * @param {*} value
 * @param {number} rowIndex
 * @param {*} cellClassName
 * @returns {string}
 */
function resolveCellClass(row, colKey, value, rowIndex, cellClassName) {
    if (typeof cellClassName === 'function') {
        const cc = cellClassName(row, colKey, value, rowIndex);
        if (Array.isArray(cc)) return cc.filter(Boolean).join(' ');
        return cc ? String(cc) : '';
    }
    if (isColumnMapFormat(cellClassName)) {
        const key = cellClassName.column;
        if (key != null && colKey !== key) return '';
        const val = key != null ? row[key] : value;
        const mapped = cellClassName.map[val];
        if (mapped == null) return '';
        if (Array.isArray(mapped)) return mapped.filter(Boolean).join(' ');
        return String(mapped);
    }
    return '';
}

/**
 * Разрешает стиль ячейки: функция или { column, map }.
 * @param {Object} row
 * @param {string} colKey
 * @param {*} value
 * @param {number} rowIndex
 * @param {*} cellStyle
 * @param {function} cellStyleFromOptionsFn
 * @returns {string}
 */
function resolveCellStyle(row, colKey, value, rowIndex, cellStyle, cellStyleFromOptionsFn) {
    let obj = null;
    if (typeof cellStyle === 'function') {
        obj = cellStyle(row, colKey, value, rowIndex);
    } else if (isColumnMapFormat(cellStyle)) {
        const key = cellStyle.column;
        if (key != null && colKey !== key) return '';
        const val = key != null ? row[key] : value;
        const mapped = cellStyle.map[val];
        if (mapped != null) {
            obj = typeof mapped === 'string' ? { backgroundColor: mapped } : (typeof mapped === 'object' && mapped !== null ? mapped : null);
        }
    }
    if (obj && typeof obj === 'object') return cellStyleFromOptionsFn(obj);
    return '';
}

/** Если форматтер вернул { html: string, title?: string } (или __html), возвращает HTML и текст для title. Иначе null. */
function unwrapFormattedHtml(displayValue) {
    if (displayValue == null || typeof displayValue !== 'object' || Array.isArray(displayValue)) return null;
    let raw = null;
    if ('html' in displayValue && displayValue.html != null) raw = displayValue.html;
    if (raw == null && '__html' in displayValue && displayValue.__html != null) raw = displayValue.__html;
    if (raw == null) {
        const k = Object.keys(displayValue).find((key) => key.toLowerCase() === 'html');
        if (k != null) raw = displayValue[k];
    }
    const htmlStr = raw != null && (typeof raw === 'string' || raw instanceof String) ? String(raw) : null;
    if (htmlStr == null || htmlStr === '') return null;
    const title = displayValue.title != null ? String(displayValue.title) : htmlStr.replace(/<[^>]*>/g, '').trim();
    return { html: htmlStr, title };
}

/**
 * Рендер таблицы в контейнер.
 *
 * Интуитивный вызов (всё по группам):
 *   renderTable({
 *     target: elementOrId,
 *     data: items,
 *     columns: { 'РНГИО': { width: '10%' } },
 *     style: { border: { collapse: 'separate', spacing: '0.5em 0.5em' }, borderRadius: '20px' },
 *     scroll: { horizontal: false },
 *     on: { rowClick(row, rowIndex) { ... } },
 *   })
 *
 * Классический вызов: renderTable(container, dataset, config) или renderTable({ container, dataset, ... }).
 *
 * @param {string|HTMLElement|Object} containerOrConfig - id/элемент или конфиг (target/data, columns, style, on, scroll)
 * @param {Object[]|Array<{cols: string[], values: *[]}>} [dataset] - массив строк или сырой формат { cols, values }
 * @param {Object} [config] - конфиг при вызове (container, dataset)
 * @param {Array<string|{key, label?, width?, format?}>} [config.columns] - колонки (format: функция | пресет | объект-спека)
 * @param {Object.<string, string|number>} [config.columnWidths] - ширины по ключу
 * @param {Object.<string, (function|string|Object)>} [config.columnFormatters] - форматирование по ключу. Функция может вернуть строку, либо { html: string, title?: string } для вывода HTML в ячейке (условное форматирование)
 * @param {boolean} [config.stickyHeader=true] - закреплённый заголовок
 * @param {boolean} [config.isScrolling=false] - горизонтальная прокрутка
 * @param {number} [config.pinnedColumns=0] - количество столбцов, закреплённых слева; остальные прокручиваются по горизонтали
 * @param {boolean} [config.rowColorPinnedOnly=false] - при pinnedColumns > 0: true — применять rowStyle только к ячейкам в области скролла
 * @param {string} [config.borderCollapse] - 'collapse' | 'separate'
 * @param {string} [config.borderSpacing] - при separate
 * @param {function(row, rowIndex)} [config.onRowClick]
 * @param {function(row, cellKey, value, rowIndex): (boolean|void)} [config.onCellClick] — вернуть true, чтобы подсветить строку и ячейку; при false/undefined подсветки не будет
 * @param {function(row, rowIndex): (string|string[])|{column: string, map: Object}} [config.rowClassName] - условные CSS-классы для строки. Либо функция, либо { column: 'Ключ колонки', map: { 'Значение': 'css-class', ... } } — подстановка по значению в колонке
 * @param {function(row, rowIndex): Object|{column: string, map: Object}} [config.rowStyle] - условные стили для строки. Либо функция, либо { column, map } (значения map — строка цвета фона или объект стилей)
 * @param {function(row, cellKey, value, rowIndex): (string|string[])|{column?: string, map: Object}} [config.cellClassName] - условные классы для ячейки; при формате { column, map } — только ячейки указанной колонки
 * @param {function(row, cellKey, value, rowIndex): Object|{column?: string, map: Object}} [config.cellStyle] - условные стили для ячейки; при формате { column, map } — только ячейки указанной колонки
 * @param {boolean} [config.hoverRows=true] - включить/выключить hover-подсветку для кликабельных строк
 * @param {Object} [config.style] - стили обёртки таблицы
 * @param {Object} [config.styleTh] - стили ячеек шапки: whiteSpace, borderRadius, wordBreak и др.
 * @param {Object} [config.styleTd] - стили ячеек тела: whiteSpace, borderRadius, wordBreak и др.
 * @param {Object} [config.style.th] - то же через style.th (при интуитивном конфиге)
 * @param {Object} [config.style.td] - то же через style.td (при интуитивном конфиге)
 * @param {number|string} [config.headerLines=2] - макс. строк в заголовке (2 по умолчанию); 0 / null / 'unlimited' — без ограничения
 * @param {boolean} [config.stripedRows=true] - чередование цвета строк (разноцветные строки); false — отключить
 * @param {string[]} [config.hiddenColumns] - перечень колонок, которые не показывать (ключи)
 * @param {string[]} [config.visibleColumns] - явный список видимых колонок (ключи); если задан — отображаются только они
 * @param {Object} [config.widgetStyle] - стили виджета (напр. w.style): align, color, fontFamily, fontSize, fontStyle, fontWeight, lineHeight, textOutline; отсутствующее подставляется из дефолтов библиотеки
 * @param {string} [config.sortBy] - колонка для сортировки по умолчанию (ключ колонки)
 * @param {'asc'|'desc'} [config.sortOrder='asc'] - направление сортировки по умолчанию
 * @param {boolean|number} [config.virtualized=false] - виртуализация: true — включить при dataset.length >= virtualizedThreshold; при большом числе строк рендерятся только видимые
 * @param {number} [config.virtualizedRowHeight=44] - высота строки в px для расчёта скролла
 * @param {number} [config.virtualizedOverscan=8] - сколько строк догружать сверху/снизу от видимой области
 * @param {number} [config.virtualizedThreshold=100] - порог: включать виртуализацию при числе строк >= этого значения
 */
export function renderTable(containerOrConfig, dataset, config = {}) {
    let container;
    let data;
    let cfg;
    if (containerOrConfig && typeof containerOrConfig === 'object' && !containerOrConfig.nodeType && (containerOrConfig.dataset !== undefined || containerOrConfig.data !== undefined)) {
        cfg = normalizeIntuitiveConfig(containerOrConfig);
        container = cfg.container;
        data = Array.isArray(cfg.dataset) ? cfg.dataset : [];
    } else {
        container = containerOrConfig;
        data = Array.isArray(dataset) ? dataset : [];
        cfg = { ...DEFAULT_CONFIG, ...config };
        // обратная совместимость: плоские whiteSpace, borderRadiusHeader/Body → styleTh/styleTd
        if (config.whiteSpace != null) {
            cfg.styleTh = { ...cfg.styleTh, whiteSpace: config.whiteSpace };
            cfg.styleTd = { ...cfg.styleTd, whiteSpace: config.whiteSpace };
        }
        if (config.borderRadiusHeader != null) cfg.styleTh = { ...cfg.styleTh, borderRadius: config.borderRadiusHeader };
        if (config.borderRadiusBody != null) cfg.styleTd = { ...cfg.styleTd, borderRadius: config.borderRadiusBody };
    }
    // Плоский конфиг: borderRadius и т.д. в style
    if (cfg.borderRadius != null && !cfg.style) cfg.style = {};
    if (cfg.borderRadius != null) cfg.style = { ...cfg.style, borderRadius: cfg.borderRadius };
    let columns = normalizeColumns(cfg.columns);

    if (isRawColsValues(data)) {
        data = rawToRowObjects(data);
    } else if (isWrappedColsItems(data)) {
        const { rows, columnNames } = unwrapColsItems(data);
        data = rows;
        if (columns.length === 0 && columnNames.length > 0) {
            columns = columnNames.map((k) => ({ key: k, label: k, width: '' }));
        }
    }

    const tableId = genId();
    const prefix = cfg.classPrefix;

    const el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) return;

    if (columns.length === 0 && data.length > 0) {
        const first = data[0];
        const keys = Object.keys(first);
        columns.push(...keys.map((k) => ({ key: k, label: k, width: '' })));
    } else if (columns.length === 0) {
        el.innerHTML = '';
        return;
    }

    const widths = cfg.columnWidths && typeof cfg.columnWidths === 'object' ? cfg.columnWidths : null;
    if (widths) {
        columns.forEach((col) => {
            const x = widths[col.key] ?? widths[col.label];
            if (x != null && x !== '') col.width = typeof x === 'number' ? x + 'px' : String(x);
        });
    }

    if (cfg.sortBy != null && cfg.sortBy !== '') {
        data = sortTableData(data, cfg.sortBy, cfg.sortOrder || 'asc');
    }

    columns = applyColumnFormatters(columns, cfg);

    const visibleKeys = getVisibleColumnKeys(cfg, columns);
    const columnsForRender = columns.filter((c) => visibleKeys.includes(c.key));

    const html = buildTableHTML(tableId, prefix, data, columnsForRender, cfg);
    el.innerHTML = html;
    const pinCount = Math.min(Math.max(0, parseInt(cfg.pinnedColumns, 10) || 0), columnsForRender.length);
    if (pinCount > 0) applyPinnedColumnsLayout(el, prefix, pinCount);
    initTableEvents(el, tableId, prefix, data, cfg);

    const useVirtualized = !!cfg.virtualized && data.length >= (cfg.virtualizedThreshold ?? 100);
    if (useVirtualized) {
        initVirtualizedScroll(el, tableId, prefix, data, columnsForRender, cfg);
    }
}

/**
 * Строит HTML одной строки таблицы (для обычного рендера и виртуализации).
 * @param {string} prefix
 * @param {Array} columns
 * @param {Object} cfg
 * @param {Object} row
 * @param {number} rowIndex
 * @param {number} [fixedRowHeight] - при виртуализации задаёт высоту строки в px
 * @returns {string}
 */
function buildSingleRow(prefix, columns, cfg, row, rowIndex, fixedRowHeight) {
    const pinCount = Math.min(Math.max(0, parseInt(cfg.pinnedColumns, 10) || 0), columns.length);
    const isScrolling = cfg.isScrolling === true || pinCount > 0;
    const tdCellStyle = cellStyleFromOptions(cfg.styleTd, {});

    const rowExtraClass = resolveRowClass(row, rowIndex, cfg.rowClassName);
    const rowExtraStyle = cfg.rowStyle
        ? resolveRowStyle(row, rowIndex, cfg.rowStyle, styleFromOptions)
        : '';

    const cells = columns
        .map((col, colIndex) => {
            const value = row[col.key];
            let displayValue = value;
            if (col.format != null) {
                try {
                    displayValue = formatValueBySpec(col.format, value, row, rowIndex, col.key);
                } catch (_) {
                    displayValue = value;
                }
            }
            let formattedHtml = unwrapFormattedHtml(displayValue);
            if (!formattedHtml && displayValue && typeof displayValue === 'object' && !Array.isArray(displayValue)) {
                const h = displayValue.html ?? displayValue.__html;
                if (h != null && (typeof h === 'string' || h instanceof String)) {
                    formattedHtml = { html: String(h), title: displayValue.title != null ? String(displayValue.title) : String(h).replace(/<[^>]*>/g, '').trim() };
                }
            }
            const text = formattedHtml ? formattedHtml.title : safeToDisplayString(displayValue);
            const cellContent = formattedHtml ? String(formattedHtml.html) : escapeHtml(text);
            let w = '';
            if (isScrolling) {
                w = col.width
                    ? `width: ${col.width}; min-width: ${col.width}; max-width: ${col.width};`
                    : `min-width: ${DEFAULT_MIN_COL_WIDTH};`;
            } else if (col.width) {
                w = `width: ${escapeAttr(col.width)}; min-width: 0;`;
            }
            const tdExtra = col.tdStyle ? cellStyleFromOptions(col.tdStyle) : '';

            const cellExtraClass = resolveCellClass(row, col.key, value, rowIndex, cfg.cellClassName);
            const cellExtraStyle = cfg.cellStyle
                ? resolveCellStyle(row, col.key, value, rowIndex, cfg.cellStyle, cellStyleFromOptions)
                : '';

            const isPinned = colIndex < pinCount;
            const pinClass = isPinned ? ` ${prefix}-pin` : '';
            const pinAttr = isPinned ? ` data-pin-index="${colIndex}"` : '';
            const pinStyle = isPinned ? ' position:sticky; z-index:2;' : '';
            const rowStyleOnCell = cfg.rowColorPinnedOnly && pinCount > 0 && rowExtraStyle && !isPinned ? rowExtraStyle : '';
            const tdStyle = `padding: 10px 12px; ${w} ${tdCellStyle} ${tdExtra} ${cellExtraStyle} ${rowStyleOnCell}${pinStyle}`;
            const tdClass = [ `${prefix}-td`, cellExtraClass, pinClass.trim() ].filter(Boolean).join(' ');

            return `<td class="${tdClass}" style="${tdStyle}" title="${escapeAttr(text)}" data-col="${escapeAttr(col.key)}" data-row-index="${rowIndex}"${pinAttr}>${cellContent}</td>`;
        })
        .join('');

    const clickable = cfg.onRowClick || cfg.onCellClick ? ` ${prefix}-row-clickable` : '';
    const stripeClass = rowIndex % 2 === 0 ? ` ${prefix}-tr-even` : ` ${prefix}-tr-odd`;
    const trClass = [`${prefix}-tr`, clickable.trim(), stripeClass.trim(), rowExtraClass].filter(Boolean).join(' ');
    let trStyle = (cfg.rowColorPinnedOnly && pinCount > 0 && rowExtraStyle) ? '' : rowExtraStyle;
    if (fixedRowHeight != null && fixedRowHeight > 0) {
        trStyle = (trStyle ? trStyle + ' ' : '') + `height: ${fixedRowHeight}px; box-sizing: border-box;`;
    }
    return `<tr class="${trClass}" style="${trStyle}" data-row-index="${rowIndex}">${cells}</tr>`;
}

/**
 * Строка-спейсер для виртуализации (держит высоту скролла).
 */
function buildSpacerRow(prefix, columnCount, heightPx) {
    if (heightPx <= 0) return '';
    return `<tr class="${prefix}-tr ${prefix}-tr-spacer" aria-hidden="true"><td class="${prefix}-td" colspan="${columnCount}" style="height: ${heightPx}px; padding: 0; border: none; line-height: 0; vertical-align: top;"></td></tr>`;
}

function buildTableHTML(tableId, prefix, data, columns, cfg) {
    const stickyHeader = cfg.stickyHeader !== false;
    const pinnedColumns = Math.max(0, parseInt(cfg.pinnedColumns, 10) || 0);
    const pinCount = Math.min(pinnedColumns, columns.length);
    const isScrolling = cfg.isScrolling === true || pinCount > 0;

    // Стили виджета (w.style): если передан widgetStyle — подмешиваем к table/th/td; отсутствующее — из дефолтов библиотеки
    if (cfg.widgetStyle && typeof cfg.widgetStyle === 'object') {
        const baseFromWidget = { ...DEFAULT_TABLE_FONT, ...widgetStyleToTableStyle(cfg.widgetStyle) };
        cfg = {
            ...cfg,
            styleTable: { ...baseFromWidget, ...cfg.styleTable },
            styleTh: { ...baseFromWidget, ...cfg.styleTh },
            styleTd: { ...baseFromWidget, ...cfg.styleTd },
        };
    }

    const wrapperStyle = { borderRadius: '12px', overflow: 'hidden', ...(cfg.style || {}) };

    // Удобные короткие ключи: borderColor в th/td/table превращаем в CSS-переменные,
    // чтобы базовые CSS-правила могли применять разные цвета бордера.
    if (cfg?.styleTh?.borderColor != null && cfg.styleTh.borderColor !== '') wrapperStyle['--tbl-border-th'] = cfg.styleTh.borderColor;
    if (cfg?.styleTh?.borderWidth != null && cfg.styleTh.borderWidth !== '') wrapperStyle['--tbl-border-th-width'] = toCssLength(cfg.styleTh.borderWidth);
    if (cfg?.styleTh?.borderStyle != null && cfg.styleTh.borderStyle !== '') wrapperStyle['--tbl-border-th-style'] = String(cfg.styleTh.borderStyle);
    if (cfg?.styleTd?.borderColor != null && cfg.styleTd.borderColor !== '') wrapperStyle['--tbl-border-td'] = cfg.styleTd.borderColor;
    if (cfg?.styleTd?.borderWidth != null && cfg.styleTd.borderWidth !== '') wrapperStyle['--tbl-border-td-width'] = toCssLength(cfg.styleTd.borderWidth);
    if (cfg?.styleTd?.borderStyle != null && cfg.styleTd.borderStyle !== '') wrapperStyle['--tbl-border-td-style'] = String(cfg.styleTd.borderStyle);
    if (cfg?.styleTable?.borderColor != null && cfg.styleTable.borderColor !== '') wrapperStyle['--tbl-table-border'] = cfg.styleTable.borderColor;
    if (cfg?.styleTable?.borderWidth != null && cfg.styleTable.borderWidth !== '') wrapperStyle['--tbl-table-border-width'] = toCssLength(cfg.styleTable.borderWidth);

    // Компенсация микросдвига sticky-заголовка на старте скролла.
    // Если у таблицы есть верхний бордер, то <th> часто имеет offsetTop > 0 (обычно 1px),
    // из-за чего при первом скролле шапка «едва» смещается вверх до момента прилипания.
    // Сдвигаем sticky-top на толщину бордера таблицы (или 1px по умолчанию при заданном borderColor).
    const tableBorderLikelyExists = !!(
        cfg?.styleTable &&
        typeof cfg.styleTable === 'object' &&
        (
            (cfg.styleTable.border && cfg.styleTable.border !== '') ||
            (cfg.styleTable.borderStyle && cfg.styleTable.borderStyle !== '') ||
            (cfg.styleTable.borderColor && cfg.styleTable.borderColor !== '') ||
            (cfg.styleTable.borderWidth != null && cfg.styleTable.borderWidth !== '')
        )
    );
    if (tableBorderLikelyExists) {
        wrapperStyle['--tbl-sticky-top'] = cfg?.styleTable?.borderWidth != null && cfg.styleTable.borderWidth !== ''
            ? toCssLength(cfg.styleTable.borderWidth)
            : 'var(--tbl-table-border-width, 1px)';
    }

    const wrapperStyleStr = Object.entries(wrapperStyle)
        .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}:${v}`)
        .join(';');

    const scrollStyle = `flex: 1; min-height: 0; overflow-x: ${isScrolling ? 'auto' : 'hidden'}; overflow-y: auto;`;

    const defaultsTh = { whiteSpace: 'nowrap' };
    const defaultsTd = {};
    const thCellStyle = cellStyleFromOptions(cfg.styleTh, defaultsTh);
    const headerLinesInnerStyle = headerLinesToStyle(cfg.headerLines);
    const tdCellStyle = cellStyleFromOptions(cfg.styleTd, defaultsTd);

    let thStyle = `padding: 10px 12px; text-align: left; font-weight: 600; ${thCellStyle}`;
    if (stickyHeader) {
        const hasBg = hasBackgroundStyle(cfg.styleTh);
        const bg = hasBg ? '' : ' background: var(--tbl-head-bg, #1e2a4a);';
        thStyle += ` position: sticky; top: var(--tbl-sticky-top, 0px); z-index: 2;${bg}`;
    }

    const colgroup = columns
        .map((col) => {
            if (!isScrolling && col.width) return `<col style="width:${escapeAttr(col.width)}">`;
            if (isScrolling) return `<col style="min-width:${DEFAULT_MIN_COL_WIDTH}">`;
            return `<col>`;
        })
        .join('');
    const headerWordBreak = cfg.styleTh && cfg.styleTh.wordBreak != null && cfg.styleTh.wordBreak !== ''
        ? `word-break: ${cfg.styleTh.wordBreak};`
        : '';
    const headerCells = columns
        .map((col, colIndex) => {
            let w = '';
            if (isScrolling) {
                w = col.width
                    ? `width:${col.width};min-width:${col.width};max-width:${col.width};`
                    : `min-width:${DEFAULT_MIN_COL_WIDTH};`;
            } else if (col.width) {
                w = `width:${escapeAttr(col.width)};min-width:0;`;
            }
            const isPinned = colIndex < pinCount;
            const pinClass = isPinned ? ` ${prefix}-pin` : '';
            const pinAttr = isPinned ? ` data-pin-index="${colIndex}"` : '';
            const pinStyle = isPinned ? ' position:sticky; z-index:3;' : '';
            const labelHtml = escapeHtml(col.label);
            const innerStyle = [headerLinesInnerStyle, headerWordBreak, 'width:100%;min-width:0;box-sizing:border-box;'].filter(Boolean).join(' ');
            const innerContent = headerLinesInnerStyle || headerWordBreak
                ? `<span class="${prefix}-th-inner" style="${innerStyle}">${labelHtml}</span>`
                : labelHtml;
            const thExtra = col.thStyle ? cellStyleFromOptions(col.thStyle) : '';
            return `<th class="${prefix}-th${pinClass}" style="${thStyle} ${thExtra} ${w}${pinStyle}" title="${labelHtml}" data-col="${escapeAttr(col.key)}"${pinAttr}>${innerContent}</th>`;
        })
        .join('');
    const useVirtualized = !!cfg.virtualized && data.length >= (cfg.virtualizedThreshold ?? 100);
    const rowHeight = Math.max(1, parseInt(cfg.virtualizedRowHeight, 10) || 44);
    const overscan = Math.max(0, parseInt(cfg.virtualizedOverscan, 10) || 8);

    let rows;
    if (useVirtualized) {
        const total = data.length;
        const initialEnd = Math.min(total, Math.max(20, overscan * 3));
        const topSpacer = buildSpacerRow(prefix, columns.length, 0);
        const visibleRows = data.slice(0, initialEnd).map((row, i) => buildSingleRow(prefix, columns, cfg, row, i, rowHeight)).join('');
        const bottomSpacer = buildSpacerRow(prefix, columns.length, (total - initialEnd) * rowHeight);
        rows = topSpacer + visibleRows + bottomSpacer;
    } else {
        rows = data.map((row, rowIndex) => buildSingleRow(prefix, columns, cfg, row, rowIndex)).join('');
    }

    const hasExplicitWidths = isScrolling && columns.some((col) => col.width);
    const tableWidthStyle = hasExplicitWidths
        ? 'width: max-content; min-width: 100%;'
        : 'width: 100%;';
    const tableLayoutStyle = isScrolling ? 'table-layout: auto;' : 'table-layout: fixed;';
    const borderCollapse = cfg.borderCollapse === 'separate' ? 'separate' : 'collapse';
    const borderSpacing = cfg.borderCollapse === 'separate' ? (cfg.borderSpacing || '0.5em 0.5em') : '0';
    const tableBorderStyle = `border-collapse: ${borderCollapse}; border-spacing: ${borderSpacing};`;

    const tableStyleExtra = styleFromOptions(cfg.styleTable);
    const tableBorderAuto = tableBorderFromColor(cfg.styleTable);

    const wrapClasses = [
        `${prefix}-wrap`,
        borderSidesToClass(prefix, 'th', cfg?.styleTh?.borderSides),
        borderSidesToClass(prefix, 'td', cfg?.styleTd?.borderSides),
    ].filter(Boolean).join(' ');

    return `
<div id="tbl-wrap-${tableId}" class="${wrapClasses}" style="${wrapperStyleStr}; display: flex; flex-direction: column; height: 100%; min-height: 0;">
  <div class="${prefix}-scroll" style="${scrollStyle}">
    <table id="tbl-${tableId}" class="${prefix}-table" style="${tableWidthStyle} ${tableBorderStyle} ${tableLayoutStyle} ${tableBorderAuto} ${tableStyleExtra}">
      <colgroup>${colgroup}</colgroup>
      <thead class="${prefix}-thead">
        <tr class="${prefix}-tr ${prefix}-tr-head">${headerCells}</tr>
      </thead>
      <tbody class="${prefix}-tbody">${rows}</tbody>
    </table>
  </div>
</div>
<style>${tableStyles(prefix, { stripedRows: cfg.stripedRows !== false, hoverRows: cfg.hoverRows !== false })}</style>`;
}

/**
 * Стили для ограничения заголовка по числу строк (line-clamp).
 * @param {number|string|null|undefined} headerLines - макс. строк (2 по умолчанию); 0 / null / 'unlimited' — без ограничения
 * @returns {string}
 */
function headerLinesToStyle(headerLines) {
    const n = parseInt(headerLines, 10);
    if (headerLines === null || headerLines === undefined || headerLines === 'unlimited' || headerLines === '' || Number.isNaN(n) || n <= 0) return '';
    const base = `display: -webkit-box; -webkit-line-clamp: ${n}; -webkit-box-orient: vertical; overflow: hidden;`;
    return n > 1 ? `${base} white-space: normal;` : base;
}

/**
 * Собирает строку CSS из объекта опций ячейки (th/td).
 * Поддерживает: whiteSpace, borderRadius, wordBreak и любые другие ключи (camelCase → kebab-case).
 * @param {Object} opts - styleTh или styleTd
 * @param {Object} defaults - значения по умолчанию
 * @returns {string}
 */
function cellStyleFromOptions(opts, defaults = {}) {
    if (!opts || typeof opts !== 'object') return '';
    const merged = { ...defaults, ...opts };
    const parts = [];
    if (merged.whiteSpace != null && merged.whiteSpace !== '') parts.push(`white-space: ${merged.whiteSpace}`);
    if (merged.borderRadius != null && merged.borderRadius !== '') parts.push(`border-radius: ${merged.borderRadius}`);
    if (merged.wordBreak != null && merged.wordBreak !== '') parts.push(`word-break: ${merged.wordBreak}`);
    for (const [k, v] of Object.entries(merged)) {
        if (v == null || v === '' || ['whiteSpace', 'borderRadius', 'wordBreak', 'headerLines', 'borderColor', 'borderWidth', 'borderStyle', 'borderSides'].includes(k)) continue;
        const cssKey = k.replace(/([A-Z])/g, '-$1').toLowerCase();
        parts.push(`${cssKey}: ${v}`);
    }
    return parts.length ? parts.join('; ') + ';' : '';
}

function styleFromOptions(opts) {
    if (!opts || typeof opts !== 'object') return '';
    const parts = [];
    for (const [k, v] of Object.entries(opts)) {
        if (v == null || v === '') continue;
        if (k === 'borderColor') continue; // обрабатывается отдельной логикой/переменными
        const cssKey = k.replace(/([A-Z])/g, '-$1').toLowerCase();
        parts.push(`${cssKey}: ${v}`);
    }
    return parts.length ? parts.join('; ') + ';' : '';
}

function hasBackgroundStyle(opts) {
    if (!opts || typeof opts !== 'object') return false;
    return (
        (opts.background != null && opts.background !== '') ||
        (opts.backgroundColor != null && opts.backgroundColor !== '')
    );
}

function tableBorderFromColor(styleTable) {
    if (!styleTable || typeof styleTable !== 'object') return '';
    const bc = styleTable.borderColor;
    if (bc == null || bc === '') return '';

    const hasBorder = styleTable.border != null && styleTable.border !== '';
    const hasBorderStyle = styleTable.borderStyle != null && styleTable.borderStyle !== '';
    const hasBorderWidth = styleTable.borderWidth != null && styleTable.borderWidth !== '';

    // Если пользователь задал только borderColor — делаем адекватный 1px solid.
    if (!hasBorder && !hasBorderStyle) {
        const w = hasBorderWidth ? `var(--tbl-table-border-width, ${toCssLength(styleTable.borderWidth)})` : '1px';
        return `border: ${w} solid var(--tbl-table-border, ${bc});`;
    }
    // Иначе просто применим цвет (border-style/width пользователь задаёт сам).
    return `border-color: var(--tbl-table-border, ${bc});`;
}

function toCssLength(v) {
    if (v == null) return '';
    if (typeof v === 'number' && Number.isFinite(v)) return `${v}px`;
    return String(v);
}

function borderSidesToClass(prefix, kind, value) {
    if (value == null || value === '' || value === 'all') return '';
    const v = String(value).toLowerCase();
    const base = `${prefix}-${kind}-border-`;
    if (v === 'none') return base + 'none';
    if (v === 'bottom') return base + 'bottom';
    if (v === 'top') return base + 'top';
    if (v === 'left') return base + 'left';
    if (v === 'right') return base + 'right';
    if (v === 'x') return base + 'x';
    if (v === 'y') return base + 'y';
    return '';
}

function escapeAttr(s) {
    if (s == null) return '';
    const str = String(s);
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeHtml(s) {
    if (s == null) return '';
    const str = String(s);
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function tableStyles(prefix, options = {}) {
    const stripedRows = options.stripedRows !== false;
    const hoverRows = options.hoverRows !== false;
    return `
.${prefix}-wrap {
  --tbl-head-bg: rgb(18 32 66 / 1);
  --tbl-row-bg: rgb(39 43 76);
  --tbl-row-hover: rgba(255,255,255,.06);
  --tbl-cell-selected-bg: rgba(96, 165, 250, 0.2);
  --tbl-cell-selected-outline: 2px solid rgba(96, 165, 250, 0.8);
  --tbl-border: rgba(255,255,255,.08);
  --tbl-text: rgba(255,255,255,.92);
  --tbl-text-muted: rgba(255,255,255,.65);
  background: rgb(18 32 66 / 0.71);
}

/* Стили для скролла внутри этого конкретного контейнера */
.${prefix}-scroll::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

.${prefix}-scroll::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
}

.${prefix}-scroll::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
}

.${prefix}-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
}

.${prefix}-table {
  color: var(--tbl-text);
  font-size: 14px;
}
.${prefix}-thead .${prefix}-tr-head {
  background: var(--tbl-head-bg);
  color: var(--tbl-text);
}
.${prefix}-tbody .${prefix}-tr {
  background: var(--tbl-row-bg);
  transition: background .15s ease;
}
${stripedRows ? `.${prefix}-tbody .${prefix}-tr.${prefix}-tr-odd {
  background: color-mix(in srgb, var(--tbl-row-bg) 95%, white);
}` : ''}
.${prefix}-row-clickable {
  cursor: pointer;
}
${hoverRows ? `.${prefix}-tbody .${prefix}-row-clickable:hover {
  background: color-mix(in srgb, var(--tbl-row-bg) 88%, white) !important;
}` : ''}
.${prefix}-tbody .${prefix}-tr.${prefix}-tr-selected,
.${prefix}-tbody .${prefix}-tr.${prefix}-tr-selected.${prefix}-tr-odd {
  background: #555a89 !important;
}
.${prefix}-td.${prefix}-td-selected {
  background: var(--tbl-cell-selected-bg) !important;
  outline: var(--tbl-cell-selected-outline);
  outline-offset: -2px;
  z-index: 1;
  position: relative;
}
.${prefix}-th, .${prefix}-td {
  overflow: hidden;
  text-overflow: ellipsis;
}

.${prefix}-th {
  border: var(--tbl-border-th-width, 1px) var(--tbl-border-th-style, solid) var(--tbl-border-th, var(--tbl-border));
}

.${prefix}-td {
  border: var(--tbl-border-td-width, 1px) var(--tbl-border-td-style, solid) var(--tbl-border-td, var(--tbl-border));
}

/* Управление сторонами бордера (по умолчанию — со всех сторон) */
.${prefix}-wrap.${prefix}-th-border-none .${prefix}-th { border: none; }
.${prefix}-wrap.${prefix}-th-border-bottom .${prefix}-th {
  border: none;
  border-bottom: var(--tbl-border-th-width, 1px) var(--tbl-border-th-style, solid) var(--tbl-border-th, var(--tbl-border));
}
.${prefix}-wrap.${prefix}-th-border-top .${prefix}-th {
  border: none;
  border-top: var(--tbl-border-th-width, 1px) var(--tbl-border-th-style, solid) var(--tbl-border-th, var(--tbl-border));
}
.${prefix}-wrap.${prefix}-th-border-left .${prefix}-th {
  border: none;
  border-left: var(--tbl-border-th-width, 1px) var(--tbl-border-th-style, solid) var(--tbl-border-th, var(--tbl-border));
}
.${prefix}-wrap.${prefix}-th-border-right .${prefix}-th {
  border: none;
  border-right: var(--tbl-border-th-width, 1px) var(--tbl-border-th-style, solid) var(--tbl-border-th, var(--tbl-border));
}
.${prefix}-wrap.${prefix}-th-border-x .${prefix}-th {
  border: none;
  border-left: var(--tbl-border-th-width, 1px) var(--tbl-border-th-style, solid) var(--tbl-border-th, var(--tbl-border));
  border-right: var(--tbl-border-th-width, 1px) var(--tbl-border-th-style, solid) var(--tbl-border-th, var(--tbl-border));
}
.${prefix}-wrap.${prefix}-th-border-y .${prefix}-th {
  border: none;
  border-top: var(--tbl-border-th-width, 1px) var(--tbl-border-th-style, solid) var(--tbl-border-th, var(--tbl-border));
  border-bottom: var(--tbl-border-th-width, 1px) var(--tbl-border-th-style, solid) var(--tbl-border-th, var(--tbl-border));
}

.${prefix}-wrap.${prefix}-td-border-none .${prefix}-td { border: none; }
.${prefix}-wrap.${prefix}-td-border-bottom .${prefix}-td {
  border: none;
  border-bottom: var(--tbl-border-td-width, 1px) var(--tbl-border-td-style, solid) var(--tbl-border-td, var(--tbl-border));
}
.${prefix}-wrap.${prefix}-td-border-top .${prefix}-td {
  border: none;
  border-top: var(--tbl-border-td-width, 1px) var(--tbl-border-td-style, solid) var(--tbl-border-td, var(--tbl-border));
}
.${prefix}-wrap.${prefix}-td-border-left .${prefix}-td {
  border: none;
  border-left: var(--tbl-border-td-width, 1px) var(--tbl-border-td-style, solid) var(--tbl-border-td, var(--tbl-border));
}
.${prefix}-wrap.${prefix}-td-border-right .${prefix}-td {
  border: none;
  border-right: var(--tbl-border-td-width, 1px) var(--tbl-border-td-style, solid) var(--tbl-border-td, var(--tbl-border));
}
.${prefix}-wrap.${prefix}-td-border-x .${prefix}-td {
  border: none;
  border-left: var(--tbl-border-td-width, 1px) var(--tbl-border-td-style, solid) var(--tbl-border-td, var(--tbl-border));
  border-right: var(--tbl-border-td-width, 1px) var(--tbl-border-td-style, solid) var(--tbl-border-td, var(--tbl-border));
}
.${prefix}-wrap.${prefix}-td-border-y .${prefix}-td {
  border: none;
  border-top: var(--tbl-border-td-width, 1px) var(--tbl-border-td-style, solid) var(--tbl-border-td, var(--tbl-border));
  border-bottom: var(--tbl-border-td-width, 1px) var(--tbl-border-td-style, solid) var(--tbl-border-td, var(--tbl-border));
}
.${prefix}-td {
  color: var(--tbl-text-muted);
}
@media (prefers-reduced-motion: reduce) {
  .${prefix}-tbody .${prefix}-tr { transition: none; }
}
/* Закреплённые столбцы: фон, чтобы при прокрутке контент не просвечивал */
.${prefix}-th.${prefix}-pin, .${prefix}-td.${prefix}-pin {
  background: inherit;
}
`;
}

/**
 * После рендера вычисляет left для sticky-колонок и подставляет фон, чтобы закреплённые ячейки не просвечивали.
 * @param {HTMLElement} wrapEl - обёртка таблицы (#tbl-wrap-*)
 * @param {string} prefix - класс-префикс
 * @param {number} pinCount - количество закреплённых столбцов
 */
function applyPinnedColumnsLayout(wrapEl, prefix, pinCount) {
    const table = wrapEl.querySelector(`.${prefix}-table`);
    if (!table) return;
    const thead = table.querySelector(`.${prefix}-thead`);
    const tbody = table.querySelector(`.${prefix}-tbody`);
    if (!thead || !tbody) return;

    const headerRow = thead.querySelector('tr');
    if (!headerRow) return;
    const ths = headerRow.querySelectorAll(`.${prefix}-th.${prefix}-pin`);
    if (ths.length === 0) return;

    const lefts = [];
    let cumulative = 0;
    for (let i = 0; i < ths.length; i++) {
        lefts.push(cumulative);
        cumulative += ths[i].offsetWidth;
    }

    const headBg = getComputedStyle(ths[0]).backgroundColor;

    for (let i = 0; i < ths.length; i++) {
        ths[i].style.left = `${lefts[i]}px`;
        ths[i].style.backgroundColor = headBg;
        if (i === ths.length - 1) ths[i].style.boxShadow = '2px 0 6px rgba(0,0,0,0.15)';
    }

    const rows = tbody.querySelectorAll(`.${prefix}-tr`);
    rows.forEach((tr, rowIndex) => {
        const cells = tr.querySelectorAll(`.${prefix}-td.${prefix}-pin`);
        cells.forEach((td, colIndex) => {
            td.style.left = `${lefts[colIndex]}px`;
            const bg = getComputedStyle(td).backgroundColor;
            td.style.backgroundColor = bg;
            if (colIndex === cells.length - 1) td.style.boxShadow = '2px 0 6px rgba(0,0,0,0.15)';
        });
    });
}

/**
 * Инициализирует виртуализацию: при скролле подставляет в tbody только видимые строки.
 */
function initVirtualizedScroll(wrapEl, tableId, prefix, data, columns, cfg) {
    const scrollEl = wrapEl.querySelector(`.${prefix}-scroll`);
    const tbody = wrapEl.querySelector(`.${prefix}-tbody`);
    if (!scrollEl || !tbody) return;

    const rowHeight = Math.max(1, parseInt(cfg.virtualizedRowHeight, 10) || 44);
    const overscan = Math.max(0, parseInt(cfg.virtualizedOverscan, 10) || 8);
    const total = data.length;
    const pinCount = Math.min(Math.max(0, parseInt(cfg.pinnedColumns, 10) || 0), columns.length);

    let lastStart = 0;
    let lastEnd = Math.min(total, Math.max(20, overscan * 3));
    let rafId = null;

    function updateVisibleWindow() {
        const scrollTop = scrollEl.scrollTop;
        const clientHeight = scrollEl.clientHeight;
        const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
        const endIndex = Math.min(total, Math.ceil((scrollTop + clientHeight) / rowHeight) + overscan);

        if (startIndex === lastStart && endIndex === lastEnd) return;

        lastStart = startIndex;
        lastEnd = endIndex;

        const topSpacer = buildSpacerRow(prefix, columns.length, startIndex * rowHeight);
        const slice = data.slice(startIndex, endIndex);
        const visibleRows = slice.map((row, i) => buildSingleRow(prefix, columns, cfg, row, startIndex + i, rowHeight)).join('');
        const bottomSpacer = buildSpacerRow(prefix, columns.length, (total - endIndex) * rowHeight);

        tbody.innerHTML = topSpacer + visibleRows + bottomSpacer;

        if (pinCount > 0) applyPinnedColumnsLayout(wrapEl, prefix, pinCount);
    }

    function onScroll() {
        if (rafId != null) return;
        rafId = requestAnimationFrame(() => {
            rafId = null;
            updateVisibleWindow();
        });
    }

    scrollEl.addEventListener('scroll', onScroll, { passive: true });
    // На случай изменения размера контейнера
    const ro = typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => onScroll())
        : null;
    if (ro) ro.observe(scrollEl);
    // Синхронизировать окно с текущим видимым участком (на случай если контейнер уже с прокруткой)
    updateVisibleWindow();
}

function initTableEvents(wrapEl, tableId, prefix, data, cfg) {
    const tbody = wrapEl.querySelector(`.${prefix}-tbody`);
    if (!tbody || (!cfg.onRowClick && !cfg.onCellClick)) return;

    tbody.addEventListener('click', (e) => {
        const tr = e.target.closest(`.${prefix}-tr`);
        if (!tr || tr.classList.contains(`${prefix}-tr-head`)) return;
        const rowIndex = parseInt(tr.getAttribute('data-row-index'), 10);
        if (rowIndex < 0 || rowIndex >= data.length) return;
        const row = data[rowIndex];

        const td = e.target.closest(`.${prefix}-td`);
        const hasCellClick = typeof cfg.onCellClick === 'function';
        const hasRowClick = typeof cfg.onRowClick === 'function';

        if (td && hasCellClick) {
            const cellKey = td.getAttribute('data-col') || '';
            const value = row[cellKey];
            const handled = cfg.onCellClick(row, cellKey, value, rowIndex);
            if (handled) {
                tbody.querySelectorAll(`.${prefix}-tr.${prefix}-tr-selected`).forEach((r) => r.classList.remove(`${prefix}-tr-selected`));
                tr.classList.add(`${prefix}-tr-selected`);
                tbody.querySelectorAll(`.${prefix}-td.${prefix}-td-selected`).forEach((c) => c.classList.remove(`${prefix}-td-selected`));
                td.classList.add(`${prefix}-td-selected`);
            } else {
                tbody.querySelectorAll(`.${prefix}-tr.${prefix}-tr-selected`).forEach((r) => r.classList.remove(`${prefix}-tr-selected`));
                tbody.querySelectorAll(`.${prefix}-td.${prefix}-td-selected`).forEach((c) => c.classList.remove(`${prefix}-td-selected`));
            }
            if (hasRowClick && handled) cfg.onRowClick(row, rowIndex);
        } else {
            tbody.querySelectorAll(`.${prefix}-td.${prefix}-td-selected`).forEach((c) => c.classList.remove(`${prefix}-td-selected`));
            if (hasRowClick) {
                tbody.querySelectorAll(`.${prefix}-tr.${prefix}-tr-selected`).forEach((r) => r.classList.remove(`${prefix}-tr-selected`));
                tr.classList.add(`${prefix}-tr-selected`);
                cfg.onRowClick(row, rowIndex);
            } else {
                tbody.querySelectorAll(`.${prefix}-tr.${prefix}-tr-selected`).forEach((r) => r.classList.remove(`${prefix}-tr-selected`));
            }
        }
    });
}
