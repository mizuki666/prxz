// validators.js
export const Validators = {
    isEmptyValue: (value) => {
        return value === null || 
            value === undefined || 
            value === '' || 
            (Array.isArray(value) && value.length === 0);
    },

    isObject: (value) => {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    },

    isSpecialNumber: (num) => {
        return isNaN(num) || !isFinite(num);
    },

    isInteger: (num) => {
        return Number.isInteger(num);
    },

    isScientificNotationNeeded: (num) => {
        const absNum = Math.abs(num);
        return absNum > 1e15 || 
               (absNum > 0 && absNum < 1e-6) ||
               absNum > Number.MAX_SAFE_INTEGER ||
               absNum === Infinity;
    },

    isNegativeZero: (num) => {
        return num === 0 && 1 / num === -Infinity;
    },

    isNumericString: (str) => {
        const cleaned = str.trim().replace(/[\s\u00A0\u202F,]/g, '');
        return !isNaN(cleaned) && !isNaN(parseFloat(cleaned));
    }
};