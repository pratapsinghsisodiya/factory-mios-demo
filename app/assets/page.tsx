"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Nav from '../../components/Nav';
import { api } from '../../lib/api';
export default function Assets() {
  const [machines, setMachines] = useState<any[]>([]);
  useEffect(()=>{api.devices().then(setMachines);},[]);
  return <><Nav/><main className="dashboard-workspace"><div className="page-heading"><div><span className="eyebrow">SAMPLE EQUIPMENT</span><h1>Devices & plants</h1><p>Nine synthetic assets across three plants.</p></div></div><section className="data-section"><div className="table-scroll"><table><thead><tr><th>Equipment</th><th>Plant</th><th>Status</th><th>Explore</th></tr></thead><tbody>{machines.map(m=><tr key={m.id}><td>{m.name}</td><td>{m.plant}</td><td><span className={`status ${m.status}`}>{m.status}</span></td><td><Link className="text-button" href={`/twin?device=${m.id}`}>View in 3D</Link></td></tr>)}</tbody></table></div></section><p className="demo-explainer">Machine registration, live telemetry ingestion, and client onboarding are available in the full application. This public demo contains sample equipment only.</p></main></>;
}
