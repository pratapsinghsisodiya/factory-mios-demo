// Public demonstration credentials. This is a navigation gate, not server authentication.
export const DEMO_EMAIL='demo@factorymios.example';
export const DEMO_PASSWORD='Factory@123';
export const SESSION_KEY='factory-mios-demo-session-v1';
export type DemoSession={name:string;email:string;expires:number};
export function validCredentials(email:string,password:string){return email.trim().toLowerCase()===DEMO_EMAIL&&password===DEMO_PASSWORD;}
export function validSession(value:unknown,now=Date.now()):value is DemoSession{const s=value as DemoSession;return !!s&&s.email===DEMO_EMAIL&&s.name==='Demo supervisor'&&Number.isFinite(s.expires)&&s.expires>now;}
export function safeDestination(value:string|null){if(!value||!/^\/(dashboard|assets|twin|downtime)\/?(?:\?[^#]*)?$/.test(value))return '/dashboard';return value;}
