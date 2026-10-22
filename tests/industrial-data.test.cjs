const assert=require('node:assert/strict');
const {test}=require('node:test');
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript');
const filename=path.resolve(__dirname,'../lib/industrial.ts');
const compiled=ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const loaded=new Module(filename,module);loaded._compile(compiled,filename);
const {energy,water,oee,productionAssets,createIndustrialState,stockMovement,available,recordService,comparable,scanPallet,lastLocation}=loaded.exports;
const close=(a,b,t=.011)=>assert(Math.abs(a-b)<t,`${a} differs from ${b}`);
test('energy reconciles intervals, meter registers and downstream allocation',()=>{
 for(const day of ['2026-10-20','2026-10-21'])for(const feeder of ['main','cnc','compressors']){
 const d=energy(day,feeder);assert.equal(d.intervals.length,96);close(d.intervals.reduce((n,r)=>n+r.kw/4,0),d.kwh);close(d.closing-d.selected.opening,d.kwh);close(d.meters.reduce((n,m)=>n+m.kwh,0)+d.unmetered,d.kwh/d.selected.share,.07);close(d.hourly.reduce((n,r)=>n+r.kwh,0),d.kwh,.05);
 for(const m of d.meters)close(m.closing-m.opening,m.kwh);
 close(d.averagePf,d.intervals.reduce((n,r)=>n+r.kw,0)/d.intervals.reduce((n,r)=>n+r.kva,0),.001);
 }close(energy('2026-10-20').closing,energy().selected.opening);
});
test('water balance accounts for storage and excludes internal reuse from fresh intake',()=>{
 for(const day of ['2026-10-20','2026-10-21']){const d=water(day);close(d.intake,d.consumers.reduce((n,m)=>n+m.volume,0)+d.storageChange+d.residual);close(d.hourly.reduce((n,r)=>n+r.intake,0),d.intake);close(d.hourly.reduce((n,r)=>n+r.reuse,0),d.reuse);close(d.tower.fresh+d.tower.reuse,d.tower.evaporation+d.tower.blowdown+d.tower.drift);for(const m of d.consumers)close(m.closing-m.opening,m.volume);close(d.tanks[0].closing-d.tanks[0].opening,d.storageChange);}
 close(water().residual,4);close(water('2026-10-20').closing,water().opening);close(water('2026-10-20').tanks[0].closing,water().tanks[0].opening);
});
test('each production asset and shift reconciles counts, losses and OEE',()=>{
 for(const a of productionAssets)for(const shift of ['A','B']){const d=oee(a.id,shift);close(d.oee,d.good*a.ideal/(d.planned*60),1e-9);close(d.timeLosses.reduce((n,r)=>n+r.minutes,0),480);assert.equal(d.hourly.reduce((n,r)=>n+r.actual,0),d.total);assert.equal(d.total,d.good+d.rejected);assert.equal(d.run+d.stop,450);assert(d.performance<=1);assert(d.oee>0&&d.oee<1);}
 close(oee().oee*100,77.66666667,.00001);
 assert.equal(oee('CNC-01','B').counterOpening,oee().counterOpening+oee().total);
});
const post=(s,input)=>stockMovement(s,{stockId:'s1',kind:'Issue',quantity:10,bin:'WIP-B01',reference:'TEST-01',...input},'mv-test','2026-10-22T10:00:00+05:30');
test('stock issues protect reservations and holds; receipts require QA release',()=>{
 const s=createIndustrialState(),line=s.stock[0];assert.equal(available(line),600);assert.throws(()=>post(s,{quantity:601}),/available/);assert.equal(line.onHand,1280);assert.throws(()=>post(s,{quantity:1.5}),/whole/);assert.throws(()=>post(s,{quantity:-1}),/whole/);
 post(s,{kind:'Receipt',quantity:20});assert.equal(line.onHand,1300);assert.equal(line.hold,100);assert.equal(available(line),600);post(s,{kind:'Release',quantity:100});assert.equal(line.hold,0);post(s,{quantity:700});assert.equal(line.onHand,600);assert.equal(available(line),0);
});
test('transfers conserve physical stock and reject an invalid destination before mutation',()=>{
 const s=createIndustrialState(),sum=()=>s.stock.reduce((n,r)=>n+r.onHand,0),before=sum();assert.throws(()=>post(s,{kind:'Transfer',bin:'RM-A01'}),/different/);assert.equal(sum(),before);post(s,{kind:'Transfer',quantity:80});assert.equal(sum(),before);assert.equal(s.stock.find(r=>r.bin==='WIP-B01').onHand,80);assert.equal(s.stock[0].onHand,1200);
});
test('cycle counts record a delta and preserve allocated pieces',()=>{const s=createIndustrialState();assert.throws(()=>post(s,{kind:'Count',quantity:679}),/allocations/);post(s,{kind:'Count',quantity:1270});assert.equal(s.movements[0].quantity,-10);assert.equal(s.stock[0].onHand,1270);});
const service=s=>({...structuredClone(s.services[2]),id:'SR-NEW',workOrder:'PM-1052',performed:'2026-10-22',nextDue:'2026-11-21',technician:'Demo technician',work:'Alignment and inspection'});
test('maintenance completion closes its order and creates the next inspection',()=>{const s=createIndustrialState(),r=service(s);recordService(s,r);const order=s.orders.find(o=>o.id==='PM-1052');assert.equal(order.status,'Completed');assert.equal(order.completed,'2026-10-22');assert.equal(s.services[0].due,'2026-10-19');assert.equal(s.orders.at(-1).due,'2026-11-21');assert.throws(()=>recordService(s,r),/open work order/);});
test('maintenance rejects invalid dates, future completion and implausible readings',()=>{const s=createIndustrialState();for(const performed of ['2026-02-31','2026-10-23','invalid'])assert.throws(()=>recordService(s,{...service(s),performed}),/Completion/);assert.throws(()=>recordService(s,{...service(s),nextDue:'2026-10-20'}),/after completion/);const r=service(s);r.after.load=110;assert.throws(()=>recordService(s,r),/load/);assert.equal(s.orders.find(o=>o.id==='PM-1052').status,'Open');});
test('service comparisons flag a changed speed or load',()=>{const s=createIndustrialState(),r=service(s);assert(comparable(r));r.after.load-=20;assert(!comparable(r));r.after.load=r.before.load;r.after.rpm+=100;assert(!comparable(r));});
test('RFID duplicates and wrong gates never change accepted location',()=>{const s=createIndustrialState(),p='PLT-0241',before=lastLocation(s,p),previous=s.reads.filter(r=>r.pallet===p&&r.status==='Accepted').at(-1);assert.equal(scanPallet(s,p,previous.reader,'dup',new Date(Date.parse(previous.time)+2000).toISOString()).status,'Duplicate ignored');assert.equal(lastLocation(s,p),before);assert.equal(scanPallet(s,p,'RDR-IN01','wrong','2026-10-22T10:00:00+05:30').status,'Route exception');assert.equal(lastLocation(s,p),before);assert.equal(scanPallet(s,p,'RDR-OUT01','next','2026-10-22T10:01:00+05:30').status,'Accepted');assert.equal(lastLocation(s,p),'Dispatched');});
test('QA-held RFID reads deduplicate; warehouse release then unblocks the next valid read',()=>{const s=createIndustrialState(),p='PLT-0242';assert.equal(scanPallet(s,p,'RDR-QA01','hold','2026-10-22T10:00:00+05:30').status,'Quality hold');assert.equal(scanPallet(s,p,'RDR-QA01','dup','2026-10-22T10:00:02+05:30').status,'Duplicate ignored');assert.equal(lastLocation(s,p),'CNC cell');post(s,{stockId:'s3',kind:'Release',quantity:96,reference:'QA-RELEASE-01'});assert.equal(scanPallet(s,p,'RDR-QA01','released','2026-10-22T10:02:00+05:30').status,'Accepted');assert.equal(lastLocation(s,p),'QA released');});
