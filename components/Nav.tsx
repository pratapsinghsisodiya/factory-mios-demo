"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Factory, LayoutDashboard, Box, Activity, Gauge, Zap, Droplets, Wrench, Package, ShieldCheck, GitBranch, Settings, SlidersHorizontal, Users, LogOut, Menu, X, PanelsTopLeft, FileBarChart, Bot } from "lucide-react";
import { BASE, demoUrl } from "../lib/api";

const items = [
  ["/dashboard", "Overview", LayoutDashboard], ["/twin", "3D factory", Box],
  ["/dashboard?module=oee", "Production OEE", Gauge], ["/dashboard?module=cnc", "CNC monitoring", Activity],
  ["/dashboard?module=ems", "Energy", Zap], ["/dashboard?module=water", "Water & utilities", Droplets],
  ["/dashboard?module=quality", "Quality", ShieldCheck], ["/dashboard?module=downtime", "Downtime", Activity],
  ["/dashboard?module=maintenance", "Maintenance", Wrench], ["/dashboard?module=inventory", "Inventory", Package],
  ["/dashboard?module=traceability", "Traceability", GitBranch], ["/dashboard?module=safety", "Safety", ShieldCheck],
  ["/dashboard?module=realtime", "Real-time", Activity], ["/dashboard?module=utilities", "Utilities", Zap], ["/dashboard?module=executive", "Executive", FileBarChart],
] as const;
const setup = [["/assets", "Sample equipment", SlidersHorizontal], ["/downtime", "Downtime register", Wrench], ["/guide", "Demo guide & reset", Settings]] as const;

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const current = () => window.location.pathname.replace(BASE, '').replace(/\/$/, '') + window.location.search;
  useEffect(() => { setSelected(current()); setOpen(false); }, [path]);
  useEffect(() => { const f = () => setSelected(current()); window.addEventListener("popstate", f); return () => window.removeEventListener("popstate", f); }, []);
  const links = (list: typeof items | typeof setup) => list.map(([href, label, Icon]) => <Link key={href} href={href} onClick={() => { setSelected(href); setOpen(false); }} className={`nav-item ${selected === href ? "selected" : ""}`}><Icon size={17}/><span>{label}</span>{href === "/twin" && <small>3D</small>}</Link>);
  return <>
    <div className="mobile-bar"><Link href="/dashboard"><Factory size={22}/> Factory-MIOS</Link><button aria-label="Toggle navigation" title="Navigation" onClick={() => setOpen(!open)}>{open ? <X/> : <Menu/>}</button></div>
    {open && <div className="nav-backdrop" onClick={() => setOpen(false)}/>}
    <aside className={`sidebar ${open ? "is-open" : ""}`}>
      <Link href="/dashboard" className="brand"><span className="brand-symbol"><Factory size={25}/></span><div>Factory-MIOS<small>MANUFACTURING INTELLIGENCE</small></div></Link>
      <div className="workspace-label"><span className="workspace-avatar">FA</span><div>Factory AI<small>Sample manufacturing workspace</small></div></div>
      <nav><div className="nav-caption">WORKSPACE</div>{links(items)}<div className="nav-caption">EXPLORE THE DEMO</div>{links(setup)}</nav>
      <div className="sidebar-foot"><Bot size={18}/><span>facto-BOT <small>Sample-data intelligence</small></span><button aria-label="Exit demo" title="Exit demo" onClick={() => { location.href = demoUrl("/login/"); }}><LogOut size={17}/></button></div>
    </aside>
  </>;
}
