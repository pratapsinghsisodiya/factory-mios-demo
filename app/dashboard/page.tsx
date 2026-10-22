"use client";
import {Suspense} from 'react';
import {useSearchParams} from 'next/navigation';
import Link from 'next/link';
import Nav from '../../components/Nav';
import Energy from '../../components/industry/Energy';
import Water from '../../components/industry/Water';
import Oee from '../../components/industry/Oee';
import Maintenance from '../../components/industry/Maintenance';
import Warehouse from '../../components/industry/Warehouse';
import Traceability from '../../components/industry/Traceability';
import Overview from '../../components/industry/Overview';
import {Message} from '../../components/industry/Shared';
import {useIndustrialState} from '../../lib/industrial-store';
const titles:Record<string,[string,string,string]>={overview:['Plant operations','Operating overview','A connected view of production, utilities, material flow and asset condition.'],ems:['Utilities / electrical','Energy management','Meter registers, interval demand, electrical quality and feeder reconciliation.'],water:['Utilities / water','Water management','Fresh-water balance, process consumption, storage and internal reuse.'],oee:['Manufacturing / performance','Production OEE','Trace the result back to planned minutes, ideal cycle time and first-pass counts.'],maintenance:['Asset reliability','Condition & maintenance','Motor-specific sensors, inspection schedules and service verification.'],inventory:['Materials / stores','Warehouse management','Inventory by material, lot and bin, with reservations and quality holds.'],traceability:['Material genealogy','RFID traceability','From RF response to a validated pallet movement and manufacturing lot.']};
function Dashboard(){const query=useSearchParams();const requested=query.get('module')||'overview';const aliases:Record<string,string>={wms:'inventory',cnc:'oee',quality:'oee',downtime:'oee',utilities:'ems',executive:'overview',realtime:'overview',safety:'overview'};const module=aliases[requested]||requested;const selected=titles[module]?module:'overview';const [section,title,subtitle]=titles[selected];const {state,update,storageNotice}=useIndustrialState();
 return <><Nav active={selected==="overview"?"/dashboard":"/dashboard?module="+selected}/><main className="plant-workspace"><div className="plant-topbar"><span>PUNE / PLANT 01 <b>Automotive components</b></span><Link href="/guide">Scenario & methodology ↗</Link></div><header className="plant-heading"><div><span className="section-kicker">{section}</span><h1>{title}</h1><p>{subtitle}</p></div><div className="snapshot-label"><span>REFERENCE SCENARIO</span><b>21–22 Oct 2026</b><small>IST · synthetic measurements</small></div></header>{storageNotice&&<Message tone="amber">{storageNotice}</Message>}
 {selected==='ems'?<Energy/>:selected==='water'?<Water/>:selected==='oee'?<Oee/>:selected==='maintenance'?<Maintenance state={state} update={update}/>:selected==='inventory'?<Warehouse state={state} update={update}/>:selected==='traceability'?<Traceability state={state} update={update}/>:<Overview state={state}/>}
 <footer className="plant-footer"><span>FACTORY-MIOS / PLANT OPERATIONS</span><span>Illustrative data · browser-local entries · <Link href="/guide">Methods & reset</Link></span></footer></main></>;}
export default function Page(){return <Suspense fallback={<div className="loading-screen">Loading plant operations…</div>}><Dashboard/></Suspense>;}
