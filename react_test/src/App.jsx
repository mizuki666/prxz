import { useState, useMemo } from 'react';
import './App.css';

const prxz = typeof window !== 'undefined' ? window.prxz : null;
const frm = prxz?.frm ?? {};
const v = frm.v ?? {};
const d = frm.d ?? {};

function SandboxBlock({ title, children }) {
  return (
    <section className="block">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function usePrxz() {
  const [value, setValue] = useState('1234567.89');
  const [decimals, setDecimals] = useState(2);
  const [currency, setCurrency] = useState('RUB');
  const result = useMemo(() => {
    if (!v.fval) return { fval: '—', fperc: '—', fmoney: '—', fshortval: '—' };
    const num = value.trim() === '' ? NaN : Number(value);
    return {
      fval: v.fval(value, decimals, true),
      fperc: v.fperc(value, decimals),
      fmoney: v.fmoney(value, currency, decimals),
      fshortval: v.fshortval(value, decimals),
    };
  }, [value, decimals, currency]);
  return { value, setValue, decimals, setDecimals, currency, setCurrency, result };
}

function App() {
  const { value, setValue, decimals, setDecimals, currency, setCurrency, result } = usePrxz();
  const [dateStr, setDateStr] = useState('2024-12-25T14:30:00');
  const [dateFormat, setDateFormat] = useState('dd.mm.yyyy HH:MM');
  const dateResult = useMemo(() => {
    if (!d.fdate) return '—';
    return d.fdate(dateStr, dateFormat);
  }, [dateStr, dateFormat]);

  if (!prxz) {
    return (
      <div className="app">
        <header className="header">
          <h1>prxz — песочница</h1>
        </header>
        <p className="error">Не удалось загрузить prxz.min.js. Соберите бандл в корне: npm run build</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <h1>prxz — песочница</h1>
        <p className="sub">Тестирование prxz.min.js (frm.v, frm.d)</p>
      </header>

      <div className="sandbox">
        <SandboxBlock title="Ввод">
          <div className="row">
            <label>
              Значение
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Число или строка"
              />
            </label>
          </div>
          <div className="row inline">
            <label>
              Знаков после запятой
              <input
                type="number"
                min={0}
                max={10}
                value={decimals}
                onChange={(e) => setDecimals(Number(e.target.value) || 0)}
              />
            </label>
            <label>
              Валюта (fmoney)
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {['RUB', 'USD', 'EUR', 'GBP', 'JPY'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
        </SandboxBlock>

        <SandboxBlock title="fval(value, decimals, localize)">
          <output className="result">{result.fval}</output>
        </SandboxBlock>

        <SandboxBlock title="fperc(value, decimals)">
          <output className="result">{result.fperc}</output>
        </SandboxBlock>

        <SandboxBlock title="fmoney(value, currency, decimals)">
          <output className="result">{result.fmoney}</output>
        </SandboxBlock>

        <SandboxBlock title="fshortval(value, decimals)">
          <output className="result">{result.fshortval}</output>
        </SandboxBlock>

        <SandboxBlock title="fdate(value, format)">
          <div className="row">
            <label>
              Дата/строка
              <input
                type="text"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                placeholder="2024-12-25T14:30:00"
              />
            </label>
          </div>
          <div className="row">
            <label>
              Формат
              <input
                type="text"
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                placeholder="dd.mm.yyyy HH:MM"
              />
            </label>
          </div>
          <output className="result">{dateResult}</output>
        </SandboxBlock>
      </div>
    </div>
  );
}

export default App;
