"use client";
import Link from 'next/link';
import { Factory, ArrowRight, Box, Gauge, ShieldCheck } from 'lucide-react';
export default function Login() {
  return <main className="login-page"><div className="login-brand"><Factory size={32}/><strong>Factory-MIOS</strong><span>Factory AI</span></div>
    <section className="login-form"><span className="eyebrow">INTERACTIVE CLIENT DEMO</span><h1>Your factory.<br/>One connected view.</h1><p>Explore manufacturing intelligence across three sample plants and nine machines.</p>
      <div className="demo-features"><span><Gauge size={19}/> Production, quality & energy dashboards</span><span><Box size={19}/> Interactive 3D factory floor</span><span><ShieldCheck size={19}/> Maintenance, safety & traceability workflows</span></div>
      <Link href="/dashboard" className="demo-login"><Factory size={22}/><div><strong>Open demo workspace</strong><small>No account needed · synthetic sample data</small></div><ArrowRight size={19}/></Link>
      <p className="demo-explainer">Explore freely. Changes stay in this browser and can be reset from the demo guide. Use sample information when trying the forms.</p>
      <Link className="text-button" href="/guide">Read the demo guide <ArrowRight size={14}/></Link>
    </section><footer>Factory-MIOS · Factory AI · facto-BOT</footer></main>;
}
