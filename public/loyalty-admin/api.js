import {CONFIG} from './config.js';

const SESSION_KEY='royal-coffee-admin-session-v2';

let session=null,refreshPromise=null;
try{session=JSON.parse(localStorage.getItem(SESSION_KEY)||'null');}catch(_){}
export const config=CONFIG;
export const configured=()=>Boolean(CONFIG.SUPABASE_URL?.startsWith('https://') && CONFIG.SUPABASE_PUBLISHABLE_KEY && CONFIG.CARD_API_URL?.startsWith('https://'));
export const currentSession=()=>session;
const apiError=(body,status)=>{const error=new Error(body?.msg||body?.error_description||body?.message||body?.error||`HTTP ${status}`);error.status=status;return error;};
async function parseJson(r){const body=await r.json().catch(()=>({}));if(!r.ok)throw apiError(body,r.status);return body;}
async function authPost(path,data){return parseJson(await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/${path}`,{method:'POST',headers:{'apikey':CONFIG.SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json'},body:JSON.stringify(data)}));}
export async function loginAdmin(email,password){const r=await authPost('token?grant_type=password',{email,password});session=r;localStorage.setItem(SESSION_KEY,JSON.stringify(r));return r;}
export async function refreshSession(){if(!session?.refresh_token)throw Error('تحتاج تسجيل الدخول.');if(!refreshPromise){refreshPromise=authPost('token?grant_type=refresh_token',{refresh_token:session.refresh_token}).then(r=>{session=r;localStorage.setItem(SESSION_KEY,JSON.stringify(r));return r;}).catch(err=>{session=null;localStorage.removeItem(SESSION_KEY);throw err;}).finally(()=>refreshPromise=null);}return refreshPromise;}
export async function getToken(){if(!session)throw Error('تحتاج تسجيل الدخول.');if(session.expires_at && session.expires_at<Math.floor(Date.now()/1000)+80)await refreshSession();return session.access_token;}
export async function logout(){if(session){try{await fetch(`${CONFIG.SUPABASE_URL}/auth/v1/logout`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${session.access_token}`}});}catch(_){}}session=null;localStorage.removeItem(SESSION_KEY);}
export async function rpc(name,params={}){const run=async()=>fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:CONFIG.SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${await getToken()}`,'Content-Type':'application/json'},body:JSON.stringify(params)});let r=await run();if(r.status===401){await refreshSession();r=await run();}return parseJson(r);}
