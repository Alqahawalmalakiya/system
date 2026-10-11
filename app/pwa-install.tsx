'use client';
import {useEffect,useState} from 'react';

const installedVersion=process.env.ROYAL_APP_VERSION||'development';
function isEditing(){
 return Boolean(document.querySelector('[role="dialog"]')||
  Array.from(document.querySelectorAll<HTMLInputElement>('.catalog-form input')).some(input=>input.value.trim())||
  (document.activeElement&&['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)));
}
export function PwaInstall(){
 const [updateReady,setUpdateReady]=useState(false);
 useEffect(()=>{
  let stopped=false,checking=false;
  let registration:ServiceWorkerRegistration|undefined;
  if('serviceWorker' in navigator){
   navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).then(value=>{
    if(stopped)return;registration=value;void value.update().catch(()=>{});
   }).catch(()=>{});
  }
  const preventAutomaticPrompt=(event:Event)=>event.preventDefault();
  window.addEventListener('beforeinstallprompt',preventAutomaticPrompt);
  async function checkVersion(){
   if(stopped||checking||document.visibilityState==='hidden'||!navigator.onLine)return;
   checking=true;
   try{
    void registration?.update().catch(()=>{});
    const response=await fetch('/api/app-version',{cache:'no-store'});
    if(!response.ok)return;
    const data=await response.json() as {version?:string};
    if(stopped||typeof data.version!=='string'||data.version==='development'||data.version===installedVersion)return;
    setUpdateReady(true);
    if(!isEditing())window.location.reload();
   }catch{
    // An offline or failed version check must never interrupt the invoice.
   }finally{checking=false}
  }
  const resume=()=>{void checkVersion()};
  window.addEventListener('focus',resume);
  document.addEventListener('visibilitychange',resume);
  const interval=window.setInterval(resume,60000);
  resume();
  return()=>{
   stopped=true;window.clearInterval(interval);
   window.removeEventListener('beforeinstallprompt',preventAutomaticPrompt);
   window.removeEventListener('focus',resume);
   document.removeEventListener('visibilitychange',resume);
  };
 },[]);
 if(!updateReady)return null;
 return <div className="no-print" role="status" style={{position:'fixed',top:8,left:12,right:12,maxWidth:440,margin:'auto',padding:12,zIndex:95,background:'#fffaf2',border:'1px solid #dbc8a9',borderRadius:10,fontSize:13}}>
  تحديث جديد جاهز. احفظ تعديلاتك وأغلق الفاتورة لتطبيقه تلقائيًا.
  <button type="button" style={{marginRight:12,textDecoration:'underline'}} onClick={()=>{if(!isEditing())window.location.reload()}}>تحديث الآن</button>
 </div>;
}
