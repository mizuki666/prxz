const categories = (w.xAxis && w.xAxis.data) ? w.xAxis.data : [];
const seriesData = (w.series && w.series[0] && w.series[0].data) ? w.series[0].data : [];
const values = seriesData.map(function (d) { return d.value; });
const preFire = categories[0].split(' - ')
const deltas = values.map(function (v, i) {
    if (i === 0) return null;
    return values[i] - values[i - 1];
});
 
// Пороги (см) — можно закомментировать любой, остальное будет работать
const THRESHOLD_NGY = preFire[1];   // неблагоприятное
const THRESHOLD_POIMA = preFire[2]; // пойма
const THRESHOLD_OGY = preFire[3];  // опасное

// Активные пороги (от меньшего к большему)
var THRESHOLD_CONFIG = [
    typeof THRESHOLD_NGY !== "undefined" && { value: THRESHOLD_NGY, name: "Неблагоприятное гидрологическое явление", short: "НГЯ", barColor: "#d97706", barColorBorder: "#b45309", lineStyle: { color: "rgba(234,179,8,0.9)", width: 1 } },
    typeof THRESHOLD_POIMA !== "undefined" && { value: THRESHOLD_POIMA, name: "Уровень выхода на пойму", short: "пойма", barColor: "#ea580c", barColorBorder: "#c2410c", lineStyle: { color: "rgba(249,115,22,0.9)", width: 1 } },
    typeof THRESHOLD_OGY !== "undefined" && { value: THRESHOLD_OGY, name: "Опасное гидрологическое явление", short: "ОГЯ", barColor: "#dc2626", barColorBorder: "#b91c1c", lineStyle: { color: "rgba(239,68,68,0.95)", width: 1 } }
].filter(Boolean).sort(function (a, b) { return a.value - b.value; });

var sizeMAX = THRESHOLD_CONFIG.length
    ? Math.max.apply(null, THRESHOLD_CONFIG.map(function (t) { return t.value; })) + 50
    : 500;
var valuesMin = values.length ? Math.min.apply(null, values) : 0;
var valuesMax = values.length ? Math.max.apply(null, values) : sizeMAX;
var yAxisMin = valuesMin < 0 ? Math.floor(valuesMin / 100) * 100 : 0;
var yAxisMax = Math.max(sizeMAX, valuesMax + 50);
var yAxisInterval = Math.max(50, Math.round((yAxisMax - yAxisMin) / 12 / 50) * 50);

function formatDate(str) {
    if (!str) return "";
    const match = str.match(/(\d{4})-(\d{2})-(\d{2})/);
    return match ? match[3] + "." + match[2] + "." + match[1] : str;
}

function barColor(v) {
    for (var i = THRESHOLD_CONFIG.length - 1; i >= 0; i--) {
        if (v >= THRESHOLD_CONFIG[i].value) return THRESHOLD_CONFIG[i].barColor;
    }
    return "#0d9488";
}

function barColorBorder(v) {
    for (var i = THRESHOLD_CONFIG.length - 1; i >= 0; i--) {
        if (v >= THRESHOLD_CONFIG[i].value) return THRESHOLD_CONFIG[i].barColorBorder;
    }
    return "#0f766e";
}

function deltaColor(d) {
    if (d == null || d === 0) return "#22c55e";
    return d > 0 ? "#ef4444" : "#22c55e";
}

// Цвета линии по направлению: вверх — красный, вниз — зелёный
var linePlus = "rgb(196, 65, 77)";
var lineMinus = "rgb(34, 197, 94)";

// Цвет сегмента по дельте и цвет точки (маркера) по индексу
function getSegmentColorByDelta(delta) {
    return delta > 0 ? linePlus : lineMinus;
}
function getPointSegmentColor(pointIndex) {
    var d;
    if (pointIndex < values.length - 1) d = values[pointIndex + 1] - values[pointIndex];
    else if (pointIndex > 0) d = values[pointIndex] - values[pointIndex - 1];
    else d = 0;
    return getSegmentColorByDelta(d);
}

// Заливка под каждым сегментом (плюс/минус) и сами сегменты линии
var areaSegmentSeries = [];
var lineSegmentSeries = [];
for (var i = 0; i < values.length - 1; i++) {
    var delta = values[i + 1] - values[i];
    var segColor = getSegmentColorByDelta(delta);
    var segColorArea = delta > 0 ? "rgba(196,65,77,0.35)" : "rgba(34,197,94,0.35)";
    var segData = values.map(function (v, j) {
        return (j === i || j === i + 1) ? values[j] : null;
    });
    areaSegmentSeries.push({
        type: "line",
        data: segData,
        showSymbol: false,
        smooth: false,
        lineStyle: { width: 0 },
        areaStyle: { color: segColorArea },
        silent: true
    });
    lineSegmentSeries.push({
        type: "line",
        data: segData,
        showSymbol: false,
        smooth: false,
        lineStyle: { width: 2, color: segColor },
        silent: true
    });
}

const lineData = values.map(function (v, i) {
    const d = deltas[i];
    const deltaStr = d != null ? (d > 0 ? "+" + d : String(d)) : "-";
    const dColor = deltaColor(d);
    var ptColor = getPointSegmentColor(i);
    return {
        value: v,
        name: categories[i] || "",
        itemStyle: {
            color: ptColor,
            borderColor: ptColor,
            borderWidth: 2
        },
        label: {
            show: true,
            position: "top",
            color: "#f1f5f9",
            fontFamily: "Open Sans",
            fontSize: 11,
            fontWeight: "600",
            rich: { delta: { color: dColor } },
            formatter: function () {
                var d = deltas[i];
                var deltaStr = d != null ? (d > 0 ? "+" + d : String(d)) : "-";
                var close = ")}";
                return v + " \u0441\u043C\n{delta|(" + deltaStr + close;
            }
        }
    };
});

const config = {
    general: Object.assign({}, w.general, {
        backgroundColor: "#0f172a",
        textStyle: {
            color: "rgba(255,255,255,0.9)",
            fontFamily: "Open Sans, system-ui, sans-serif"
        }
    }),
    xAxis: {
        axisLabel: {
            show: true,
            interval: "auto",
            overflow: "break",
            rotate: 45,
            color: "rgba(255,255,255,0.75)",
            fontFamily: "Open Sans",
            fontSize: 11,
            formatter: formatDate
        },
        axisLine: { show: true, lineStyle: { color: "rgba(71,85,105,0.8)" } },
        splitLine: { show: false },
        position: "bottom",
        type: "category",
        axisTick: { show: false },
        animation: true,
        data: categories,
        boundaryGap: true
    },
    yAxis: {
        name: "Уровень воды над нулем графика в 8 часов, (см)",
        nameRotate: 90,
        nameLocation: "middle",
        nameGap: 50,
        axisLabel: {
            show: true,
            color: "rgba(255,255,255,0.85)",
            fontFamily: "Open Sans",
            fontSize: 14
        },
        axisLine: { show: true, lineStyle: { color: "rgba(71,85,105,0.8)" } },
        splitLine: {
            show: true,
            lineStyle: { color: "rgba(255,255,255,0.2)", type: "solid" }
        },
        min: yAxisMin,
        max: yAxisMax,
        interval: yAxisInterval,
        minInterval: 0,
        position: "left",
        type: "value",
        nameTextStyle: {
            color: "rgba(255,255,255,0.9)",
            fontFamily: "Open Sans",
            fontSize: 11,
            padding: [0, 0, 0, 8]
        }
    },
    series: areaSegmentSeries.concat(lineSegmentSeries, [
        {
            type: "line",
            id: w.series && w.series[0] ? w.series[0].id : "level",
            name: w.series && w.series[0] ? w.series[0].name : "Уровень",
            data: lineData,
            smooth: true,
            showSymbol: true,
            symbol: "circle",
            symbolSize: 8,
            lineStyle: { width: 0 },
            emphasis: {
                scale: 1.2,
                itemStyle: {
                    shadowBlur: 8,
                    shadowColor: "rgba(0,0,0,0.3)",
                    borderColor: "#fff",
                    borderWidth: 2
                }
            },
            label: { show: true, position: "top", fontFamily: "Open Sans", fontSize: 11 },
            markArea: (function () {
                var zones = [];
                for (var i = THRESHOLD_CONFIG.length - 1; i >= 0; i--) {
                    var top = i === THRESHOLD_CONFIG.length - 1 ? yAxisMax : THRESHOLD_CONFIG[i + 1].value;
                    zones.push([{ yAxis: THRESHOLD_CONFIG[i].value }, { yAxis: top }]);
                }
                return {
                    silent: true,
                    itemStyle: { color: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.2)", borderWidth: 0 },
                    data: zones
                };
            })(),
            markLine: (function () {
                var baseLabel = { show: true, fontSize: 14, color: "rgba(255,255,255,0.9)", backgroundColor: "rgba(15,23,42,0.85)", padding: [4, 8], borderRadius: 4, formatter: "{b}" };
                return {
                    symbol: "none",
                    label: baseLabel,
                    data: THRESHOLD_CONFIG.map(function (t, i) {
                        return {
                            yAxis: t.value,
                            name: t.name + " - " + t.value + " см",
                            lineStyle: t.lineStyle,
                            label: { position: i % 2 === 0 ? "insideStartTop" : "insideEndTop" }
                        };
                    })
                };
            })()
        }
    ]),
    legend: Object.assign({}, w.legend, { show: false }),
    tooltip: {
        show: true,
        trigger: "axis",
        backgroundColor: "rgba(15,23,42,0.96)",
        borderColor: "rgba(71,85,105,0.6)",
        borderWidth: 1,
        padding: 12,
        textStyle: { fontFamily: "Open Sans", fontSize: 16, color: "#e2e8f0" },
        formatter: function (params) {
            const p = params && (params[params.length - 1] || params[0]);
            if (!p) return "";
            const idx = p.dataIndex;
            const v = values[idx];
            const d = deltas[idx];
            const date = formatDate(categories[idx] || "");
            const lines = [
                "<strong>" + date + "</strong>",
                "Уровень: <strong>" + v + " см</strong>"
            ];
            if (d != null) {
                const sign = d > 0 ? "+" : (d < 0 ? "" : "");
                const trendStr = d !== 0 ? sign + d + " см" : "0 см";
                const trendColor = d > 0 ? "#ef4444" : (d < 0 ? "#22c55e" : "#94a3b8");
                lines.push('Изменение за сутки: <span style="color:' + trendColor + '">' + trendStr + "</span>");
            }
            lines.push("");
            THRESHOLD_CONFIG.forEach(function (t) {
                var d = t.value - v;
                if (v < t.value) {
                    lines.push("До " + t.short + " (" + t.value + " см): " + d + " см");
                } else {
                    lines.push("Выше " + t.short + " на " + (-d) + " см");
                }
            });
            const maxVal = Math.max.apply(null, values);
            const minVal = Math.min.apply(null, values);
            lines.push("");
            lines.push("Мин. за период: " + minVal + " см · Макс.: " + maxVal + " см");
            return lines.join("<br/>");
        }
    },
    grid: {
        left: 40,
        right: 10,
        top: 20,
        bottom: 0,
        containLabel: true
    },
    dataZoom: w.dataZoom || []
};

ChartRender({
    general: config.general,
    xAxis: config.xAxis,
    yAxis: config.yAxis,
    series: config.series,
    legend: config.legend,
    tooltip: config.tooltip,
    grid: config.grid,
    dataZoom: config.dataZoom
});
