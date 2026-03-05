import { genId } from '../../utils/genId.js';

const DEFAULT_CONFIG = {
    container: null,
    dataset: [],
    columns: [],
    columnWidths: null,
    stickyHeader: true,
    onRowClick: null,
    onCellClick: null,
    classPrefix: 'prxz-tbl',
    style: {},
};

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
 * Преобразует сырой массив { cols, values } в массив объектов-строк (как getDataTable).
 * @param {Array<{cols: string[], values: *[]}>} raw
 * @returns {Object[]}
 */
function rawToRowObjects(raw) {
    const out = [];
    for (const v of raw) {
        const row = {};
        const pc = v.cols || [];
        const pv = v.values || [];
        for (let j = 0; j < pc.length; j++) {
            row[pc[j]] = pv[j];
        }
        out.push(row);
    }
    return out;
}

/**
 * Нормализует конфиг: колонки могут быть строками (ключ) или объектами { key, label?, width? }.
 * @param {Array<string|{key: string, label?: string, width?: string|number}>} columns
 * @returns {{key: string, label: string, width: string}[]}
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
        return { key, label, width: String(width) };
    });
}

/**
 * Рендер таблицы в контейнер.
 * Вызов: renderTable(container, dataset, config) или renderTable({ container, dataset, ...config }).
 * @param {string|HTMLElement|Object} containerOrConfig - id/элемент контейнера или единый конфиг { container, dataset, columns?, ... }
 * @param {Object[]|Array<{cols: string[], values: *[]}>} [dataset] - массив строк { key: value } или сырой формат { cols, values } (имена столбцов из cols)
 * @param {Object} [config] - конфиг (если первый аргумент — container)
 * @param {Array<string|{key: string, label?: string, width?: string|number}>} [config.columns] - колонки (необязательно: автоматом из данных)
 * @param {Object.<string, string|number>} [config.columnWidths] - ширины по ключу колонки (при авто-колонках), например { 'РНГИО': '120px' }
 * @param {boolean} [config.stickyHeader=true] - закреплённый заголовок при прокрутке
 * @param {function(row: Object, rowIndex: number)} [config.onRowClick] - клик по строке
 * @param {function(row: Object, cellKey: string, value: *, rowIndex: number)} [config.onCellClick] - клик по ячейке
 * @param {Object} [config.style] - доп. стили обёртки (backgroundColor, borderRadius и т.д.)
 */
export function renderTable(containerOrConfig, dataset, config = {}) {
    let container;
    let data;
    let cfg;
    if (containerOrConfig && typeof containerOrConfig === 'object' && !containerOrConfig.nodeType && containerOrConfig.dataset !== undefined) {
        cfg = { ...DEFAULT_CONFIG, ...containerOrConfig };
        container = cfg.container;
        data = Array.isArray(cfg.dataset) ? cfg.dataset : [];
    } else {
        container = containerOrConfig;
        data = Array.isArray(dataset) ? dataset : [];
        cfg = { ...DEFAULT_CONFIG, ...config };
    }
    if (isRawColsValues(data)) {
        data = rawToRowObjects(data);
    }
    const columns = normalizeColumns(cfg.columns);
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
            const w = widths[col.key];
            if (w != null && w !== '') col.width = typeof w === 'number' ? w + 'px' : String(w);
        });
    }

    const html = buildTableHTML(tableId, prefix, data, columns, cfg);
    el.innerHTML = html;
    initTableEvents(el, tableId, prefix, data, cfg);
}

function buildTableHTML(tableId, prefix, data, columns, cfg) {
    const stickyHeader = cfg.stickyHeader !== false;
    const wrapperStyle = { borderRadius: '12px', overflow: 'hidden', ...(cfg.style || {}) };
    const wrapperStyleStr = Object.entries(wrapperStyle)
        .map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}:${v}`)
        .join(';');

    let thStyle = 'padding: 10px 12px; text-align: left; font-weight: 600; white-space: nowrap;';
    if (stickyHeader) {
        thStyle += ' position: sticky; top: 0; z-index: 2; background: var(--tbl-head-bg, #1e2a4a); box-shadow: 0 1px 0 var(--tbl-border, rgba(255,255,255,.08));';
    }
    const colgroup = columns
        .map((col) => {
            const w = col.width ? ` style="width:${escapeAttr(col.width)}"` : '';
            return `<col${w}>`;
        })
        .join('');

    const headerCells = columns
        .map((col) => {
            const w = col.width ? `width:${col.width};min-width:${col.width};max-width:${col.width};` : '';
            return `<th class="${prefix}-th" style="${thStyle}${w ? ' ' + w : ''}" data-col="${escapeAttr(col.key)}">${escapeHtml(col.label)}</th>`;
        })
        .join('');

    const rows = data.map((row, rowIndex) => {
        const cells = columns
            .map((col) => {
                const value = row[col.key];
                const text = value != null ? String(value) : '';
                const w = col.width ? `width: ${col.width}; min-width: ${col.width}; max-width: ${col.width};` : '';
                return `<td class="${prefix}-td" style="padding: 10px 12px; ${w}" data-col="${escapeAttr(col.key)}" data-row-index="${rowIndex}">${escapeHtml(text)}</td>`;
            })
            .join('');
        const clickable = cfg.onRowClick || cfg.onCellClick ? ` ${prefix}-row-clickable` : '';
        return `<tr class="${prefix}-tr${clickable}" data-row-index="${rowIndex}">${cells}</tr>`;
    }).join('');

    return `
<div id="tbl-wrap-${tableId}" class="${prefix}-wrap" style="${wrapperStyleStr}; display: flex; flex-direction: column; height: 100%; min-height: 0;">
  <div class="${prefix}-scroll" style="flex: 1; min-height: 0; overflow: auto;">
    <table id="tbl-${tableId}" class="${prefix}-table" style="width: 100%; border-collapse: collapse; border-spacing: 0; table-layout: fixed;">
      <colgroup>${colgroup}</colgroup>
      <thead class="${prefix}-thead">
        <tr class="${prefix}-tr ${prefix}-tr-head">${headerCells}</tr>
      </thead>
      <tbody class="${prefix}-tbody">${rows}</tbody>
    </table>
  </div>
</div>
<style>${tableStyles(prefix)}</style>`;
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

function tableStyles(prefix) {
    return `
.${prefix}-wrap {
  --tbl-head-bg: rgb(18 32 66 / 0.95);
  --tbl-row-bg: rgb(39 43 76);
  --tbl-row-hover: rgba(255,255,255,.06);
  --tbl-border: rgba(255,255,255,.08);
  --tbl-text: rgba(255,255,255,.92);
  --tbl-text-muted: rgba(255,255,255,.65);
  background: rgb(18 32 66 / 0.71);
}
.${prefix}-scroll {
  scrollbar-width: thin;
}
.${prefix}-table {
  table-layout: fixed;
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
.${prefix}-tbody .${prefix}-tr:nth-child(even) {
  background: color-mix(in srgb, var(--tbl-row-bg) 95%, white);
}
.${prefix}-row-clickable {
  cursor: pointer;
}
.${prefix}-tbody .${prefix}-row-clickable:hover {
  background: color-mix(in srgb, var(--tbl-row-bg) 88%, white) !important;
}
.${prefix}-th, .${prefix}-td {
  border-bottom: 1px solid var(--tbl-border);
  overflow: hidden;
  text-overflow: ellipsis;
}
.${prefix}-td {
  color: var(--tbl-text-muted);
}
@media (prefers-reduced-motion: reduce) {
  .${prefix}-tbody .${prefix}-tr { transition: none; }
}
`;
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
        if (td && typeof cfg.onCellClick === 'function') {
            const cellKey = td.getAttribute('data-col') || '';
            const value = row[cellKey];
            cfg.onCellClick(row, cellKey, value, rowIndex);
        }
        if (typeof cfg.onRowClick === 'function') {
            cfg.onRowClick(row, rowIndex);
        }
    });
}
