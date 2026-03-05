console.clear();
const { info, debug } = prxz.lg.log;
info(prxz);

const wGuid = w.general.renderTo;
const filterID = '251f3ed2c2824e18af0c15ee4e040eb3';

const dataset = getDataTable(w.data.primaryData.items);
info(dataset);

// Колонки: key — совпадает с ключами из getDataTable (из v.cols); width — по желанию (px или %)
const tableConfig = {
    container: wGuid,
    dataset,
    columns: [
        { key: 'name', label: 'Наименование', width: '25%' },
        { key: 'value', label: 'Значение', width: '15%' },
        { key: 'mass', label: 'Масса', width: '120px' },
    ],
    stickyHeader: true,
    style: {
        borderRadius: '20px',
        background: 'rgb(18 32 66 / 71%)',
        padding: '10px',
    },
    onRowClick(row, rowIndex) {
        const rngio = row.mass; // или другое поле для фильтра (раньше data-mass)
        if (rngio != null && typeof visApi === 'function') {
            visApi().setFilterSelectedValues(filterID, [[rngio]], function () {});
        }
        // todo: потом добавить открытие модалок
    },
    onCellClick(row, cellKey, value, rowIndex) {
        // опционально: реакция на клик по ячейке
        debug({ row, cellKey, value, rowIndex });
    },
};

prxz.comp.table.render(tableConfig);

function getDataTable(raw) {
    debug(raw);
    const rawDataset = [];
    if (!Array.isArray(raw)) return rawDataset;
    raw.forEach((v) => {
        const pc = v.cols;
        const pv = v.values;
        const rowObject = {};
        for (let j = 0; j < pc.length; j++) {
            rowObject[pc[j]] = pv[j];
        }
        rawDataset.push(rowObject);
    });
    return rawDataset;
}
