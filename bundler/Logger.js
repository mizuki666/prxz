export class Logger {
    static createBox(lines) {
        const maxLength = Math.max(...lines.map(line => line.replace(/\x1b\[[0-9;]*m/g, '').length));
        const width = maxLength + 4;
        
        let box = '\x1b[32m┌' + '─'.repeat(width - 2) + '┐\x1b[0m\n';
        
        lines.forEach(line => {
            const cleanLine = line.replace(/\x1b\[[0-9;]*m/g, '');
            const padding = width - cleanLine.length - 3;
            box += `\x1b[32m│\x1b[0m ${line}${' '.repeat(padding)}\x1b[32m│\x1b[0m\n`;
        });
        
        box += '\x1b[32m└' + '─'.repeat(width - 2) + '┘\x1b[0m';
        return box;
    }

    static formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    static getTime() {
        return new Date().toISOString().split('T')[1].split('.')[0];
    }

    static info(message) {
        console.log(`\x1b[36m[•]\x1b[0m ${message}`);
    }

    static success(message) {
        console.log(`\x1b[32m[✓]\x1b[0m ${message}`);
    }

    static warning(message) {
        console.log(`\x1b[33m[!]\x1b[0m ${message}`);
    }

    static error(message) {
        console.log(`\x1b[31m[✗]\x1b[0m ${message}`);
    }

    static step(step, total, message) {
        console.log(`\x1b[36m[${step}/${total}]\x1b[0m » ${message}`);
    }
}