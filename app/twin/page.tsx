"use client";
import dynamic from 'next/dynamic';
import Nav from '../../components/Nav';
import {motors,productionAssets,oee,num} from '../../lib/industrial';
const FactoryScene=dynamic(()=>import('../../components/FactoryScene'),{ssr:false,loading:()=> <div className="loading-screen">Loading schematic…</div>});
const machines=[...productionAssets.map(a=>({id:a.id,name:a.id,plant:a.name,kind:a.id.startsWith('CNC')?'cnc':'assembly',status:'running',oee:num(oee(a.id).oee*100,2),production:a.total})),...motors.map(m=>({id:m.id,name:m.id,plant:m.name,kind:'utility',status:m.current.h>=m.alarm?'attention':'running',temperature:m.current.temp,vibration:m.current.h,rpm:m.current.rpm,rating:m.kw}))];
export default function Twin(){return <><Nav/><header className="plant-heading" style={{padding:'24px 28px'}}><div><span className="section-kicker">Plant 01 / schematic</span><h1>Equipment layout</h1><p>Illustrative positions and simplified geometry · click equipment to inspect its relevant measurements.</p></div></header><FactoryScene machines={machines}/></>;}
