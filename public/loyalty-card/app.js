import {config,configured,currentCardToken,saveCardToken,fetchCard,subscribeCardPush,optOutCardPush,isStandalone} from './api.js';
import {membershipQrSvg} from '../loyalty-admin/qr.js';

const root=document.querySelector('#app'),toastNode=document.querySelector('#toast');
const state={screen:'admin-login',role:null,data:null,card:null,cardToken:'',busy:false,adminTab:'customers',search:'',currentCustomer:null,installPrompt:null,previous:'admin-login'};
const escapeHtml=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=x=>new Intl.NumberFormat('ar-SA').format(Number(x||0));
const date=x=>x?new Intl.DateTimeFormat('ar-SA',{timeZone:'Asia/Riyadh',year:'numeric',month:'short',day:'numeric'}).format(new Date(x)):'—';
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Riyadh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
const progressState=(progress,threshold,availableRewards=0)=>{const p=Number(progress||0),t=Math.max(1,Number(threshold||6)),a=Number(availableRewards||0);const ready=a>0 && p===0;return {progress:ready?t:p,remaining:ready?0:Math.max(t-p,0),ready};};
const brand=()=>`<div class="identity"><img class="brand-logo" src="/loyalty-admin/assets/logo-mark.png" alt="${escapeHtml(state.card?.business_name||state.data?.settings?.name||config.BUSINESS_NAME)}"><div><strong>${escapeHtml(state.card?.business_name||state.data?.settings?.name||config.BUSINESS_NAME)}</strong><small>بطاقة مناسباتك وهدية ضيافتك</small></div></div>`;
const header=(admin=false)=>`<header class="topbar"><div class="container top-inner">${brand()}${admin?'<button class="btn secondary small" data-action="logout">خروج</button>':''}</div></header>`;
const note=(msg)=>`<div class="info-box">${escapeHtml(msg)}</div>`;
const empty=(msg)=>`<p class="empty">${escapeHtml(msg)}</p>`;
function toast(message,error=false){toastNode.textContent=String(message);toastNode.className=`toast${error?' error':''}`;toastNode.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>toastNode.hidden=true,4600);}
function showError(error){console.error(error);toast(error?.message||'حصل خطأ، حاول مرة أخرى.',true);}
function render(){
 if(state.screen==='card')return cardView();
 if(state.screen==='privacy')return privacyView();
}
function customerCard(c){
 const threshold=Math.max(1,Number(c.threshold||6));
 const prog=progressState(c.progress,threshold,c.available_rewards);
 const ready=Number(c.available_rewards)>0;
 const cardLink=`${location.origin}/loyalty-card/index.html#card=${state.cardToken}`;
 let qr='';try{qr=membershipQrSvg(cardLink);}catch(err){console.warn('QR is unavailable',err);}
 // Original silhouette shaped after an actual traditional Arabian dallah: finial, domed lid, left handle, long upturned right spout.
 const dallahSvg=`<svg viewBox="0 0 110 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" class="dallah-icon">
  <path d="M42 54C32 43 18 43 14 54C10 66 20 83 39 89" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M67 58C75 42 88 32 106 34C91 38 87 45 82 55C78 62 75 67 73 73L67 58Z" fill="currentColor"/>
  <path d="M44 48H68C68 57 71 62 75 71C80 83 76 94 66 97C58 100 45 99 39 95C30 90 30 80 35 70C39 62 44 57 44 48Z" fill="currentColor"/>
  <path d="M55 4C52 9 51 13 54 17L53 20H58L57 17C61 13 59 9 55 4Z" fill="currentColor"/>
  <path d="M53 20H58L59 28H52L53 20Z" fill="currentColor"/>
  <path d="M52 27C51 33 46 37 42 40C39 43 38 46 38 49H74C74 45 72 42 68 39C62 35 60 32 59 27H52Z" fill="currentColor"/>
  <path d="M37 49H75V52H37Z" fill="currentColor"/>
  <path d="M39 48C35 43 34 40 33 36" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
  <path d="M42 58C48 56 61 56 68 58M40 85C47 91 62 92 69 86" fill="none" stroke="var(--dallah-detail, #f4dec1)" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>
</svg>`;
 const dallahs=Array.from({length:Math.min(threshold,12)},(_,i)=>`<span class="loyalty-dallah ${i<prog.progress?'stamped':''}" role="img" aria-label="المناسبة ${i+1} ${i<prog.progress?'مكتملة':'بانتظار الاعتماد'}">${dallahSvg}</span>`).join('');
 return `<article class="bank-loyalty-card" aria-label="بطاقة ضيافة القهوة الملكية">
   <div class="bank-card-top"><span class="bank-card-type">بطاقة الولاء <small>ROYAL COFFEE</small></span><span class="bank-membership">${num(prog.progress)} من ${num(threshold)}<small>مناسبات</small></span></div>
   <div class="bank-logo"><img src="/loyalty-admin/assets/logo-mark.png" alt="شعار القهوة الملكية"></div>
   <div class="bank-dallahs">${dallahs}</div>
   <div class="bank-reward ${ready?'claimed':''}"><div><small>${ready?'🎁 المكافأة':'الهدية القادمة'}</small><strong>${ready?'هديتك جاهزة!':escapeHtml(c.reward_description)}</strong></div><div><small>${ready?'جاهزة للاستلام':'المتبقي'}</small><strong>${ready?'مبروك':`${num(prog.remaining)} مناسبات`}</strong></div></div>
   <div class="bank-qr">${qr||'<span>رمز البطاقة</span>'}</div>
   <div class="bank-bottom"><span>${escapeHtml(c.name)}</span><small class="mono">${escapeHtml(c.member_code)}</small></div>
 </article>`;
}
function installPrompt(){if(isStandalone())return '';
 return `<section class="install-focus" aria-label="تثبيت بطاقة الضيافة"><span class="install-icon">📲</span><div><strong>ثبّت بطاقتك على هاتفك</strong><p>عشان ما تضيع بطاقتك وتقدر تتابع نقاطك وهديتك بسرعة.</p><button class="btn gold" data-action="install-now">${state.installPrompt?'تثبيت البطاقة':'تثبيت البطاقة'}</button></div></section>`;
}
function notificationsPrompt(c){
 if(!isStandalone())return '';
 if(!config.VAPID_PUBLIC_KEY)return `<section class="notify-simple"><p>🔔 تذكيرات الحجوزات قيد التجهيز.</p></section>`;
 return `<section class="notify-simple" aria-label="تفعيل تذكيرات الحجوزات"><div class="notify-simple-head">🔔 <strong>خلّنا نذكّرك بجمعتك</strong></div><p>توصلك رسالة من القهوة الملكية تذكرك بحجز ضيافة مناسباتك. مرة واحدة في الأسبوع حسب اليوم والوقت الذي تحدده إدارة القهوة الملكية.</p><small>بالضغط على «أوافق وأفعّل التذكيرات» أنت توافق على استقبال رسائل ترويجية للحجز وحفظ اشتراك الجهاز. <a href="#privacy" data-action="privacy">سياسة الخصوصية</a>.</small><div class="notify-actions"><button class="btn gold wide" data-action="enable-push">أوافق وأفعّل التذكيرات</button><button class="btn ghost small" data-action="disable-push">إيقاف التذكيرات</button></div></section>`;
}
function cardView(){
 if(!state.card){root.innerHTML=`<div class="app-shell"><main class="customer-layout"><section class="panel"><h1>بطاقتك في ضيافة القهوة الملكية</h1><p>هذه الأيقونة لم تحفظ بطاقة محددة بعد. احذفها، ثم افتح رابط بطاقتك من واتساب وثبّتها مرة واحدة من جديد؛ بعدها تفتح بطاقتك مباشرة من الأيقونة دائمًا.</p><p class="fineprint">إذا فقدت الرابط، اطلب من إدارة القهوة الملكية إعادة إرساله.</p></section></main></div>`;return;}
 const c=state.card;
 root.innerHTML=`<div class="app-shell"><main class="customer-layout bank-customer"><div class="customer-topline">القهوة الملكية <span>بطاقتك في ضيافتنا</span></div>${customerCard(c)}${!isStandalone()?`<section class="install-focus"><strong>ثبّت بطاقتك على جوالك</strong><p>عشان تفتحها بسهولة وتتابع نقاطك.</p><button class="btn gold wide" data-action="install-now">تثبيت البطاقة</button></section>`:''}${notificationsPrompt(c)}<div class="simple-footer"><span>إجمالي المناسبات: ${num(c.total_events)}</span><button data-action="refresh-card" class="btn ghost small">تحديث النقاط ↻</button></div></main></div>`;
 maybeInstallPrompt();maybePromptPush();
}
function privacyView(){root.innerHTML=`<div class="app-shell">${header()}<main class="container"><div class="panel privacy-page"><h1>سياسة خصوصية ضيافة القهوة الملكية (مسودة للمراجعة)</h1><p>نستخدم اسم العميل ورقم الجوال إذا قدمته الإدارة وسجل المناسبات والمكافآت لإدارة برنامج الولاء. يظهر رابط البطاقة الخاص الاسم والنقاط فقط، ولا يظهر رقم الهاتف. من يحصل على الرابط يستطيع رؤية البطاقة لذلك لا تشاركه علنًا.</p><h3>الإشعارات</h3><p>نطلب إذن إشعارات الجهاز بعد التثبيت وبناءً على ضغطك على زر التفعيل. التذكيرات والعروض تحتاج موافقة تسويقية منفصلة، ويمكن إيقافها في أي وقت. مجرد قبول خادم Push لا يعني ضمان وصول الإشعار إلى الهاتف.</p><h3>الحقوق وحماية البيانات</h3><p>يمكن طلب تصحيح أو إلغاء بيانات البطاقة من إدارة النشاط. يجب استكمال جهة التواصل، مدة الاحتفاظ، ومراجعة نقل البيانات خارج السعودية قبل الإطلاق التجاري النهائي وفق نظام حماية البيانات الشخصية.</p><button class="btn secondary" data-action="back">رجوع</button></div></main></div>`;}
function modal(title,body,actions=''){document.querySelector('#modal-overlay')?.remove();const el=document.createElement('div');el.className='modal-backdrop';el.id='modal-overlay';el.innerHTML=`<div class="modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}"><h2>${escapeHtml(title)}</h2>${body}${actions?`<div class="modal-actions">${actions}</div>`:''}</div>`;document.body.appendChild(el);}
function closeModal(){document.querySelector('#modal-overlay')?.remove();}
function installHowTo(){modal('تثبيت البطاقة على الهاتف',`<p>${isIOS()?'على iPhone: افتح رابط بطاقتك في Safari (وليس صفحة الموقع الرئيسية)، ثم اضغط مشاركة واختر «إضافة إلى الشاشة الرئيسية». بعد التثبيت تفتح الأيقونة بطاقتك مباشرة.':'على Android: افتح رابط بطاقتك ثم اضغط «تثبيت البطاقة» ووافق على التثبيت، لتفتح الأيقونة بطاقتك مباشرة لاحقًا.'}</p>`,`<button class="btn" data-action="close-modal">تمام</button>`);}
function maybeInstallPrompt(){if(isStandalone()||!state.card)return;const key=`royal-card-install-nudge:${state.cardToken||state.card?.member_code||''}`;if(sessionStorage.getItem(key)||document.querySelector('#modal-overlay'))return;sessionStorage.setItem(key,'1');modal('ثبّت بطاقتك على هاتفك',`<p>عشان ما تضيع بطاقتك وتقدر تتابع نقاطك وهديتك في أي وقت.</p>`,`<button class="btn gold" data-action="install-now">تثبيت البطاقة</button>`);}
function maybePromptPush(){
 if(!isStandalone()||!state.card||!config.VAPID_PUBLIC_KEY||!('Notification' in window))return;
 if(state.card.marketing_opt_in && Notification.permission==='granted')return;
 const key=`royal-card-push-consent-v6:${state.cardToken||state.card?.member_code||''}`;
 if(sessionStorage.getItem(key)||document.querySelector('#modal-overlay'))return;
 sessionStorage.setItem(key,'1');
 modal('🔔 خلّنا نذكّرك بجمعتك',`<p>توصلك رسائل تذكير بحجز ضيافتك؛ مرة أسبوعيًا حسب جدول إدارة القهوة الملكية.</p><p class="fineprint">بالضغط على السماح توافق على تذكيرات الحجز وحفظ اشتراك الإشعارات. تقدر توقفها متى ما تبغى.</p>`,`<button class="btn gold" data-action="enable-push">أوافق وأسمح بالتذكيرات</button>`);
}
async function loadCard(){if(!state.cardToken){state.card=null;state.screen='card';render();return;}try{state.card=await fetchCard(state.cardToken);}catch(error){state.card=null;showError(error);}state.screen='card';render();}
async function boot(){
 if(!configured()){root.innerHTML=`<div class="app-shell">${header()}<section class="setup"><h1>بطاقة الضيافة</h1><p>الربط بالخدمة لم يكتمل. راجع إعدادات ملف config.js.</p></section></div>`;return;}
 const hashToken=new URLSearchParams(location.hash.slice(1)).get('card');
 if(location.pathname.startsWith('/loyalty-card/') || (hashToken&&/^[a-f0-9]{64}$/.test(hashToken))){
  const fromLink=hashToken;
  if(fromLink&&/^[a-f0-9]{64}$/.test(fromLink)){state.cardToken=fromLink;saveCardToken(fromLink);}
  else state.cardToken=currentCardToken();
  if(state.cardToken)window.royalCardInstall?.apply(state.cardToken);
  await loadCard();return;
 }
}
async function onClick(event){const el=event.target.closest('[data-action]');if(!el)return;const action=el.dataset.action;
 if(el.tagName==='A')event.preventDefault();
 try{
  if(action==='close-modal'){closeModal();return;}
  if(action==='refresh-card'){await loadCard();toast('تم تحديث البطاقة.');return;}
  if(action==='forget-card'){if(!confirm('هل تريد حذف رابط البطاقة المحفوظ على هذا الجهاز؟'))return;saveCardToken(null);state.cardToken='';state.card=null;history.replaceState({},'', '/loyalty-card/');render();return;}
  if(action==='privacy'){state.previous=state.screen;state.screen='privacy';render();return;}
  if(action==='back'){state.screen=state.previous||'card';render();return;}
  if(action==='install-now'){
   if(!state.installPrompt){closeModal();installHowTo();return;}
   const p=state.installPrompt;state.installPrompt=null;closeModal();p.prompt();await p.userChoice;render();return;
  }
  if(action==='enable-push'){
   await subscribeCardPush(state.cardToken,true);closeModal();await loadCard();toast('تم تفعيل تذكيرات الحجوزات على جهازك.');return;
  }
  if(action==='disable-push'){if(!confirm('إيقاف إشعارات البطاقة لهذا الجهاز؟'))return;await optOutCardPush(state.cardToken);await loadCard();toast('تم إيقاف تذكيرات الحجوزات.');return;}
 }catch(error){if(error?.name!=='AbortError')showError(error);}
}
document.addEventListener('click',onClick);
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();state.installPrompt=event;if(state.screen==='card')render();});
window.addEventListener('appinstalled',()=>{state.installPrompt=null;if(state.screen==='card')render();});
window.addEventListener('focus',()=>{if(state.screen==='card'&&state.cardToken)loadCard().catch(console.warn);});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&state.screen==='card'&&state.cardToken)loadCard().catch(console.warn);});
setInterval(()=>{if(document.visibilityState==='visible'&&state.screen==='card'&&state.cardToken)loadCard().catch(console.warn);},15000);
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/loyalty-card/service-worker.js').catch(console.warn));
boot().catch(showError);