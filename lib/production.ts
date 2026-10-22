import {oee,productionAssets,round} from './industrial';
export const LIVE_DAY='2026-10-22';
export const HISTORY_DAY='2026-10-21';
export const START_SECOND=264*60;
export const reasons={Idle:['No product','Planning'],Breakdown:['Mechanical','Electrical','Control','IT']} as const;
export type MachineStatus='Running'|'Idle'|'Breakdown';
export type Override={id:string;asset:string;second:number;status:MachineStatus;category:string;detail:string;operator:string};
export type ReviewTask={id:string;finding:string;title:string;owner:string;created:number;status:'Open'|'In progress'|'Closed'};
export type OperationsState={version:1;clock:number;paused:boolean;overrides:Override[];acknowledgements:Record<string,{by:string;at:number}>;tasks:ReviewTask[]};
export function createOperations():OperationsState{return {version:1,clock:START_SECOND,paused:false,overrides:[],acknowledgements:{},tasks:[]};}
export function clockTime(second:number,seconds=false){const s=Math.max(0,Math.floor(second))+6*3600;return `${String(Math.floor(s/3600)%24).padStart(2,'0')}:${String(Math.floor(s/60)%60).padStart(2,'0')}`+(seconds?':'+String(s%60).padStart(2,'0'):'');}
export function shiftName(second:number){return second<28800?'A':second<57600?'B':'C';}
export const shiftLabels={A:'A · 06:00–14:00',B:'B · 14:00–22:00',C:'C · 22:00–06:00 (+1 day)'};
const configurations=new Map<string,ReturnType<typeof oee>>();
function config(asset:string,shift:string){const key=asset+shift;if(!configurations.has(key))configurations.set(key,oee(asset,shift));return configurations.get(key)!;}
type SourceStatus={status:MachineStatus;category:string;detail:string;scheduled:boolean};
function sourceStatus(asset:string,second:number,day:string,state:OperationsState):SourceStatus{
 const shift=shiftName(second),minute=Math.floor(second/60)%480;
 if(shift==='C')return {status:'Idle',category:'Planning',detail:'No production scheduled for night shift',scheduled:false};
 const d=config(asset,shift),base=d.minutes[minute]||d.minutes[479];
 const manual=day===LIVE_DAY?[...state.overrides].reverse().find(e=>e.asset===asset&&e.second<=second):undefined;
 if(manual)return {status:manual.status,category:manual.category,detail:manual.detail,scheduled:!base.pause};
 if(day===LIVE_DAY&&asset==='CNC-02'&&second>=256*60&&second<290*60)return {status:'Breakdown',category:'Electrical',detail:'Servo drive E-041 overcurrent; axis restart unsuccessful. Electrical inspection requested.',scheduled:true};
 if(day===LIVE_DAY&&asset==='ASM-01'&&second>=258*60&&second<280*60)return {status:'Idle',category:'No product',detail:'HSG-120 housing kit not at assembly station. Awaiting material issue from stores.',scheduled:true};
 if(base.pause)return {status:'Idle',category:'Planning',detail:'Scheduled 15-minute break',scheduled:false};
 if(base.loss>=0)return {status:base.loss===1?'Breakdown':'Idle',category:base.loss===1?(asset==='ASM-01'?'Control':'Mechanical'):base.loss===2?'No product':'Planning',detail:d.asset.reasons[base.loss],scheduled:true};
 return {status:'Running',category:'Production',detail:'Automatic cycle active',scheduled:true};
}
export type MinuteRow={asset:string;minute:number;time:string;shift:string;seconds:number;output:number;good:number;runSeconds:number;idleSeconds:number;breakdownSeconds:number;plannedSeconds:number;capacity:number};
export type StopEvent={id:string;asset:string;start:number;end:number;status:MachineStatus;category:string;detail:string;scheduled:boolean};
export function productionSnapshot(state:OperationsState,day=LIVE_DAY){
 const end=day===LIVE_DAY?Math.max(0,Math.min(86400,state.clock)):86400;
 const rows:MinuteRow[]=[],events:StopEvent[]=[];
 const machines=productionAssets.map((asset,index)=>{
  const assetRows:MinuteRow[]=[],assetEvents:StopEvent[]=[];
  let phase='',expected=0,counted=0,accepted=0;
  for(let minute=0;minute<Math.ceil(end/60);minute++){
   const start=minute*60,finish=Math.min(start+60,end),shift=shiftName(start);
   if(shift!==phase){phase=shift;expected=0;counted=0;accepted=0;}
   const d=config(asset.id,shift==='C'?'B':shift);
   const cuts=[start,...(day===LIVE_DAY?state.overrides.filter(v=>v.asset===asset.id&&v.second>start&&v.second<finish).map(v=>v.second):[]),finish].sort((a,b)=>a-b);
   let runSeconds=0,idleSeconds=0,breakdownSeconds=0,plannedSeconds=0;
   for(let i=0;i<cuts.length-1;i++){
    const a=cuts[i],b=cuts[i+1],s=sourceStatus(asset.id,a,day,state),duration=b-a;
    if(s.scheduled)plannedSeconds+=duration;
    if(s.status==='Running'){runSeconds+=duration;expected+=duration/60*d.total/d.run;}
    else {
     if(s.status==='Idle')idleSeconds+=duration;else breakdownSeconds+=duration;
     const last=assetEvents[assetEvents.length-1];
     if(last&&last.end===a&&last.status===s.status&&last.category===s.category&&last.detail===s.detail)last.end=b;
     else assetEvents.push({id:`${day}-${asset.id}-${a}`,asset:asset.id,start:a,end:b,...s});
    }
   }
   const cumulative=Math.floor(expected+1e-8),cumulativeGood=Math.floor(cumulative*d.good/d.total+1e-8);
   assetRows.push({asset:asset.id,minute,time:clockTime(start),shift,seconds:finish-start,output:cumulative-counted,good:cumulativeGood-accepted,runSeconds,idleSeconds,breakdownSeconds,plannedSeconds,capacity:plannedSeconds/asset.ideal});
   counted=cumulative;accepted=cumulativeGood;
  }
  rows.push(...assetRows);events.push(...assetEvents);
  const current=sourceStatus(asset.id,Math.min(end,86399.99),day,state),last=assetEvents[assetEvents.length-1];
  const since=last&&last.end===end&&last.status===current.status&&last.detail===current.detail?last.start:end;
  return {...asset,...current,since,output:assetRows.reduce((n,r)=>n+r.output,0),good:assetRows.reduce((n,r)=>n+r.good,0),runHours:assetRows.reduce((n,r)=>n+r.runSeconds,0)/3600,
   power:current.status==='Running'?round([18.6,21.8,7.4][index]+.7*Math.sin(end/75+index)):current.status==='Idle'?[1.8,2.1,1.1][index]:[3.4,4.2,1.6][index],temperature:round([48,54,39][index]+1.4*Math.sin(end/160+index)),lastMinute:assetRows.find(r=>r.minute===Math.floor(end/60)-1)?.output||0};
 });
 const alarms=events.filter(e=>e.status==='Breakdown'||(e.scheduled&&e.category==='No product'&&e.end-e.start>=300)).map(e=>{
  const machine=machines.find(m=>m.id===e.asset)!;
  const active=day===LIVE_DAY&&e.end===end&&machine.status===e.status&&machine.detail===e.detail;
  return {...e,active,severity:e.status==='Breakdown'?'High':'Warning',ack:day===LIVE_DAY?state.acknowledgements[e.id]:undefined};
 }).sort((a,b)=>Number(b.active)-Number(a.active)||Number(b.severity==='High')-Number(a.severity==='High')||b.start-a.start);
 return {day,end,rows,events,machines,alarms};
}
export type Snapshot=ReturnType<typeof productionSnapshot>;
export function reportStops(snapshot:Snapshot,asset:string,shift:string){const index=['A','B','C'].indexOf(shift),start=index<0?0:index*28800,end=Math.min(snapshot.end,index<0?86400:(index+1)*28800);return snapshot.events.filter(e=>(asset==='all'||e.asset===asset)&&e.start<end&&e.end>start).map(e=>({...e,start:Math.max(e.start,start),end:Math.min(e.end,end)}));}
export function selectedReport(snapshot:Snapshot,asset='CNC-01',shift='All'){
 const machines=asset==='all'?snapshot.machines:snapshot.machines.filter(m=>m.id===asset);
 const rows=snapshot.rows.filter(r=>(asset==='all'||r.asset===asset)&&(shift==='All'||r.shift===shift));
 const total=(key:'output'|'good'|'runSeconds'|'idleSeconds'|'breakdownSeconds'|'plannedSeconds')=>rows.reduce((n,r)=>n+r[key],0);
 const hourly=Array.from({length:24},(_,h)=>{const bucket=rows.filter(r=>Math.floor(r.minute/60)===h),scheduled=shiftName(h*3600);return {time:clockTime(h*3600),hour:h,shift:scheduled,output:bucket.reduce((n,r)=>n+r.output,0),good:bucket.reduce((n,r)=>n+r.good,0),capacity:round(bucket.reduce((n,r)=>n+r.capacity,0)),runHours:round(bucket.reduce((n,r)=>n+r.runSeconds,0)/3600,3),elapsed:bucket.length>0,partial:snapshot.end>h*3600&&snapshot.end<(h+1)*3600};}).filter(r=>shift==='All'||r.shift===shift);
 const shifts=['A','B','C'].map((name,i)=>{const bucket=rows.filter(r=>r.shift===name),start=i*28800;return {name,label:shiftLabels[name as keyof typeof shiftLabels],output:bucket.reduce((n,r)=>n+r.output,0),good:bucket.reduce((n,r)=>n+r.good,0),runHours:round(bucket.reduce((n,r)=>n+r.runSeconds,0)/3600,3),idleMinutes:round(bucket.reduce((n,r)=>n+r.idleSeconds,0)/60),breakdownMinutes:round(bucket.reduce((n,r)=>n+r.breakdownSeconds,0)/60),coverage:snapshot.end<=start?'Upcoming':snapshot.end>=start+28800?'Complete':'In progress',scheduled:name!=='C'};}).filter(r=>shift==='All'||r.name===shift);
 const shiftIndex=['A','B','C'].indexOf(shift),anchor=shiftIndex<0?snapshot.end:Math.min(snapshot.end,(shiftIndex+1)*28800);
 const lastMinute=Math.floor(anchor/60)-1,lastHour=Math.floor(anchor/3600)-1;
 const minuteRows=Array.from({length:Math.min(60,Math.max(0,lastMinute+1))},(_,i)=>{const minute=Math.max(0,lastMinute-59)+i,bucket=rows.filter(r=>r.minute===minute);return {time:clockTime(minute*60),output:bucket.reduce((n,r)=>n+r.output,0)};});
 return {asset,shift,machines,rows,hourly,shifts,minuteRows,output:total('output'),good:total('good'),rejects:total('output')-total('good'),runHours:total('runSeconds')/3600,idleMinutes:total('idleSeconds')/60,breakdownMinutes:total('breakdownSeconds')/60,plannedHours:total('plannedSeconds')/3600,lastMinute:rows.filter(r=>r.minute===lastMinute).reduce((n,r)=>n+r.output,0),lastMinuteLabel:clockTime(lastMinute*60),lastHour:hourly.find(h=>h.hour===lastHour)?.output||0,lastHourLabel:clockTime(lastHour*3600),dayRunHours:machines.reduce((n,m)=>n+m.runHours,0)};
}
export function setMachineStatus(state:OperationsState,input:Omit<Override,'id'|'second'>,id:string){
 if(!productionAssets.some(a=>a.id===input.asset))throw new Error('Select a monitored machine.');
 if(!['Running','Idle','Breakdown'].includes(input.status))throw new Error('Choose a valid machine status.');
 if(input.status!=='Running'&&!(reasons[input.status] as readonly string[]).includes(input.category))throw new Error('Choose a reason belonging to the selected status.');
 if(!input.detail.trim()||!input.operator.trim())throw new Error('Enter the reason details and operator name.');
 if(state.clock>=57600)throw new Error('Status entries are available during scheduled shifts A and B.');
 state.overrides.push({...input,category:input.status==='Running'?'Production':input.category,id,second:state.clock});
}
export function acknowledge(state:OperationsState,id:string,by:string){const alarm=productionSnapshot(state).alarms.find(a=>a.id===id);if(!alarm||!alarm.active)throw new Error('Only an active alarm can be acknowledged.');if(!by.trim())throw new Error('Operator name is required.');state.acknowledgements[id]={by,at:state.clock};}
export function agentFindings(snapshot:Snapshot){
 const report=selectedReport(snapshot,'all');const active=snapshot.alarms.filter(a=>a.active),breakdown=active.find(a=>a.status==='Breakdown'),idle=active.find(a=>a.category==='No product');
 return [
 {id:'reliability',agent:'Reliability agent',title:breakdown?`${breakdown.asset}: ${breakdown.category.toLowerCase()} breakdown`:'No active production breakdown',severity:breakdown?'High':'Info',evidence:breakdown?`${clockTime(breakdown.start)}–${clockTime(snapshot.end)} IST · ${round((snapshot.end-breakdown.start)/60)} min · ${breakdown.detail}`:'Current monitored machine states show no active breakdown.',recommendation:breakdown?'Assign the relevant maintenance team to review the fault record and verify the cause before authorising restart.':'Continue monitoring the condition and stop-event history.',owner:'Maintenance',target:'alarms'},
 {id:'material',agent:'Material-flow agent',title:idle?`${idle.asset}: material waiting`:'No prolonged material wait',severity:idle?'Warning':'Info',evidence:idle?`${idle.category} since ${clockTime(idle.start)} IST. ${idle.detail}`:'No current No product event has exceeded the 5-minute alert threshold.',recommendation:idle?'Ask stores to confirm kit availability, reservation and quality release; record the expected supply time.':'Review upcoming material kits against the next production order.',owner:'Stores',target:'alarms'},
 {id:'output',agent:'Production analyst',title:'Output and runtime reconciliation',severity:'Info',evidence:`${report.output} operation completions; ${round(report.runHours,2)} running machine-hours; ${report.rejects} first-pass rejects. Basis: minute counter and state records.`,recommendation:'Compare the hourly profile with ideal capacity and prioritise the largest recorded stop reasons. Counts across operations are not unique finished goods.',owner:'Production',target:'reports'},
 {id:'shift',agent:'Shift reporting agent',title:`Shift ${shiftName(snapshot.end)} handover draft`,severity:'Info',evidence:`${active.length} active alarms; ${active.filter(a=>a.ack).length} acknowledged. Snapshot ${snapshot.day} ${clockTime(snapshot.end,true)} IST.`,recommendation:'Review output, running hours, unresolved stops and assigned actions, then export the shift report for handover.',owner:'Shift supervisor',target:'reports'}
 ];
}
export function answerAgent(question:string,snapshot:Snapshot,asset:string,shift='All'){
 const q=question.toLowerCase(),named=productionAssets.find(m=>q.includes(m.id.toLowerCase()));
 const scope=named?.id||asset,chosenShift=/shift\s+([abc])\b/i.exec(question)?.[1].toUpperCase()||shift;
 const r=selectedReport(snapshot,scope,chosenShift),label=`${scope} / ${chosenShift==='All'?'all shifts':'shift '+chosenShift}`;
 if(/running hours|runtime|run time/.test(q))return `${scope}: ${round(r.dayRunHours,2)} running ${scope==='all'?'machine-hours':'hours'} in the production day. Selected shift scope: ${round(r.runHours,2)} hours. Source: integrated Running state durations.`;
 if(/alarm|breakdown|idle|reason|stop/.test(q)){
  const matches=snapshot.alarms.filter(a=>a.active&&(!named||a.asset===scope));
  return matches.map(a=>`${a.asset}: ${a.category} — ${a.detail} Since ${clockTime(a.start)} IST.`).join('\n')||`No active production alarms ${named?'for '+scope:'in this snapshot'}.`;
 }
 if(/output|production|produce|count|hour|minute|shift/.test(q))return `${label}: ${r.output} completions and ${r.good} first-pass good in the selected period. Last complete minute (${r.lastMinuteLabel}): ${r.lastMinute}; last complete hour (${r.lastHourLabel}): ${r.lastHour}. Source: minute counter log at ${clockTime(snapshot.end,true)} IST.`;
 if(/run/.test(q))return `${scope} has ${round(r.dayRunHours,2)} running ${scope==='all'?'machine-hours':'hours'} in the production day, from 06:00 to the snapshot. Source: integrated Running state durations.`;
 return 'I can explain output, hourly/shift counts, running hours and alarm reasons using this demo snapshot. This preview uses deterministic rules; a connected language-model service is not configured.';
}
export function reportCsvRows(snapshot:Snapshot,asset:string,shift:string,kind:string){const r=selectedReport(snapshot,asset,shift);const meta=[['Production day',snapshot.day,'06:00 to next day 06:00 IST'],['Snapshot',clockTime(snapshot.end,true),'Synthetic replay'],['Equipment',asset,'Shift',shift]];if(kind==='Hourly')return [...meta,['Hour IST','Shift','Output completions','First-pass good','Ideal capacity elapsed','Running hours','Window'],...r.hourly.map(h=>[h.time,h.shift,h.output,h.good,h.capacity,h.runHours,h.partial?'Partial':h.elapsed?'Complete':'Upcoming'])];if(kind==='Minute')return [...meta,['Minute IST','Machine','Shift','Output','Good','Running seconds','Idle seconds','Breakdown seconds','Observed seconds'],...r.rows.map(m=>[m.time,m.asset,m.shift,m.output,m.good,m.runSeconds,m.idleSeconds,m.breakdownSeconds,m.seconds])];if(kind==='Stops')return [...meta,['Machine','Start IST','End IST','Duration min','Status','Category','Details'],...reportStops(snapshot,asset,shift).map(e=>[e.asset,clockTime(e.start,true),clockTime(e.end,true),round((e.end-e.start)/60),e.status,e.category,e.detail])];return [...meta,['Shift','Output completions','First-pass good','Running hours','Idle minutes','Breakdown minutes','Coverage'],...r.shifts.map(s=>[s.label,s.output,s.good,s.runHours,s.idleMinutes,s.breakdownMinutes,s.coverage])];}
