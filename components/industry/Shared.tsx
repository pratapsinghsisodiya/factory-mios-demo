import type { ReactNode } from 'react';
export const chartColors = { blue: '#356fa0', teal: '#277c73', amber: '#b27b29', red: '#b65548', muted: '#a7b5c1', purple: '#82619a' };
export const axisStyle = { fontSize: 10, fill: '#71808e' };
export const tooltipStyle = { border: '1px solid #d7e0e6', borderRadius: 3, fontSize: 11, boxShadow: '0 4px 18px #162c3d12' };
export function Panel({title, note, children, action, className = ''}: {title:string;note?:string;children:ReactNode;action?:ReactNode;className?:string}) {
  return <section className={`plant-panel ${className}`}><header className="panel-title"><div><h2>{title}</h2>{note&&<p>{note}</p>}</div>{action}</header>{children}</section>;
}
export function Stats({items}: {items:{label:string;value:ReactNode;unit?:string;note:string;tone?:string}[]}) {
  return <div className="plant-stats">{items.map(i=><article key={i.label} className={i.tone||''}><span>{i.label}</span><strong>{i.value}<small>{i.unit}</small></strong><p>{i.note}</p></article>)}</div>;
}
export function Badge({children,tone='neutral'}:{children:ReactNode;tone?:string}){return <span className={`plant-badge ${tone}`}>{children}</span>;}
export function Facts({items}:{items:[string,ReactNode][]}){return <dl className="plant-facts">{items.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;}
export function Message({children,tone='info'}:{children:ReactNode;tone?:string}){return <div className={`plant-message ${tone}`} role={tone==='error'?'alert':'status'}>{children}</div>;}
export function DateFilter({day,onChange}:{day:string;onChange:(d:string)=>void}){return <label className="plant-filter">Operating day<select aria-label="Operating day" value={day} onChange={e=>onChange(e.target.value)}><option value="2026-10-21">21 Oct 2026 · complete day</option><option value="2026-10-20">20 Oct 2026 · complete day</option></select></label>;}
export function Footnote({children}:{children:ReactNode}){return <p className="plant-footnote">{children}</p>;}
