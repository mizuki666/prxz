import * as dotenv from 'dotenv';
dotenv.config(); 

// Идентификатор дашборда получаем из адресной строки браузера
const urlParams = new URLSearchParams(window.location.search);
const wGuid = urlParams.get('dashboardGuid');
// Ключ для обращений к API Графаны должен быть создан заранее

// В отдельной переменной прописываем параметры запроса Loki. В них задается временной промежуток просмотра логов.
const params = new URLSearchParams({
    'query': '{component="v3-dashboard-service"} |= `OperationName:\\"GetDashboard\\"` |= "' + dGuid + '" |= "Success" | json',
    'since': '24h'
});

// Функция которая создает таблицу с датами и именами пользователей, открывавших дашборд.
// Принимает массив с данными логов из Loki.
// Отдает строку с HTML кодом, которая просто вставляется в текст виджета.
function logTable(data) {
    let table = '<table style="width: 90%; margin: 0 auto; font-size: 14px;">';
    data.forEach(item => {
        // Приводим дату из записи лога к более удобочитаемому виду
        let dt = new Intl.DateTimeFormat('ru-RU', {dateStyle: 'short', timeStyle: 'long'}).format(Date.parse(item.stream.time));
        // Выбираем из текста лога имя пользователя, посещавшего дашборд (не должно содержать спецсимволы).
        let user = item.stream.log.match(/User:\"(\w+)\"/)[1];
        table += `<tr><td>${dt}</td><td>${user}</td></tr>`
    });
    table += '</table>'
    return table
}

// Так как запрос к API Графаны будет выполняться некоторое время заворачиваем основную логику виджета в асинхронную функцию,
// чтобы он отрисовался после получения данных.
async function countVisits() {
    // Необходимо предварительно узнать идентификатор источника данных Loki сделав запрос на эндпоинт /v3/grafana/api/datasources (например Постманом)
    let sourceId = 3;
    w.general.text = await fetch(`${window.location.origin}/v3/grafana/api/datasources/proxy/${sourceId}/loki/api/v1/query_range?${params.toString()}`, {
        headers: {
            'Content-Type': 'text/html',
            'Authorization': `Bearer ${gapikey}`
        }
        }).then(response => response.json()).then(json => {
            return json.data.result.length + '<br>' + logTable(json.data.result);
    });
    // Выполняем стандартную отрисовку виджета
    TextRender({
        text: w.general,
        style: w.style
    });
}

// Запускаем функцию основной логики виджета
countVisits();