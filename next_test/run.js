/**
 * Быстрый тест prxz.min.js
 * Запуск: из корня prxz — make run-next  или  node next_test/run.js
 */
import { loadPrxz } from '../tests/utils/loadLibrary.js';

async function run() {
  console.log('next_test: загрузка prxz.min.js\n');

  const prxz = await loadPrxz();

  const { fval, fperc, fmoney, fshortval } = prxz.frm?.v || {};
  if (!fval || !fperc) {
    throw new Error('prxz.frm.v (fval, fperc) не найден');
  }

  let ok = 0;
  let fail = 0;

  if (fval(123)?.replace(/\s/g, ' ') === '123,00') {
    ok++;
  } else {
    fail++;
    console.log('  fail fval(123)');
  }
  if (fval(1000)?.includes('1') && fval(1000)?.includes('000')) {
    ok++;
  } else {
    fail++;
    console.log('  fail fval(1000)');
  }
  if (fperc(25.5) === '25.50%') {
    ok++;
  } else {
    fail++;
    console.log('  fail fperc(25.5)');
  }
  if (fmoney && fmoney(100, 'RUB')?.includes('100') && fmoney(100, 'RUB')?.includes('₽')) {
    ok++;
  } else {
    fail++;
    console.log('  fail fmoney(100, RUB)');
  }
  if (fshortval && fshortval(1500)?.includes('тыс')) {
    ok++;
  } else {
    fail++;
    console.log('  fail fshortval(1500)');
  }

  console.log(`\nnext_test: ${ok} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
  console.log('OK');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
