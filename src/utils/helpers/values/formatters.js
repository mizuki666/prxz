// formatters.js
export const Formatters = {
    narrowNoBreakSpace: '\u202F',

    determineDecimals: (num, decimalsMode) => {
        // Если передано число, используем его как фиксированное количество знаков
        if (typeof decimalsMode === 'number') {
            return { min: decimalsMode, max: decimalsMode };
        }
        
        // Режим 'auto'
        if (Validators.isScientificNotationNeeded(num)) {
            return { scientific: true };
        }
        
        // Для очень маленьких чисел показываем больше знаков
        const absNum = Math.abs(num);
        if (absNum > 0 && absNum < 0.001) {
            const str = num.toString();
            if (str.includes('e-')) {
                // Для чисел в экспоненциальной нотации
                const [mantissa, exp] = str.split('e-');
                const firstNonZero = mantissa.replace('.', '').search(/[1-9]/);
                const totalDigits = parseInt(exp) + firstNonZero - 1;
                return { min: totalDigits + 2, max: totalDigits + 2 };
            } else if (str.includes('.')) {
                const decimalPart = str.split('.')[1];
                // Показываем все значащие цифры
                const neededDigits = decimalPart.length;
                return { min: neededDigits, max: neededDigits };
            }
        }
        
        // Для целых чисел
        if (Validators.isInteger(num)) {
            return { min: 0, max: 0 };
        }
        
        // Для остальных чисел: показываем от 2 до 6 знаков
        const str = num.toString();
        let decimalPart = str.includes('.') ? str.split('.')[1] : '';
        decimalPart = decimalPart.replace(/0+$/, '');
        const significantDigits = decimalPart.length;
        
        if (significantDigits <= 2) {
            return { min: significantDigits, max: significantDigits };
        } else if (significantDigits <= 6) {
            return { min: 2, max: Math.min(significantDigits, 6) };
        } else {
            return { min: 2, max: 6 };
        }
    },

    formatScientific: (num) => {
        const exp = Math.floor(Math.log10(Math.abs(num)));
        const mantissa = num / Math.pow(10, exp);
        return mantissa.toFixed(2) + 'e' + exp;
    },

    formatWithLocale: (num, decimals, useGrouping = true) => {
        const options = {
            minimumFractionDigits: decimals.min,
            maximumFractionDigits: decimals.max,
            useGrouping
        };
        
        let result = num.toLocaleString('ru-RU', options);
        
        // Заменяем обычные пробелы на узкий неразрывный пробел
        result = result.replace(/\s/g, Formatters.narrowNoBreakSpace);
        
        // Обработка -0
        if (Validators.isNegativeZero(num) || result.startsWith('-0')) {
            result = result.substring(1);
        }
        
        return result;
    },

    formatWithoutLocale: (num, decimals) => {
        let result;
        if (decimals.min === decimals.max) {
            result = num.toFixed(decimals.min);
        } else {
            const factor = Math.pow(10, decimals.max);
            const rounded = Math.round(num * factor) / factor;
            result = rounded.toString();
        }
        
        // Заменяем точку на запятую
        result = result.replace('.', ',');
        
        if (Validators.isNegativeZero(num) || result.startsWith('-0')) {
            result = result.substring(1);
        }
        
        return result;
    }
};