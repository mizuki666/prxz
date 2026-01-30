// bundler/runTests.js
import { Logger } from '../bundler/Logger.js';
import { runFrmV } from '../tests/frm.v.js';
import { runFrmD } from '../tests/frm.d.js';

const tests = [
    { name: 'frm.v valFormatting', run: runFrmV },
    { name: 'frm.v dateFormatting', run: runFrmD }
];

const switchTest = false

export async function runTests() {
    const { success, error, info, step } = Logger;
    
    if(!switchTest){
        return console.log('\n' + Logger.createBox([
            '\x1b[36m[•]\x1b[0m MODULE TESTS IS OFF \x1b[0m'
        ]));
    }

    console.log('\n' + Logger.createBox([
        '\x1b[36m[•]\x1b[0m RUNNING MODULE TESTS',
        '\x1b[90mTime: ' + Logger.getTime() + '\x1b[0m'
    ]));
    
    step(1, 3, 'SEARCHING FOR TEST FILES');
    
    try {
        // Показываем найденные тесты
        tests.forEach(test => {
            info(`Found test: ${test.name}`);
        });
        
        step(2, 3, 'LOADING TESTS');
        
        // Запускаем все тесты
        const results = [];
        for (const test of tests) {
            info(`Running: ${test.name}`);
            try {
                const result = await test.run();
                results.push({
                    name: test.name,
                    success: true,
                    result: result
                });
                success(`✓ ${test.name} passed`);
            } catch (testError) {
                results.push({
                    name: test.name,
                    success: false,
                    error: testError.message
                });
                error(`✗ ${test.name} failed: ${testError.message}`);
            }
        }
        
        step(3, 3, 'EXECUTING TESTS');
        
        // Считаем статистику
        const passed = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
    
        return { passed, failed, total: results.length };
        
    } catch (testError) {
        throw testError;
    }
}