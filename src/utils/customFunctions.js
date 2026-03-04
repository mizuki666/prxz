const CustomFunctions = {
    /**
     * Подменяет заголовок фильтра с текстом «Все» на заданный текст через указанную задержку.
     * Используется для отложенного обновления UI после применения фильтра.
     *
     * @param {number} time - Задержка в мс перед заменой текста (для синхронизации с рендером).
     * @param {string} text - Новый текст заголовка фильтра.
     * @param {string} id - ID контейнера элемента (должен содержать .rb-filter-header-text).
     *
     * @example
     * FilterReplaceText(100, 'Регион', 'filter-container-id');
     */
    FilterReplaceText(time,text,id) {
        setTimeout(() => {
                const container = document.getElementById(id)
                const textElement = container.querySelector('.rb-filter-header-text')
                const textContent = textElement.textContent
                
                if(textContent === 'Все'){
                    textElement.textContent = text
                }
        }, time)
    },
    /**
     * Генерирует псевдо-UUID v4: строку вида xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
     * (версия 4 в позиции 13, вариант в позиции 17 — по спецификации RFC 4122).
     *
     * @returns {string} Строка из 36 символов (32 hex + 4 дефиса).
     *
     * @example
     * genId(); // "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
     */
    genId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
};

export {CustomFunctions}