import { addOperation, changeStatus, createState, DemoState, pareto, reportCsv, summarize } from './demo-data';
export const BASE = '/factory-mios-demo';
const KEY = 'factory-mios-public-demo-v1';
let memory: DemoState | undefined;
export function demoUrl(path: string) { return `${BASE}${path}`; }
// Public demo entry is navigation, not authentication.
export function getToken() { return 'public-sample-demo'; }
export function clearToken() {}
function read(): DemoState {
  if (memory) return memory;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (parsed?.version === 1 && Number.isFinite(parsed.tick) && Array.isArray(parsed.operations) && Array.isArray(parsed.downtime)) return memory = parsed;
  } catch {}
  return memory = createState();
}
function write(state: DemoState) {
  memory = state;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* In-memory demo still works when storage is unavailable. */ }
}
export function resetDemo() { write(createState()); }
export async function req(path: string, opts: RequestInit = {}, _auth = true): Promise<any> {
  const url = new URL(path, 'https://demo.invalid');
  const route = url.pathname, method = opts.method || 'GET', state = read();
  const body = typeof opts.body === 'string' ? JSON.parse(opts.body) : {};
  if (route === '/workspace/summary') return summarize(state, Number(url.searchParams.get('hours') || 24), url.searchParams.get('plant_id') || '');
  if (route === '/workspace/demo-tick' && method === 'POST') { state.tick++; state.updated_at = new Date().toISOString(); write(state); return { ok: true }; }
  if (route === '/workspace/operations' && method === 'POST') { const result = addOperation(state, body, crypto.randomUUID()); write(state); return result; }
  if (route.startsWith('/workspace/operations/') && method === 'PATCH') { const result = changeStatus(state, route.split('/').pop()!, url.searchParams.get('status') || ''); write(state); return result; }
  throw new Error('This action is available in the full application. This link demonstrates sample data only.');
}
export const api = {
  devices: async () => summarize(read()).machines,
  downtimeLogs: async (_days = 7) => read().downtime,
  downtimePareto: async (_days = 7) => pareto(read().downtime),
  masterData: async (_dataset?: string) => ['Tool change', 'Material shortage', 'Planned service', 'Sensor adjustment', 'Other'].map((key, i) => ({ id: i, key })),
  createDowntime: async (body: any) => {
    if (!body.reason) throw new Error('Select a reason.');
    const state = read();
    if (!summarize(state).machines.some(m => m.id === body.device_id)) throw new Error('Select a machine.');
    const now = new Date().toISOString();
    const result = { ...body, id: crypto.randomUUID(), start_time: now, end_time: body.end_time || null, duration_min: body.end_time ? 0 : null, status: body.end_time ? 'closed' : 'open' };
    state.downtime.unshift(result); write(state); return result;
  },
  closeDowntime: async (id: string) => {
    const state = read(), row = state.downtime.find(r => r.id === id);
    if (!row) throw new Error('Demo event not found.');
    row.end_time = new Date().toISOString(); row.duration_min = Math.round((Date.now() - Date.parse(row.start_time)) / 60000); row.status = 'closed'; write(state);
  },
  factobot: async (question: string) => {
    const data = summarize(read()), m = data.metrics, q = question.toLowerCase();
    let reply = 'Try asking about OEE, energy, downtime, quality, production, or maintenance. This demo assistant uses preset rules over the sample data.';
    if (/oee|effectiveness/.test(q)) reply = `Sample OEE is ${m.oee}%. Availability: ${m.availability}%, performance: ${m.performance}%, quality: ${m.quality}%.`;
    else if (/energy|power/.test(q)) reply = `Sample energy use is ${m.energy.toLocaleString()} kWh over 24 hours. Current demand is ${m.power} kW; energy per part is ${m.energy_per_part} kWh.`;
    else if (/downtime|loss/.test(q)) reply = `Sample production losses: ${data.losses.map(l => `${l.name}: ${l.minutes} minutes`).join('; ')}.`;
    else if (/quality|reject/.test(q)) reply = `Sample quality yield is ${m.quality}%, with ${m.good.toLocaleString()} accepted parts and ${m.rejects} rejected parts.`;
    else if (/production|output/.test(q)) reply = `Sample production output: ${m.production.toLocaleString()} parts across three plants over the last 24 hours.`;
    else if (/maintenance|work order/.test(q)) reply = `There are ${m.work_orders} open sample maintenance work orders. Visit Maintenance to start or complete one.`;
    return { reply: reply + '\n\nSynthetic demo data · changes stay in this browser.' };
  },
  downloadReport: async (type: string, windowMinutes = 1440, plantId = '') => {
    const blob = new Blob(['\uFEFF', reportCsv(read(), type, windowMinutes / 60, plantId)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = `factory-mios-demo-${type}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
