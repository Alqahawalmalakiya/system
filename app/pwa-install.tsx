'use client';
import {useEffect,useState} from 'react';

type InstallPrompt=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>};
export function PwaInstall(){
 const [prompt,setPrompt]=useState<InstallPrompt|null>(null);
 const [ios,setIos]=useState(false);
 const [hidden,setHidden]=useState(false);
 const [busy,setBusy]=useState(false);
 useEffect(()=>{
  if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).catch(()=>{});
  const standalone=window.matchMedia('(display-mode: standalone)').matches||(navigator as Navigator&{standalone?:boolean}).standalone;
  if(standalone){setHidden(true);return}
  setIos(/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1));
  const before=(event:Event)=>{event.preventDefault();setPrompt(event as InstallPrompt)};
  const installed=()=>{setHidden(true);setPrompt(null)};
  window.addEventListener('beforeinstallprompt',before);window.addEventListener('appinstalled',installed);
  return()=>{window.removeEventListener('beforeinstallprompt',before);window.removeEventListener('appinstalled',installed)};
 },[]);
 async function install(){
  if(!prompt||busy)return;setBusy(true);
  try{await prompt.prompt();const choice=await prompt.userChoice;if(choice.outcome==='accepted')setHidden(true);setPrompt(null)}catch{setPrompt(null)}finally{setBusy(false)}
 }
 if(hidden||(!prompt&&!ios))return null;
 return <aside role="region" aria-label="تثبيت القهوة الملكية" className="no-print" style={{position:'fixed',inset:'auto 12px 12px',width:'auto',maxWidth:440,margin:'0 auto',padding:16,zIndex:90,background:'#fffaf2',border:'1px solid #dbc8a9',borderRadius:14,boxShadow:'0 5px 25px #0002',display:'block'}}>
  <div style={{display:'flex',alignItems:'center',gap:12}}>
   <img src="/icons/icon-192.png" width="48" height="48" alt="شعار القهوة الملكية" style={{borderRadius:10}}/>
   <div style={{flex:1}}><strong>ثبّت القهوة الملكية على جوالك</strong><p style={{fontSize:12,lineHeight:1.8,marginTop:4}}>{ios?'افتح في Safari، واضغط مشاركة ثم «إضافة إلى الشاشة الرئيسية».':'يفتح النظام بأيقونته مثل تطبيق مستقل.'}</p></div>
   <button type="button" onClick={()=>setHidden(true)} aria-label="إخفاء تعليمات التثبيت" style={{fontSize:24,padding:4}}>×</button>
  </div>
  {prompt&&<button type="button" className="primary" disabled={busy} onClick={install} style={{marginTop:12,width:'100%'}}>{busy?'جاري التثبيت…':'تثبيت التطبيق'}</button>}
 </aside>;
}
