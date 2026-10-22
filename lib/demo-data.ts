export const modules = ['overview', 'oee', 'cnc', 'realtime', 'quality', 'downtime', 'ems', 'water', 'utilities', 'inventory', 'maintenance', 'safety', 'traceability', 'executive'];
export const plants = [
  { id: 'precision', name: 'Precision Works' },
  { id: 'assembly', name: 'Assembly Hub' },
  { id: 'utilities', name: 'Utilities Centre' },
];
const names = ['CNC Alpha', 'CNC Bravo', 'Robotic assembly', 'Press 01', 'Laser cutter', 'Packaging 02', 'Compressor', 'Water treatment', 'Cold storage'];
export type Operation = { id: string; kind: string; title: string; priority: string; status: string; created_at: string; plant_id: string; details: { quantity?: number } };
export type Downtime = { id: string; device_id: string; reason: string; category: string; start_time: string; end_time: string | null; duration_min: number | null; status: string; operator?: string; remarks?: string };
export type DemoState = { version: 1; tick: number; updated_at: string; operations: Operation[]; downtime: Downtime[] };
export function createState(now = new Date()): DemoState {
  const time = now.toISOString();
  const rows: [string, string, string, number, number?][] = [
    ['maintenance', 'Inspect CNC Bravo spindle bearing', 'high', 0],
    ['maintenance', 'Replace packaging conveyor belt', 'medium', 1],
    ['inventory', 'Aluminium billets · A6061', 'medium', 0, 2400],
    ['inventory', 'Finished assembly kits', 'low', 1, 1280],
    ['safety', 'Review compressor pressure alarm', 'high', 2],
    ['traceability', 'Batch FM-2048 · precision housings', 'medium', 0],
    ['traceability', 'Batch FM-2049 · assembly kits', 'low', 1],
    ['alerts', 'CNC Bravo vibration above sample threshold', 'high', 0],
    ['alerts', 'Compressor demand above sample target', 'medium', 2],
  ];
  return { version: 1, tick: 0, updated_at: time,
    operations: rows.map(([kind, title, priority, p, quantity], i) => ({ id: `record-${i}`, kind, title, priority, status: i === 1 ? 'in_progress' : 'open', created_at: time, plant_id: plants[p].id, details: quantity === undefined ? {} : { quantity } })),
    downtime: ['Tool change', 'Material shortage', 'Planned service', 'Sensor adjustment'].map((reason, i) => ({ id: `stop-${i}`, device_id: `machine-${i}`, reason, category: i === 2 ? 'planned' : 'unplanned', duration_min: [38, 24, 18, 12][i], status: 'closed', start_time: new Date(now.getTime() - (i + 1) * 3600000).toISOString(), end_time: time })),
  };
}
const round = (n: number, places = 2) => Number(n.toFixed(places));
export function summarize(state: DemoState, hours = 24, plantId = '', now = new Date()) {
  hours = Math.min(168, Math.max(1, Number(hours) || 24));
  const machines = names.map((name, i) => {
    const plant = plants[Math.floor(i / 3)];
    const availability = round(91 - i * 1.1 + Math.sin(state.tick + i) * 2);
    const performance = round(93 - i * .6);
    const quality = round(98.7 - i * .12);
    const production = i < 6 ? Math.round((1800 + i * 146 + state.tick * 25) * hours / 24) : 0;
    return { id: `machine-${i}`, name, plant: plant.name, plant_id: plant.id, status: i === 1 ? 'attention' : i === 5 ? 'idle' : 'running', production, availability, performance, quality, good: Math.round(production * quality / 100), oee: round(availability * performance * quality / 10000), power: round(8.4 + i * 2.2 + Math.sin(state.tick + i) * .4), rpm: i < 3 ? 3200 + i * 450 : 0, temperature: round(37 + i * 2.3), vibration: round(.9 + i * .13), cycle: round(18.4 + i * .5), pressure: round(6.1 + i * .08), energy: round((8.4 + i * 2.2) * hours), water: round((i === 7 ? 3.7 : .13) * hours) };
  }).filter(m => !plantId || m.plant_id === plantId);
  const sum = (key: string) => round(machines.reduce((n, m) => n + Number((m as any)[key] || 0), 0));
  const avg = (key: string) => machines.length ? round(sum(key) / machines.length) : 0;
  const operations = state.operations.filter(r => !plantId || r.plant_id === plantId);
  const logs = state.downtime.filter(r => machines.some(m => m.id === r.device_id));
  const production = sum('production'), good = sum('good');
  const availability = avg('availability'), performance = avg('performance');
  const quality = production ? round(good / production * 100) : avg('quality');
  const metrics = { machines: machines.length, online: machines.length, availability, performance, quality, oee: round(availability * performance * quality / 10000), production, good, rejects: production - good, reject_rate: round(100 - quality), energy: sum('energy'), power: sum('power'), energy_per_part: production ? round(sum('energy') / production, 3) : 0, water: sum('water'), downtime: logs.reduce((n, l) => n + (l.duration_min ?? 0), 0), work_orders: operations.filter(r => r.kind === 'maintenance' && r.status !== 'closed').length, incidents: operations.filter(r => r.kind === 'safety' && r.status !== 'closed').length, inventory: operations.filter(r => r.kind === 'inventory').reduce((n, r) => n + (r.details.quantity || 0), 0), batches: operations.filter(r => r.kind === 'traceability').length };
  return { tenant: { name: 'Factory AI Demo Works', is_demo: true, modules }, plants, machines, operations, metrics, has_data: true, hours, updated_at: state.updated_at,
    trend: Array.from({ length: 24 }, (_, i) => ({ time: new Date(now.getTime() - (23 - i) * hours / 24 * 3600000).toISOString(), availability: round(availability + Math.sin(i * .65 + state.tick) * 4), power: round(avg('power') + Math.sin(i * .8 + state.tick) * 1.8), cycle: round(19.5 + Math.sin(i * .5) * 1.6), water: round(metrics.water / hours * (1 + Math.sin(i * .4) * .1)), pressure: round(6.5 + Math.sin(i * .6) * .3) })),
    losses: pareto(logs).map(r => ({ name: r.reason, minutes: r.total_minutes })),
  };
}
export function pareto(logs: Downtime[]) {
  const groups = new Map<string, { reason: string; total_minutes: number; occurrences: number }>();
  for (const log of logs) {
    const row = groups.get(log.reason) || { reason: log.reason, total_minutes: 0, occurrences: 0 };
    row.total_minutes += log.duration_min || 0; row.occurrences++; groups.set(log.reason, row);
  }
  return [...groups.values()].sort((a, b) => b.total_minutes - a.total_minutes);
}
export function addOperation(state: DemoState, body: any, id: string, now = new Date()) {
  if (!['maintenance', 'inventory', 'safety', 'traceability'].includes(body.kind)) throw new Error('Choose a supported demo register.');
  if (typeof body.title !== 'string' || body.title.trim().length < 2 || body.title.length > 200) throw new Error('Enter a title between 2 and 200 characters.');
  if (!['low', 'medium', 'high'].includes(body.priority)) throw new Error('Choose a valid priority.');
  const quantity = Number(body.details?.quantity || 0);
  if (!Number.isFinite(quantity) || quantity < 0) throw new Error('Quantity must be a non-negative number.');
  if (body.plant_id && !plants.some(p => p.id === body.plant_id)) throw new Error('Choose a valid plant.');
  const record: Operation = { id, kind: body.kind, title: body.title.trim(), priority: body.priority, status: 'open', created_at: now.toISOString(), plant_id: body.plant_id || 'precision', details: { quantity } };
  state.operations.unshift(record); return record;
}
export function changeStatus(state: DemoState, id: string, status: string) {
  if (!['open', 'in_progress', 'closed'].includes(status)) throw new Error('Invalid status.');
  const record = state.operations.find(r => r.id === id);
  if (!record) throw new Error('This demo record no longer exists.');
  record.status = status; return record;
}
export function csvCell(value: unknown) {
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
export function reportCsv(state: DemoState, type: string, hours = 24, plantId = '') {
  const data = summarize(state, hours, plantId);
  const rows: unknown[][] = [['Factory-MIOS sample-data demo', type], ['Data', 'Synthetic demonstration data only'], ['Window (hours)', hours], [], ['Metric', 'Value'], ...Object.entries(data.metrics), [], ['Machine', 'Plant', 'Status', 'Output (parts)', 'OEE (%)', 'Power (kW)'], ...data.machines.map(m => [m.name, m.plant, m.status, m.production, m.oee, m.power])];
  return rows.map(row => row.map(csvCell).join(',')).join('\r\n');
}
