import {CONFIG} from '../loyalty-admin/config.js';

const CARD_KEY='royal-coffee-private-card-v2';
export const config=CONFIG;
export const configured=()=>Boolean(CONFIG.SUPABASE_URL?.startsWith('https://') && CONFIG.SUPABASE_PUBLISHABLE_KEY && CONFIG.CARD_API_URL?.startsWith('https://'));

const validCardToken=(token)=>typeof token==='string' && /^[a-f0-9]{64}$/.test(token);
const COOKIE_KEY='royal-coffee-card-token';
const cookieToken=()=>{const match=document.cookie.split('; ').find(c=>c.startsWith(COOKIE_KEY+'='));const value=match?.slice(COOKIE_KEY.length+1)||'';return validCardToken(value)?value:'';};
export const currentCardToken=()=>{let stored='';try{stored=localStorage.getItem(CARD_KEY)||'';}catch(_){}return validCardToken(stored)?stored:cookieToken();};
export const saveCardToken=(token)=>{
 if(validCardToken(token)){
  try{localStorage.setItem(CARD_KEY,token);}catch(_){}
  document.cookie=`${COOKIE_KEY}=${token}; Path=/loyalty-card/; Max-Age=31536000; SameSite=Strict; Secure`;
  window.royalCardInstall?.apply(token);
 }else{
  try{localStorage.removeItem(CARD_KEY);}catch(_){}
  document.cookie=`${COOKIE_KEY}=; Path=/loyalty-card/; Max-Age=0; SameSite=Strict; Secure`;
  window.royalCardInstall?.forget();
 }
};
const apiError=(body,status)=>{const error=new Error(body?.msg||body?.error_description||body?.message||body?.error||`HTTP ${status}`);error.status=status;return error;};
async function parseJson(r){const body=await r.json().catch(()=>({}));if(!r.ok)throw apiError(body,r.status);return body;}
export async function cardApi(action,params={}){if(!CONFIG.CARD_API_URL)throw Error('خدمة البطاقات لم يتم ربطها.');return parseJson(await fetch(`${CONFIG.CARD_API_URL}/${action}`,{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify(params)}));}
export async function fetchCard(token){return cardApi('card',{token});}
export const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||Boolean(window.navigator.standalone);
function fromBase64Url(base64){const padding='='.repeat((4-base64.length%4)%4);return Uint8Array.from(atob((base64+padding).replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));}
export async function subscribeCardPush(token,marketing){
 if(!CONFIG.VAPID_PUBLIC_KEY)throw Error('إشعارات Web Push لم يتم تشغيلها بعد من الإدارة.');
 if(!isStandalone() && /iphone|ipad|ipod/i.test(navigator.userAgent))throw Error('على iPhone، ثبّت البطاقة من Safari وافتحها من الشاشة الرئيسية أولًا.');
 if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window))throw Error('جهازك أو هذا المتصفح لا يدعم الإشعارات.');
 // Trigger the native permission prompt directly inside the user's click handler.
 const permission=await Notification.requestPermission();
 if(permission!=='granted')throw Error('لم يتم السماح بالإشعارات. يمكنك تغييره من إعدادات الجهاز.');
 const registration=await navigator.serviceWorker.getRegistration('/loyalty-card/index.html');
 if(!registration?.active||!registration.scope.endsWith('/loyalty-card/'))throw Error('أعد فتح البطاقة ثم فعّل الإشعارات.');
 let subscription=await registration.pushManager.getSubscription();let isNew=false;
 if(!subscription){subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:fromBase64Url(CONFIG.VAPID_PUBLIC_KEY)});isNew=true;}
 const {endpoint,keys}=subscription.toJSON();
 try{
  await cardApi('subscribe',{token,endpoint,p256dh:keys.p256dh,auth:keys.auth,privacyAccepted:true,marketing:Boolean(marketing)});
 }catch(error){if(isNew)await subscription.unsubscribe().catch(()=>{});throw error;}
 return true;
}
export async function optOutCardPush(token){let endpoint=null;
 if('serviceWorker' in navigator){const reg=await navigator.serviceWorker.getRegistration('/loyalty-card/index.html');const sub=reg?.scope.endsWith('/loyalty-card/')&&await reg.pushManager.getSubscription();if(sub){endpoint=sub.endpoint;await sub.unsubscribe();}}
 return cardApi('unsubscribe',{token,endpoint});
}
