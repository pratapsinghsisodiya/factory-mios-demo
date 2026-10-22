"use client";
import {createContext,useContext,useEffect,useState,ReactNode} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import {DEMO_EMAIL,SESSION_KEY,DemoSession,validCredentials,validSession} from '../lib/demo-auth';
type SessionContext={session:DemoSession|null;ready:boolean;signIn:(email:string,password:string)=>void;signOut:()=>void};
const Context=createContext<SessionContext>({session:null,ready:false,signIn:()=>{},signOut:()=>{}});
export const useDemoSession=()=>useContext(Context);
export default function DemoSessionProvider({children}:{children:ReactNode}){
 const[session,setSession]=useState<DemoSession|null>(null),[ready,setReady]=useState(false);const path=usePathname(),router=useRouter();
 const clean=path.replace('/factory-mios-demo','').replace(/\/$/,'')||'/';const protectedPage=['/dashboard','/assets','/twin','/downtime'].includes(clean);
 useEffect(()=>{try{const saved=JSON.parse(sessionStorage.getItem(SESSION_KEY)||'null');if(validSession(saved))setSession(saved);}catch{}setReady(true);},[]);
 useEffect(()=>{if(ready&&protectedPage&&!session)router.replace('/login/?next='+encodeURIComponent(clean+window.location.search));},[ready,protectedPage,session,clean,router]);
 function signIn(email:string,password:string){if(!validCredentials(email,password))throw new Error('Use the public demo credentials shown below.');const next={name:'Demo supervisor',email:DEMO_EMAIL,expires:Date.now()+12*3600000};try{sessionStorage.setItem(SESSION_KEY,JSON.stringify(next));}catch{}setSession(next);}
 function signOut(){try{sessionStorage.removeItem(SESSION_KEY);}catch{}setSession(null);router.replace('/login/');}
 return <Context.Provider value={{session,ready,signIn,signOut}}>{protectedPage&&(!ready||!session)?<div className="loading-screen">Opening demo sign-in…</div>:children}</Context.Provider>;
}
