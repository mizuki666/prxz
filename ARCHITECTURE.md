# Архитектура prxz

## Структура проекта

```
src/
├── index.js              # Единая точка входа, публичный API
├── api/                  # Внешние API (visiology и др.)
│   ├── indexVisi.js
│   ├── utils/
│   └── visiology/
├── components/           # UI-компоненты
│   ├── table/
│   │   ├── index.js      # Публичный экспорт компонента
│   │   └── Table.js      # Реализация
│   ├── slider/
│   │   ├── index.js
│   │   └── Slider.js
│   └── log/
├── utils/                # Утилиты (форматирование, хелперы, genId)
│   ├── formatValue.js
│   ├── formatDate.js
│   ├── filterText.js
│   ├── genId.js
│   └── helpers/
└── ...
```

## Публичный API (prxz)

- **prxz.comp** — компоненты. У каждого компонента один метод `render`.
  - `prxz.comp.table.render(config)` — таблица
  - `prxz.comp.slider.render(container, imageUrls, options)` — слайдер
- **prxz.api** — доступ к внешним сервисам (visi и др.)
- **prxz.lg** — логгер
- **prxz.frm** — форматтеры (v — значения, d — даты)
- **prxz.func.other** — прочие функции (FilterReplaceText, genId)

Использование компонентов через `prxz.comp.<имя>.render(...)` — без лишней вложенности.

## Компоненты

Каждый компонент живёт в своей папке под `src/components/<name>/`:

- **index.js** — реэкспорт наружу (например `export { renderTable } from './Table.js'`).
- **<Name>.js** — реализация. Экспортирует функцию рендера и при необходимости вспомогательные функции.

Подключение в `src/index.js`: импорт из `./components/<name>/index.js`, добавление в `prxz.comp.<name>.render`.

## Таблица (comp.table)

- **Входные данные**: массив строк в формате `{ cols, values }[]` (как из visiology) или массив объектов `{ [key]: value }[]`. Колонки по умолчанию выводятся из данных.
- **Ширина одной колонки без перечисления всех**: в конфиг передать `columnWidths: { 'ИмяКолонки': '120px' }`.
- **Полный контроль**: передать `columns: [{ key, label?, width? }, ...]`.

## Сборка

Точка входа — `src/index.js`. Бандлер обходит импорты, поэтому добавление компонента через индекс в `src/index.js` и папку в `src/components/` достаточно для попадания в бандл.
