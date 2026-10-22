"use client";
import { useEffect,useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Nav from "../../components/Nav";
import { req,getToken,demoUrl } from "../../lib/api";
const FactoryScene=dynamic(()=>import("../../components/FactoryScene"),{ssr:false,loading:()=> <div className="loading-screen">Loading factory view...</div>});
export default function Twin(){const[data,setData]=useState<any>(null),[error,setError]=useState("");async function load(){try{setData(await req("/workspace/summary"));}catch(e:any){setError(e.message);}}useEffect(()=>{if(!getToken())location.href=demoUrl("/login/");else load();},[]);return <><Nav/><header className="page-heading" style={{padding:"24px 30px"}}><div><span className="eyebrow">FACTORY AI / DIGITAL TWIN</span><h1>Factory floor</h1><p>{data?.tenant.name} {data?.tenant.is_demo&&<span className="demo-badge">DEMO DATA</span>}</p></div><div className="heading-actions"><Link href="/dashboard" className="btn-ghost"><ArrowLeft size={16}/>Overview</Link><button className="icon-btn" title="Refresh machines" onClick={load}><RefreshCw size={16}/></button></div></header>{error&&<div className="error-banner">{error}</div>}{data&&<FactoryScene machines={data.machines}/>}</>;}
