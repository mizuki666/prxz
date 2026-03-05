console.clear();
const { info, debug } = prxz.lg.log;
info(prxz);

const wGuid = w.general.renderTo;
const filterID = '251f3ed2c2824e18af0c15ee4e040eb3';

// Можно передать сырые данные { cols, values } — таблица сама возьмёт имена столбцов из cols
const dataset = w.data.primaryData.items;

const tableConfig = {
    container: wGuid,
    dataset,
    // columns не задаём — подхватятся из cols; при необходимости задайте ширины: columns: [{ key: 'mass', width: '120px' }, ...]
    stickyHeader: true,
    style: {
        borderRadius: '20px',
        background: 'rgb(18 32 66 / 71%)',
        padding: '10px',
    },
    onRowClick(row, rowIndex) {
        const rngio = row.mass; // ключ как в cols; при необходимости замените на нужное поле
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
