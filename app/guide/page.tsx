"use client";
import { useState } from 'react';
import Link from 'next/link';
import { RotateCcw } from 'lucide-react';
import Nav from '../../components/Nav';
import { resetDemo } from '../../lib/api';
export default function Guide() {
  const [notice, setNotice] = useState('');
  return <><Nav/><main className="dashboard-workspace"><div className="page-heading"><div><span className="eyebrow">FACTORY-MIOS / CLIENT DEMO</span><h1>A five-minute factory walkthrough</h1><p>Interactive sample data, ready to explore.</p></div></div>
    <div className="guide-grid">
      <section className="data-section guide-card"><span className="demo-badge">01 · EXPLORE</span><h2>See operations at a glance</h2><p>Open the overview, select a plant, and compare the 8-hour, 24-hour, and 7-day sample windows. Explore the OEE, energy, CNC, quality, and utilities views.</p><Link className="btn" href="/dashboard">Open dashboards</Link></section>
      <section className="data-section guide-card"><span className="demo-badge">02 · INTERACT</span><h2>Walk the 3D factory</h2><p>Drag to orbit, zoom in, pause the animation, and click a machine to inspect its sample performance. The scene illustrates an equipment layout.</p><Link className="btn" href="/twin">Explore the factory</Link></section>
      <section className="data-section guide-card"><span className="demo-badge">03 · TRY A WORKFLOW</span><h2>Create a work order</h2><p>Add a maintenance record, start it, and mark it complete. Try inventory, safety, traceability, and the downtime register. Your changes stay in this browser.</p><Link className="btn" href="/dashboard?module=maintenance">Open maintenance</Link></section>
      <section className="data-section guide-card"><span className="demo-badge">04 · ASK & EXPORT</span><h2>Explore the sample numbers</h2><p>Ask facto-BOT about OEE, energy, production, or downtime. It uses preset rules and the demo dataset. Export a dashboard as a CSV file that opens in Excel.</p><Link className="btn" href="/dashboard?module=ems">Explore energy</Link></section>
    </div>
    <section className="data-section guide-card"><h2>About this demonstration</h2><p>All machine readings, names, records, and results are synthetic. This demo has no live equipment connection, server database, real account creation, or shared client records. The full application provides those workflows separately. Reported time windows illustrate sample scenarios; they do not describe actual factory production.</p><p>Resetting restores the original sample records in this browser. Downloaded reports are unaffected.</p><button className="btn-ghost" onClick={()=>{resetDemo();setNotice('Demo reset. The original sample records have been restored.');}}><RotateCcw size={16}/>Reset demo data</button>{notice&&<p className="notice-banner" role="status">{notice}</p>}</section>
  </main></>;
}
