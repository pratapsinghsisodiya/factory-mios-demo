// Engineering examples for a synthetic automotive-components plant. Not live telemetry.
export const SITE = 'Pune · Automotive components · Plant 01';
export const AS_OF = '2026-10-22';
export const DAY = '2026-10-21';
export const round = (n: number, places = 2) => Number(n.toFixed(places));
export const dayDiff = (a: string, b: string) => Math.round((Date.parse(a + 'T00:00:00Z') - Date.parse(b + 'T00:00:00Z')) / 86400000);
export const num = (n: number, places = 1) => n.toLocaleString('en-IN', { maximumFractionDigits: places });
export function energy(day = DAY, feeder = 'main', rate = 8.25) {
  const scale = day === DAY ? 1 : .93;
  const definitions = [
    { id: 'cnc', meter: 'EM-101', name: 'CNC machining MCC', share: .39, opening: 624580.2, pf: .96 },
    { id: 'assembly', meter: 'EM-102', name: 'Assembly & parts washer', share: .22, opening: 391280.4, pf: .95 },
    { id: 'compressors', meter: 'EM-201', name: 'Compressor house', share: .23, opening: 452002.8, pf: .88 },
    { id: 'pumps', meter: 'EM-202', name: 'Cooling-water pumps', share: .09, opening: 160220.1, pf: .92 },
    { id: 'services', meter: 'EM-301', name: 'Lighting & services', share: .05, opening: 88440.3, pf: .98 },
  ];
  const main = { id: 'main', meter: 'EM-001', name: 'Main incomer · LT panel', share: 1, opening: 2816540.7, pf: .935 };
  const selected = { ...(definitions.find(d => d.id === feeder) || main) };
  const intervals = Array.from({ length: 96 }, (_, i) => {
    const hour = i / 4;
    const shiftLoad = hour >= 6 && hour < 22 ? 365 : 134;
    const changeover = (hour >= 13.5 && hour < 14.25) ? -75 : 0;
    const simultaneousStart = i >= 38 && i <= 40 ? 175 : 0;
    const kw = round((shiftLoad + 27 * Math.sin(i * .42) + 12 * Math.cos(i * .77) + changeover + simultaneousStart) * scale * selected.share);
    const pf = round(selected.pf - (i >= 38 && i <= 40 ? .045 : 0) + Math.sin(i * .2) * .008, 3);
    return { time: `${String(Math.floor(hour)).padStart(2, '0')}:${String(i % 4 * 15).padStart(2, '0')}`, kw, kva: round(kw / pf), pf, kwh: kw / 4, limit: feeder === 'main' ? 550 : undefined };
  });
  const kwh = round(intervals.reduce((n, i) => n + i.kwh, 0));
  if (day !== DAY) selected.opening = round(selected.opening - kwh);
  const last = intervals[95], current = round(last.kw * 1000 / (Math.sqrt(3) * 415 * last.pf));
  const peak = intervals.reduce((a, b) => b.kva > a.kva ? b : a);
  const meters = definitions.map(d => {
    const consumption = round(kwh / selected.share * d.share);
    const opening = day === DAY ? d.opening : round(d.opening - consumption);
    return { ...d, opening, kwh: consumption, closing: round(opening + consumption), kw: round(last.kw / selected.share * d.share), voltage: 415 + (d.id === 'compressors' ? -3 : 0), frequency: 49.98, status: d.pf < .9 ? 'Low power factor' : 'Normal' };
  });
  return { selected, intervals, meters, kwh, peak, current, last, closing: round(selected.opening + kwh),
    averagePf: round(intervals.reduce((n, i) => n + i.kw, 0) / intervals.reduce((n, i) => n + i.kva, 0), 3),
    kvar: round(Math.sqrt(last.kva ** 2 - last.kw ** 2)), cost: round(kwh * rate),
    unmetered: round(kwh / selected.share - meters.reduce((n, m) => n + m.kwh, 0)),
    hourly: Array.from({ length: 24 }, (_, h) => ({ time: String(h).padStart(2, '0') + ':00', kwh: round(intervals.slice(h * 4, h * 4 + 4).reduce((n, r) => n + r.kwh, 0)) })),
  };
}

export function water(day = DAY) {
  const scale = day === DAY ? 1 : .94;
  const intake = round(62 * scale), storageChange = 2;
  const consumers = [
    { id: 'FM-101', name: 'Cooling tower · fresh make-up', volume: round(6 * scale), flow: .25, pressure: 3.4, opening: 69240.0, source: 'Magnetic flowmeter · 4–20 mA' },
    { id: 'FM-102', name: 'Parts washer & rinse', volume: round(30 * scale), flow: 1.8, pressure: 2.9, opening: 32190.4, source: 'Magnetic flowmeter · RS-485' },
    { id: 'FM-103', name: 'Domestic & canteen', volume: round(12 * scale), flow: .3, pressure: 2.7, opening: 18820.2, source: 'Pulse totalizer · 1 L/pulse' },
    { id: 'FM-104', name: 'RO feed', volume: round(8 * scale), flow: .3, pressure: 3.2, opening: 12119.6, source: 'Magnetic flowmeter · RS-485' },
  ].map(m => ({ ...m, opening: day === DAY ? m.opening : round(m.opening - m.volume), closing: day === DAY ? round(m.opening + m.volume) : m.opening }));
  const residual = round(intake - consumers.reduce((n, r) => n + r.volume, 0) - storageChange);
  const raw = Array.from({ length: 24 }, (_, h) => h < 6 || h > 21 ? 2.6 + .3 * Math.sin(h) : 10.2 + 2.5 * Math.sin(h * .7));
  const total = raw.reduce((a, b) => a + b, 0);
  const hourly = raw.map((v, h) => ({ time: String(h).padStart(2, '0') + ':00', intake: v / total * intake, reuse: h >= 6 && h < 22 ? .375 : 0 }));
  return { intake, opening: day === DAY ? 124500 : round(124500 - intake), closing: day === DAY ? round(124500 + intake) : 124500, consumers, residual, storageChange, hourly, reuse: 6,
    tower: { fresh: consumers[0].volume, reuse: 6, blowdown: 3, drift: .15, evaporation: round(consumers[0].volume + 6 - 3.15), makeupConductivity: 650, basinConductivity: 2600 },
    tanks: [{ id: 'LT-001', name: 'Fresh-water storage', capacity: 100, opening: day === DAY ? 69 : 67, closing: day === DAY ? 71 : 69, level: day === DAY ? 2.84 : 2.76, height: 4 }, { id: 'LT-002', name: 'Treated-water reuse', capacity: 30, opening: 18, closing: 18, level: 1.8, height: 3 }],
  };
}

export const productionAssets = [
  { id: 'CNC-01', name: 'CNC-01 · Housing OP10', part: 'HSG-120 · Aluminium gearbox housing', order: 'WO-P-2048', ideal: 45, total: 480, good: 466, stops: [18, 12, 14, 10], reasons: ['Fixture changeover', 'Tool breakage', 'Material waiting', 'First-piece approval'], counter: 128700 },
  { id: 'CNC-02', name: 'CNC-02 · Housing OP20', part: 'HSG-120 · Finish bore operation', order: 'WO-P-2049', ideal: 52, total: 420, good: 412, stops: [16, 8, 12, 6], reasons: ['Fixture changeover', 'Coolant alarm', 'Material waiting', 'Tool offset correction'], counter: 98340 },
  { id: 'ASM-01', name: 'ASM-01 · Final assembly', part: 'ASM-220 · Gearbox subassembly', order: 'WO-P-2050', ideal: 30, total: 790, good: 774, stops: [12, 9, 10, 5], reasons: ['Model changeover', 'Torque tool reset', 'Component shortage', 'Sensor adjustment'], counter: 247100 },
];
export function oee(assetId = 'CNC-01', shift = 'A') {
  const asset = productionAssets.find(a => a.id === assetId) || productionAssets[0];
  const stops = asset.stops.map((v, i) => shift === 'B' ? Math.max(3, v - (i % 2 ? 2 : 1)) : v);
  const planned = 450, stop = stops.reduce((a, b) => a + b, 0), run = planned - stop;
  const total = asset.total + (shift === 'B' ? 8 : 0), good = asset.good + (shift === 'B' ? 9 : 0);
  const availability = run / planned, performance = asset.ideal * total / (run * 60), quality = good / total;
  const start = shift === 'A' ? 6 : 14;
  let running = 0, counted = 0, accepted = 0;
  const minutes = Array.from({length:480},(_,minute)=>{
    const pause = (minute>=120&&minute<135)||(minute>=240&&minute<255);
    const loss = [40,175,285,375].findIndex((s,i)=>minute>=s&&minute<s+stops[i]);
    if(!pause&&loss<0) running++;
    const cumulative=Math.floor(running*total/run+1e-8), cumulativeGood=Math.floor(cumulative*good/total+1e-8);
    const row={minute,pause,loss,count:cumulative-counted,good:cumulativeGood-accepted};
    counted=cumulative;accepted=cumulativeGood;return row;
  });
  const hourly=Array.from({length:8},(_,i)=>({time:String(start+i).padStart(2,'0')+':00',actual:minutes.slice(i*60,i*60+60).reduce((n,m)=>n+m.count,0),target:(i===2||i===4?45:60)*60/asset.ideal}));
  return { asset, counterOpening: asset.counter + (shift === 'B' ? asset.total : 0), planned, stop, run, total, good, rejected: total - good, availability, performance, quality, oee: availability * performance * quality, hourly, minutes,
    losses: asset.reasons.map((reason, i) => ({ reason, minutes: stops[i], source: i === 1 ? 'PLC stop + HMI reason' : 'Operator reason code' })),
    timeLosses: [{ name: 'Scheduled breaks', minutes: 30, color: '#a9b3c0' }, { name: 'Stop losses', minutes: stop, color: '#bc5e45' }, { name: 'Speed losses', minutes: round(run - total * asset.ideal / 60), color: '#cc993d' }, { name: 'Quality losses', minutes: round((total - good) * asset.ideal / 60), color: '#9366a1' }, { name: 'Fully productive', minutes: round(good * asset.ideal / 60), color: '#2d7c68' }],
  };
}

export type Condition = { h: number; v: number; a: number; temp: number; nde: number; amps: number; rpm: number; load: number };
export const motors = [
  { id: 'MTR-CP01', name: 'Compressor 01 drive motor', equipment: 'CP-01 · Screw compressor', location: 'Utilities / compressor house', kw: 75, ratedRpm: 2970, sensor: 'VIB-CP01', tempSensor: 'RTD-CP01', mount: 'Drive-end bearing housing · stud mounted', gateway: 'GW-UTIL-01', bearing: '6312/C3', warning: 2.8, alarm: 4.5, tempLimit: 75, interval: 30, current: { h: 2.2, v: 1.8, a: 1.3, temp: 58, nde: 53, amps: 101, rpm: 2965, load: 82 } },
  { id: 'MTR-P201', name: 'Cooling-water pump 02 motor', equipment: 'P-201 · Cooling-water circulation', location: 'Utilities / cooling tower', kw: 22, ratedRpm: 1480, sensor: 'VIB-P201', tempSensor: 'RTD-P201', mount: 'Drive-end bearing housing · stud mounted', gateway: 'GW-UTIL-01', bearing: '6310/C3', warning: 2.8, alarm: 4.5, tempLimit: 75, interval: 30, current: { h: 5.6, v: 4.8, a: 3.1, temp: 72, nde: 64, amps: 38.2, rpm: 1478, load: 78 } },
  { id: 'MTR-CV03', name: 'Assembly conveyor 03 motor', equipment: 'CV-03 · Gearbox assembly conveyor', location: 'Assembly / line 01', kw: 5.5, ratedRpm: 1440, sensor: 'VIB-CV03', tempSensor: 'RTD-CV03', mount: 'Drive-end bearing housing · bonded sensor pad', gateway: 'GW-ASSY-01', bearing: '6206/C3', warning: 2.8, alarm: 4.5, tempLimit: 70, interval: 30, current: { h: 2.0, v: 1.6, a: 1.2, temp: 46, nde: 42, amps: 8.8, rpm: 1438, load: 65 } },
];
export type WorkOrder = { id: string; asset: string; task: string; type: string; due: string; status: string; completed?: string };
export type ServiceRecord = { id: string; asset: string; workOrder: string; due: string; performed: string; nextDue: string; technician: string; work: string; spares: string; downtime: number; before: Condition; after: Condition };
export type Stock = { id: string; sku: string; name: string; batch: string; bin: string; onHand: number; reserved: number; hold: number; reorder: number; received: string };
export type Movement = { id: string; time: string; kind: string; sku: string; batch: string; from: string; to: string; quantity: number; reference: string };
export const bins = ['RM-A01', 'RM-A02', 'WIP-B01', 'WIP-B02', 'FG-C01', 'FG-C02', 'MRO-D01', 'QC-HOLD'];
export const readers = [
  { id: 'RDR-IN01', name: 'Receiving gate', antenna: 'ANT-IN-A1', zone: 'Receiving', trigger: 'PE-IN01', gateway: 'EDGE-01', rssi: -47 },
  { id: 'RDR-ST01', name: 'Stores entry', antenna: 'ANT-ST-A1', zone: 'RM-A01', trigger: 'PE-ST01', gateway: 'EDGE-01', rssi: -51 },
  { id: 'RDR-CNC01', name: 'Machining cell entry', antenna: 'ANT-CNC-A2', zone: 'CNC cell', trigger: 'PE-CNC01', gateway: 'EDGE-02', rssi: -54 },
  { id: 'RDR-QA01', name: 'Quality release gate', antenna: 'ANT-QA-A1', zone: 'QA released', trigger: 'PE-QA01', gateway: 'EDGE-02', rssi: -49 },
  { id: 'RDR-FG01', name: 'Finished-goods entry', antenna: 'ANT-FG-A1', zone: 'FG-C01', trigger: 'PE-FG01', gateway: 'EDGE-03', rssi: -50 },
  { id: 'RDR-OUT01', name: 'Dispatch gate', antenna: 'ANT-OUT-A2', zone: 'Dispatched', trigger: 'PE-OUT01', gateway: 'EDGE-03', rssi: -53 },
];
export const pallets = [
  { id: 'PLT-0241', epc: '3034257BF7194E4000000241', batch: 'LOT-H120-1021', sku: 'HSG-120', quantity: 120, order: 'SO-5041', quality: 'Released' },
  { id: 'PLT-0242', epc: '3034257BF7194E4000000242', batch: 'LOT-H120-1022', sku: 'HSG-120', quantity: 96, order: 'SO-5042', quality: 'Inspection pending' },
  { id: 'PLT-0301', epc: '3034257BF7194E4000000301', batch: 'LOT-ASM-1021', sku: 'ASM-220', quantity: 80, order: 'SO-5043', quality: 'Released' },
];
export type ReadEvent = { id: string; pallet: string; reader: string; time: string; rssi: number; status: 'Accepted' | 'Duplicate ignored' | 'Route exception' | 'Quality hold'; detail: string };
export type IndustrialState = { version: 2; orders: WorkOrder[]; services: ServiceRecord[]; stock: Stock[]; movements: Movement[]; reads: ReadEvent[] };

export function createIndustrialState(): IndustrialState {
  return { version: 2,
    orders: [
      { id: 'PM-1048', asset: 'MTR-CP01', task: 'Bearing inspection, alignment and lubrication', type: 'Preventive', due: '2026-10-20', status: 'Completed', completed: '2026-10-21' },
      { id: 'PM-1031', asset: 'MTR-CV03', task: 'Inspect coupling, gearbox and motor bearings', type: 'Preventive', due: '2026-09-24', status: 'Completed', completed: '2026-09-24' },
      { id: 'PM-1020', asset: 'MTR-P201', task: 'Pump coupling alignment and bearing inspection', type: 'Preventive', due: '2026-09-19', status: 'Completed', completed: '2026-09-19' },
      { id: 'PM-1052', asset: 'MTR-P201', task: 'Inspect rising DE vibration; check alignment and fasteners', type: 'Condition / PM', due: '2026-10-19', status: 'Open' },
      { id: 'PM-1058', asset: 'MTR-CV03', task: 'Monthly motor and gearbox inspection', type: 'Preventive', due: '2026-10-24', status: 'Scheduled' },
      { id: 'PM-1070', asset: 'MTR-CP01', task: 'Next monthly compressor motor inspection', type: 'Preventive', due: '2026-11-20', status: 'Scheduled' },
    ],
    services: [
      { id: 'SR-021', asset: 'MTR-CP01', workOrder: 'PM-1048', due: '2026-10-20', performed: '2026-10-21', nextDue: '2026-11-20', technician: 'A. Patil · demo', work: 'Corrected soft foot, laser-aligned coupling and renewed DE bearing grease. Verified at steady operating load.', spares: 'NLGI-2 grease · 28 g; shim pack · 1 set', downtime: 95, before: { h: 6.4, v: 5.2, a: 3.8, temp: 78, nde: 65, amps: 110, rpm: 2965, load: 82 }, after: { h: 2.2, v: 1.8, a: 1.3, temp: 58, nde: 53, amps: 101, rpm: 2965, load: 82 } },
      { id: 'SR-019', asset: 'MTR-CV03', workOrder: 'PM-1031', due: '2026-09-24', performed: '2026-09-24', nextDue: '2026-10-24', technician: 'S. Rao · demo', work: 'Inspected motor bearing, coupling guard and gearbox oil; tightened mounting bolts.', spares: 'Gear oil top-up · 0.4 L', downtime: 35, before: { h: 2.9, v: 2.5, a: 1.8, temp: 54, nde: 48, amps: 9.2, rpm: 1438, load: 65 }, after: { h: 1.8, v: 1.5, a: 1.1, temp: 45, nde: 41, amps: 8.7, rpm: 1438, load: 65 } },
      { id: 'SR-018', asset: 'MTR-P201', workOrder: 'PM-1020', due: '2026-09-19', performed: '2026-09-19', nextDue: '2026-10-19', technician: 'A. Patil · demo', work: 'Aligned pump coupling and checked base bolts. Recorded verification after thermal stabilization.', spares: 'Coupling insert · 1', downtime: 65, before: { h: 4.8, v: 4.1, a: 2.9, temp: 69, nde: 59, amps: 39, rpm: 1478, load: 78 }, after: { h: 1.6, v: 1.4, a: 1.0, temp: 52, nde: 47, amps: 36.5, rpm: 1478, load: 78 } },
    ],
    stock: [
      { id: 's1', sku: 'AL-CAST-120', name: 'Aluminium housing casting · HSG-120', batch: 'LOT-AL-1018', bin: 'RM-A01', onHand: 1280, reserved: 600, hold: 80, reorder: 700, received: '2026-10-18' },
      { id: 's2', sku: 'HSG-120', name: 'Machined gearbox housing', batch: 'LOT-H120-1021', bin: 'FG-C01', onHand: 480, reserved: 240, hold: 0, reorder: 180, received: '2026-10-21' },
      { id: 's3', sku: 'HSG-120', name: 'Housing · QA inspection lot', batch: 'LOT-H120-1022', bin: 'QC-HOLD', onHand: 96, reserved: 0, hold: 96, reorder: 0, received: '2026-10-21' },
      { id: 's4', sku: 'ASM-220', name: 'Gearbox subassembly', batch: 'LOT-ASM-1021', bin: 'FG-C02', onHand: 320, reserved: 160, hold: 0, reorder: 120, received: '2026-10-21' },
      { id: 's5', sku: 'BRG-6312', name: 'Motor bearing · 6312/C3', batch: 'LOT-BRG-0901', bin: 'MRO-D01', onHand: 12, reserved: 4, hold: 0, reorder: 10, received: '2026-09-01' },
      { id: 's6', sku: 'SEAL-045', name: 'Shaft seal · 45 mm', batch: 'LOT-SL-0922', bin: 'MRO-D01', onHand: 56, reserved: 8, hold: 0, reorder: 24, received: '2026-09-22' },
    ],
    movements: [
      { id: 'mv1', time: '2026-10-22T08:05:00+05:30', kind: 'Receipt', sku: 'AL-CAST-120', batch: 'LOT-AL-1018', from: 'Supplier', to: 'RM-A01', quantity: 80, reference: 'GRN-1048 · inspection pending' },
      { id: 'mv2', time: '2026-10-22T08:20:00+05:30', kind: 'Issue', sku: 'HSG-120', batch: 'LOT-H120-1021', from: 'FG-C01', to: 'Dispatch', quantity: 120, reference: 'DN-2081' },
    ],
    reads: pallets.flatMap((p, n) => readers.slice(0, [5, 3, 4][n]).map((r, i) => ({ id: `read-${n}-${i}`, pallet: p.id, reader: r.id, time: `2026-10-22T${String(7 + Math.floor(i / 2)).padStart(2, '0')}:${String(5 + (i % 2) * 25 + n * 3).padStart(2, '0')}:00+05:30`, rssi: r.rssi - n, status: 'Accepted' as const, detail: 'Photocell trigger · EPC validated · route accepted' }))),
  };
}
export const available = (s: Stock) => s.onHand - s.reserved - s.hold;
export function stockMovement(state: IndustrialState, input: { stockId: string; kind: string; quantity: number; bin: string; reference: string }, id: string, time: string) {
  const s = state.stock.find(r => r.id === input.stockId);
  if (!s) throw new Error('Select a stock line.');
  const q = Number(input.quantity);
  if (!Number.isInteger(q) || q < 0 || (q === 0 && input.kind !== 'Count')) throw new Error('Enter a whole number of pieces.');
  if (!input.reference?.trim()) throw new Error('Enter a GRN, order, or count reference.');
  let from = s.bin, to = s.bin, delta = q;
  if (input.kind === 'Issue' || input.kind === 'Transfer') {
    if (q > available(s)) throw new Error(`Only ${available(s)} pcs are available; reserved and quality-held stock cannot be moved.`);
    if (input.kind === 'Transfer') {
      if (!bins.includes(input.bin) || input.bin === s.bin) throw new Error('Choose a different destination bin.');
      const target = state.stock.find(r => r.sku === s.sku && r.batch === s.batch && r.bin === input.bin);
      if (target) target.onHand += q;
      else state.stock.push({ ...s, id: id + '-stock', bin: input.bin, onHand: q, reserved: 0, hold: 0, reorder: 0 });
      to = input.bin;
    } else to = 'Production / dispatch';
    s.onHand -= q;
  } else if (input.kind === 'Receipt') { s.onHand += q; s.hold += q; from = 'Supplier · QC pending'; }
  else if (input.kind === 'Release') {
    if (q > s.hold) throw new Error('Release quantity exceeds quality-held stock.');
    s.hold -= q; from = 'QC hold'; to = s.bin + ' · released';
  } else if (input.kind === 'Count') {
    if (q < s.reserved + s.hold) throw new Error('Count is below allocated plus held stock; resolve those allocations first.');
    delta = q - s.onHand; s.onHand = q; from = 'Count adjustment';
  } else throw new Error('Unknown stock movement.');
  state.movements.unshift({ id, time, kind: input.kind, sku: s.sku, batch: s.batch, from, to, quantity: delta, reference: input.reference.trim() });
}
export function recordService(state: IndustrialState, entry: ServiceRecord) {
  const order = state.orders.find(o => o.id === entry.workOrder);
  if (!order || order.asset !== entry.asset || order.status === 'Completed') throw new Error('Select an open work order for this motor.');
  if (!entry.technician?.trim() || !entry.work?.trim()) throw new Error('Technician and work performed are required.');
  const validDate = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && Number.isFinite(Date.parse(d)) && new Date(d).toISOString().slice(0,10) === d;
  if (!validDate(entry.performed) || entry.performed > AS_OF) throw new Error('Completion date must be on or before the scenario date, 22 Oct 2026.');
  if (!validDate(entry.nextDue) || entry.nextDue <= entry.performed) throw new Error('Next service must be after completion.');
  if (!Number.isFinite(entry.downtime) || entry.downtime < 0 || entry.downtime > 1440) throw new Error('Enter valid downtime minutes.');
  for (const readings of [entry.before, entry.after]) for (const key of ['h', 'v', 'a', 'temp', 'nde', 'amps', 'rpm', 'load'] as const) {
    const value = readings[key]; const max = ['h', 'v', 'a'].includes(key) ? 50 : key === 'load' ? 100 : key === 'rpm' ? 6000 : 300;
    if (!Number.isFinite(value) || value < 0 || value > max) throw new Error(`Enter a valid ${key} reading.`);
  }
  entry.due = order.due;
  order.status = 'Completed'; order.completed = entry.performed;
  state.services.unshift(entry);
  state.orders.push({ id: entry.id + '-NEXT', asset: entry.asset, task: 'Next scheduled motor condition and mechanical inspection', type: 'Preventive', due: entry.nextDue, status: 'Scheduled' });
}
export function comparable(record: ServiceRecord) { return Math.abs(record.before.load - record.after.load) <= 5 && Math.abs(record.before.rpm - record.after.rpm) <= 50; }
export function lastLocation(state: IndustrialState, pallet: string) {
  const accepted = state.reads.filter(r => r.pallet === pallet && r.status === 'Accepted');
  const last = accepted[accepted.length - 1];
  return last ? readers.find(r => r.id === last.reader)!.zone : 'Not received';
}
export function scanPallet(state: IndustrialState, palletId: string, readerId: string, id: string, time: string): ReadEvent {
  const pallet = pallets.find(p => p.id === palletId), reader = readers.find(r => r.id === readerId);
  if (!pallet || !reader) throw new Error('Unknown pallet or reader.');
  const accepted = state.reads.filter(r => r.pallet === palletId && r.status === 'Accepted');
  const previous = accepted[accepted.length - 1];
  const portalReads = state.reads.filter(r => r.pallet === palletId && r.reader === readerId);
  const priorRead = portalReads[portalReads.length - 1];
  const index = readers.findIndex(r => r.id === readerId), previousIndex = previous ? readers.findIndex(r => r.id === previous.reader) : -1;
  let status: ReadEvent['status'] = 'Accepted', detail = 'Photocell trigger · EPC validated · route accepted';
  if (priorRead && Math.abs(Date.parse(time) - Date.parse(priorRead.time)) <= 5000) { status = 'Duplicate ignored'; detail = 'Same EPC and portal within the 5-second deduplication window'; }
  else if (index !== previousIndex + 1) { status = 'Route exception'; detail = 'Unexpected station; last confirmed location retained'; }
  else if (index >= 3 && state.stock.some(s => s.batch === pallet.batch && s.hold > 0)) { status = 'Quality hold'; detail = 'QA disposition pending in warehouse stock; movement event not released'; }
  const event = { id, pallet: palletId, reader: readerId, time, rssi: reader.rssi, status, detail };
  state.reads.push(event); return event;
}
