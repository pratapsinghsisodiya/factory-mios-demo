"use client";
import { useState } from "react";
import { Bot, X, Send, LoaderCircle } from "lucide-react";
import { api } from "../lib/api";
export default function Assistant() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<{role:string;text:string}[]>([]);
  const [busy, setBusy] = useState(false);
  async function ask(q: string) {
    if (!q.trim() || busy) return;
    setQuestion(""); setBusy(true); setMessages(m => [...m, {role:"user",text:q}]);
    try { const r = await api.factobot(q); setMessages(m => [...m,{role:"bot",text:r.reply}]); }
    catch(e:any) { setMessages(m=>[...m,{role:"bot",text:`Could not retrieve data: ${e.message}`}]); }
    finally { setBusy(false); }
  }
  return <div className="assistant">
    {open && <section className="chat-window" aria-label="facto-BOT conversation"><header><Bot size={21}/><div><strong>facto-BOT</strong><small>Sample-data assistant · preset rules</small></div><button className="icon-btn" title="Close assistant" aria-label="Close assistant" onClick={()=>setOpen(false)}><X size={18}/></button></header>
      <div className="chat-messages" aria-live="polite">{messages.length===0 && <><p className="chat-greeting">What would you like to know about your factory?</p>{["What is OEE today?","How much energy was consumed?","Show top downtime reasons"].map(q=><button key={q} className="suggestion" onClick={()=>ask(q)}>{q}</button>)}</>}{messages.map((m,i)=><p key={i} className={`message ${m.role}`}>{m.text}</p>)}{busy && <LoaderCircle className="spin" size={18}/>}</div>
      <form onSubmit={e=>{e.preventDefault();ask(question);}}><input aria-label="Ask facto-BOT" placeholder="Ask about your factory..." value={question} onChange={e=>setQuestion(e.target.value)}/><button type="submit" disabled={busy} className="icon-btn" title="Send question" aria-label="Send question"><Send size={18}/></button></form></section>}
    <button className="assistant-trigger" onClick={()=>setOpen(!open)}><Bot size={21}/><span>Ask facto-BOT</span></button>
  </div>;
}
