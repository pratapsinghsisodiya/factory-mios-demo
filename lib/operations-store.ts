"use client";
import {useEffect,useState} from 'react';
import {createOperations,OperationsState} from './production';
export const OPERATIONS_KEY='factory-mios-operations-v1';
export function useOperations(){const[state,setState]=useState<OperationsState>(createOperations),[ready,setReady]=useState(false),[notice,setNotice]=useState('');
 useEffect(()=>{try{const s=JSON.parse(localStorage.getItem(OPERATIONS_KEY)||'null');if(s?.version===1&&Number.isFinite(s.clock)&&s.clock>=0&&s.clock<=86400&&Array.isArray(s.overrides)&&Array.isArray(s.tasks)&&s.acknowledgements)setState(s);}catch{setNotice('Browser storage unavailable; replay changes will last for this page session.');}setReady(true);},[]);
 useEffect(()=>{if(!ready)return;try{localStorage.setItem(OPERATIONS_KEY,JSON.stringify(state));}catch{setNotice('Browser storage unavailable; export your records before leaving.');}},[state,ready]);
 useEffect(()=>{if(!ready||state.paused||state.clock>=86400)return;const timer=setInterval(()=>setState(s=>({...s,clock:Math.min(86400,s.clock+5)})),5000);return()=>clearInterval(timer);},[ready,state.paused,state.clock>=86400]);
 function update(fn:(draft:OperationsState)=>void){const next=structuredClone(state);fn(next);setState(next);}
 return {state,ready,notice,update,reset:()=>setState(createOperations())};
}
