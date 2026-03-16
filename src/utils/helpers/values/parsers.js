// parsers.js
export const Parsers = {
    // Карта нелатинских цифр → латинские.
    // Нужна для корректного парсинга чисел из строк с арабскими/индийскими и др. цифрами.
    digitMap: {
        // Arabic-Indic
        '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
        // Extended Arabic-Indic (Persian)
        '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
        // Devanagari
        '०': '0', '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
        // Bengali
        '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
        // Gurmukhi
        '੦': '0', '੧': '1', '੨': '2', '੩': '3', '੪': '4', '੫': '5', '੬': '6', '੭': '7', '੮': '8', '੯': '9',
        // Gujarati
        '૦': '0', '૧': '1', '૨': '2', '૩': '3', '૪': '4', '૫': '5', '૬': '6', '૭': '7', '૮': '8', '૯': '9',
        // Oriya
        '୦': '0', '୧': '1', '୨': '2', '୩': '3', '୪': '4', '୫': '5', '୬': '6', '୭': '7', '୮': '8', '୯': '9',
        // Tamil
        '௦': '0', '௧': '1', '௨': '2', '௩': '3', '௪': '4', '௫': '5', '௬': '6', '௭': '7', '௮': '8', '௯': '9',
        // Telugu
        '౦': '0', '౧': '1', '౨': '2', '౩': '3', '౪': '4', '౫': '5', '౬': '6', '౭': '7', '౮': '8', '౯': '9',
        // Kannada
        '೦': '0', '೧': '1', '೨': '2', '೩': '3', '೪': '4', '೫': '5', '೬': '6', '೭': '7', '೮': '8', '೯': '9',
        // Malayalam
        '൦': '0', '൧': '1', '൨': '2', '൩': '3', '൪': '4', '൫': '5', '൬': '6', '൭': '7', '൮': '8', '൯': '9',
        // Thai
        '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4', '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9',
        // Lao
        '໐': '0', '໑': '1', '໒': '2', '໓': '3', '໔': '4', '໕': '5', '໖': '6', '໗': '7', '໘': '8', '໙': '9',
        // Myanmar
        '၀': '0', '၁': '1', '၂': '2', '၃': '3', '၄': '4', '၅': '5', '၆': '6', '၇': '7', '၈': '8', '၉': '9',
        // Khmer
        '០': '0', '១': '1', '២': '2', '៣': '3', '៤': '4', '៥': '5', '៦': '6', '៧': '7', '៨': '8', '៩': '9',
    },

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

export default Parsers;