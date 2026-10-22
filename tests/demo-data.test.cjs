const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const filename = path.resolve(__dirname, '../lib/demo-data.ts');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const loaded = new Module(filename, module);
loaded._compile(compiled, filename);
const { createState, summarize, addOperation, changeStatus, reportCsv, csvCell } = loaded.exports;
test('plant filters and time windows change sample totals coherently', () => {
  const state = createState(), all = summarize(state), plant = summarize(state, 24, 'precision');
  assert.equal(all.machines.length, 9); assert.equal(plant.machines.length, 3);
  assert(plant.machines.every(m => m.plant_id === 'precision'));
  assert(plant.operations.every(r => r.plant_id === 'precision'));
  assert.equal(all.metrics.good + all.metrics.rejects, all.metrics.production);
  assert(Math.abs(all.metrics.energy - summarize(state, 8).metrics.energy * 3) < .001);
  assert(summarize(state, 168).metrics.production > all.metrics.production);
  assert.equal(summarize(state, 24, 'unknown').machines.length, 0);
});
test('maintenance lifecycle updates counters and rejects invalid records', () => {
  const state = createState(), before = summarize(state).metrics.work_orders;
  addOperation(state, { kind: 'maintenance', title: 'Sample inspection', priority: 'high', plant_id: 'assembly' }, 'new');
  assert.equal(summarize(state).metrics.work_orders, before + 1);
  assert(summarize(state, 24, 'assembly').operations.some(r => r.id === 'new'));
  changeStatus(state, 'new', 'in_progress'); changeStatus(state, 'new', 'closed');
  assert.equal(summarize(state).metrics.work_orders, before);
  assert.throws(() => changeStatus(state, 'new', 'bogus'));
  assert.throws(() => addOperation(state, { kind: 'inventory', title: 'Stock', priority: 'low', details: {quantity: -1} }, 'bad'));
});
test('reset is independent and exports clearly identify synthetic data', () => {
  const edited = createState(); edited.tick = 9; edited.operations[0].title = '=bad';
  assert.equal(createState().tick, 0); assert.notEqual(createState().operations[0].title, '=bad');
  const csv = reportCsv(createState(), 'oee', 8, 'precision');
  assert(csv.includes('Synthetic demonstration data only')); assert(csv.includes('CNC Alpha')); assert(!csv.includes('Packaging 02'));
  assert.equal(csvCell('=1+1'), '"\'=1+1"'); assert.equal(csvCell('a"b'), '"a""b"');
});
