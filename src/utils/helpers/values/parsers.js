// parsers.js
export const Parsers = {

    normalizeDigits: (str) => {
        // Конвертируем все нелатинские цифры в латинские
        return str.replace(/[٠-۹०-९০-৯੦-੯૦-૯୦-୯௦-௯౦-౯೦-೯൦-൯๐-๙໐-໙၀-၉០-៩]/g, 
            char => Parsers.digitMap[char] || char);
    },

    normalizeFullWidth: (str) => {
        // Конвертируем полную ширину в обычные символы
        return str.replace(/[０-９．]/g, char => {
            if (char === '．') return '.';
            return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
        });
    },

    cleanNumberString: (str) => {
        let clean = str.trim();
        
        // Заменяем разные виды пробелов на обычный пробел
        clean = clean.replace(/[\u00A0\u2009\u202F\u205F]/g, ' ');
        
        // Нормализуем цифры
        clean = Parsers.normalizeDigits(clean);
        clean = Parsers.normalizeFullWidth(clean);
        
        // Убираем все, кроме цифр, точки, запятой, минуса, плюса и E/e
        clean = clean.replace(/[^\d.,+\-Ee\s]/g, '');
        
        // Убираем пробелы
        clean = clean.replace(/\s/g, '');
        
        return clean;
    },

    parseSeparators: (str) => {
        // Обработка разделителей тысяч и десятичных
        if (str.includes('.')) {
            str = str.replace(/,/g, '');
        } else {
            const commaCount = (str.match(/,/g) || []).length;
            if (commaCount > 0) {
                if (commaCount === 1) {
                    str = str.replace(',', '.');
                } else {
                    const lastCommaIndex = str.lastIndexOf(',');
                    str = str.substring(0, lastCommaIndex).replace(/,/g, '') + 
                          '.' + str.substring(lastCommaIndex + 1);
                }
            }
        }
        
        return str;
    },

    parseNumberFromString: (str) => {
        const clean = Parsers.cleanNumberString(str);
        const withSeparators = Parsers.parseSeparators(clean);
        
        // Удаляем лишние точки (оставляем только последнюю)
        const parts = withSeparators.split('.');
        if (parts.length > 1) {
            const finalStr = parts[0] + '.' + parts.slice(1).join('');
            return parseFloat(finalStr);
        }
        
        return parseFloat(withSeparators);
    }
};