"use client";
import { useEffect, useState } from 'react';
import { createIndustrialState, IndustrialState } from './industrial';
export const INDUSTRIAL_KEY = 'factory-mios-industrial-v2';
export function useIndustrialState() {
  const [state, setState] = useState<IndustrialState>(createIndustrialState);
  const [storageNotice, setStorageNotice] = useState('');
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(INDUSTRIAL_KEY) || 'null');
      if (saved?.version === 2 && ['orders','services','stock','movements','reads'].every(k => Array.isArray(saved[k]))) setState(saved);
    } catch { setStorageNotice('Browser storage is unavailable. Changes will last for this page session.'); }
  }, []);
  function update(change: (draft: IndustrialState) => void) {
    const next = structuredClone(state);
    change(next);
    setState(next);
    try { localStorage.setItem(INDUSTRIAL_KEY, JSON.stringify(next)); }
    catch { setStorageNotice('This browser could not save the change. Keep this page open or export your records.'); }
  }
  return { state, update, storageNotice };
}
export function resetIndustrialDemo() { localStorage.removeItem(INDUSTRIAL_KEY); }
export function exportCsv(name: string, rows: unknown[][]) {
  const cell = (value: unknown) => { let t = String(value ?? ''); if (/^[=+\-@\t\r]/.test(t)) t = "'" + t; return '"' + t.replace(/"/g, '""') + '"'; };
  const csv = [['Factory-MIOS · synthetic industrial scenario'], ...rows].map(r => r.map(cell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = name + '.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
