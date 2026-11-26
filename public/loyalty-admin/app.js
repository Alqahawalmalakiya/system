import {config,configured,currentSession,loginAdmin,logout,rpc} from './api.js';
import {membershipQrSvg} from './qr.js';
import {whatsappShareUrl,cardWelcomeMessage} from './whatsapp.js';
const root=document.querySelector('#app'),toastNode=document.querySelector('#toast');
const state={screen:'admin-login',role:null,data:null,card:null,cardToken:'',busy:false,adminTab:'customers',search:'',currentCustomer:null,installPrompt:null,previous:'admin-login'};
const escapeHtml=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=x=>new Intl.NumberFormat('ar-SA').format(Number(x||0));
const date=x=>x?new Intl.DateTimeFormat('ar-SA',{timeZone:'Asia/Riyadh',year:'numeric',month:'short',day:'numeric'}).format(new Date(x)):'—';
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Riyadh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
const progressState=(progress,threshold,availableRewards=0)=>{const p=Number(progress||0),t=Math.max(1,Number(threshold||6)),a=Number(availableRewards||0);const ready=a>0 && p===0;return {progress:ready?t:p,remaining:ready?0:Math.max(t-p,0),ready};};
const brand=()=>`<div class="identity"><img class="brand-logo" src="./assets/logo-mark.png" alt="${escapeHtml(state.card?.business_name||state.data?.settings?.name||config.BUSINESS_NAME)}"><div><strong>${escapeHtml(state.card?.business_name||state.data?.settings?.name||config.BUSINESS_NAME)}</strong><small>بطاقة مناسباتك وهدية ضيافتك</small></div></div>`;
const header=(admin=false)=>`<header class="topbar"><div class="container top-inner">${brand()}${admin?'<button class="btn secondary small" data-action="logout">خروج</button>':''}</div></header>`;
const note=(msg)=>`<div class="info-box">${escapeHtml(msg)}</div>`;
const empty=(msg)=>`<p class="empty">${escapeHtml(msg)}</p>`;
function toast(message,error=false){toastNode.textContent=String(message);toastNode.className=`toast${error?' error':''}`;toastNode.hidden=false;clearTimeout(toast.timer);toast.timer=setTimeout(()=>toastNode.hidden=true,4600);}
function showError(error){console.error(error);toast(error?.message||'حصل خطأ، حاول مرة أخرى.',true);}
function render(){
 if(state.screen==='admin-login')return loginView();
 if(state.screen==='admin')return adminView();


}
function loginView(){root.innerHTML=`<div class="app-shell">${header()}<main class="auth-wrap"><section class="auth-card"><span class="pill">إدارة خاصة</span><h1>إدارة بطاقات الضيافة</h1><p>من هنا تضيف العملاء والمناسبات والنقاط وترسل بطاقاتهم. العميل يدخل على بطاقته مباشرة من رمز QR الخاص به.</p><form id="admin-login-form"><div class="field"><label for="admin-email">البريد الإلكتروني</label><input id="admin-email" name="email" type="email" autocomplete="username" required></div><div class="field"><label for="admin-password">كلمة المرور</label><input id="admin-password" name="password" type="password" autocomplete="current-password" required></div><button class="btn wide" type="submit">دخول الإدارة</button></form><p class="fineprint">هذه الصفحة للإدارة فقط. روابط بطاقات العملاء خاصة ولا تحتاج تسجيل دخول.</p></section></main></div>`;}
function adminView(){const d=state.data||{},stats=d.stats||{};root.innerHTML=`<div class="app-shell">${header(true)}<main class="container"><section class="section-head"><div><span class="pill">لوحة الإدارة من جوالك</span><h1>مرحبًا بك في إدارة الضيافة</h1><p>أضف عميلًا، سجّل مناسبته، وأرسل له بطاقته برابط أو QR.</p></div><button class="btn secondary small" data-action="refresh">تحديث ↻</button></section><div class="stats"><div class="stat"><span>العملاء</span><strong>${num(stats.customers)}</strong></div><div class="stat"><span>المناسبات</span><strong>${num(stats.events)}</strong></div><div class="stat"><span>هدايا جاهزة</span><strong>${num(stats.available)}</strong></div><div class="stat"><span>هدايا مستبدلة</span><strong>${num(stats.redeemed)}</strong></div></div><nav class="admin-nav" aria-label="أقسام الإدارة"><button data-action="admin-tab" data-tab="customers" class="${state.adminTab==='customers'?'active':''}">العملاء والمناسبات</button><button data-action="admin-tab" data-tab="rewards" class="${state.adminTab==='rewards'?'active':''}">الهدايا</button><button data-action="admin-tab" data-tab="notifications" class="${state.adminTab==='notifications'?'active':''}">الإشعارات</button><button data-action="admin-tab" data-tab="settings" class="${state.adminTab==='settings'?'active':''}">الإعدادات</button></nav>${state.adminTab==='customers'?customersView(d):state.adminTab==='rewards'?rewardsView(d):state.adminTab==='notifications'?notificationsView(d):settingsView(d.settings||{})}</main></div>`;}
function customersView(d){const customers=(d.customers||[]).filter(c=>String(c.name).toLowerCase().includes(state.search.toLowerCase())||String(c.member_code).toLowerCase().includes(state.search.toLowerCase())||String(c.contact||'').includes(state.search));
 return `<section class="panel"><div class="section-head" style="margin:0 0 16px"><div><h2>عملاؤك</h2><p>كل عميل له بطاقة مستقلة. النقاط لا يمكنه تعديلها.</p></div><button class="btn" data-action="new-customer">+ عميل جديد</button></div><input type="search" id="customer-search" placeholder="بحث بالاسم أو الجوال أو العضوية" value="${escapeHtml(state.search)}" aria-label="البحث عن عميل"><div class="customer-cards">${customers.map(c=>`<article class="customer-row"><div><strong>${escapeHtml(c.name)}</strong><small class="muted">${escapeHtml(c.contact||'بدون رقم جوال')}</small><small class="mono">${escapeHtml(c.member_code)}</small></div><div class="mini-progress"><strong>${num(progressState(c.progress,d.settings?.reward_threshold||6,c.available_rewards).progress)} / ${num(d.settings?.reward_threshold||6)}</strong><small>المناسبات: ${num(c.total_events)} · الهدايا: ${num(c.available_rewards)}</small></div><button class="btn small secondary" data-action="open-customer" data-id="${escapeHtml(c.id)}">إدارة البطاقة</button></article>`).join('')||empty('ما عندك عملاء بعد. اضغط «عميل جديد» لإنشاء أول بطاقة.')}</div></section>`;}
function rewardsView(d){return `<section class="panel"><h2>المكافآت</h2>${(d.rewards||[]).map(r=>`<div class="history-item"><div><strong>${escapeHtml(r.customer_name)} — ${escapeHtml(r.description)}</strong><small>${date(r.created_at)} · ${r.status==='available'?'جاهزة للاستلام':r.status==='redeemed'?'تم الاستبدال':'ملغاة'}</small></div>${r.status==='available'?`<button class="btn small" data-action="redeem" data-id="${escapeHtml(r.id)}">تسجيل الاستلام</button>`:''}</div>`).join('')||empty('لا توجد هدايا مستحقة بعد.')}</section>`;}
function notificationsView(d){
 const s=d.settings||{},st=d.notification_stats||{};
 const days=[['0','الأحد'],['1','الاثنين'],['2','الثلاثاء'],['3','الأربعاء'],['4','الخميس'],['5','الجمعة'],['6','السبت']];
 const selected=Number(s.weekly_weekday??4);
 return `<section class="two-col"><div class="panel"><h2>التذكير الأسبوعي للعملاء</h2>
 <p class="hint">حدد اليوم والوقت وغيّر نص الرسالة وقت ما تحب. تصل كتذكير بالحجز للعملاء الذين وافقوا على الإشعارات.</p>
 <form id="weekly-reminder-form">
 <div class="form-grid"><div class="field"><label>يوم الإرسال</label><select name="weekday" required>${days.map(([v,l])=>`<option value="${v}" ${Number(v)===selected?'selected':''}>${l}</option>`).join('')}</select></div>
 <div class="field"><label>وقت الإرسال (توقيت السعودية)</label><input name="time" type="time" required value="${escapeHtml(s.weekly_time||'17:00')}"></div></div>
 <div class="field"><label>عنوان التذكير</label><input name="title" maxlength="90" required value="${escapeHtml(s.reminder_title||'☕ عندكم جمعة أو مناسبة؟')}"></div>
 <div class="field"><label>رسالة التذكير</label><textarea name="body" rows="4" maxlength="240" required>${escapeHtml(s.reminder_body||'جهزوا جمعتكم على كيفكم، وضيافتها علينا. احجزوا مع القهوة الملكية!')}</textarea></div>
 <button class="btn wide" type="submit">حفظ التذكير الأسبوعي</button></form>
 <p class="fineprint">يرسل النظام مرة واحدة أسبوعيًا لكل عميل مشترك، وليس كل خمس دقائق. التوقيت حسب آسيا/الرياض وقد يتأخر التسليم بحسب الهاتف والشبكة.</p></div>
 <div class="panel"><h2>حالة الإشعارات</h2><p>إشعارات الحجوزات فقط، مع موافقة العميل.</p><div class="status-line"><span>بالانتظار</span><strong>${num(st.queued)}</strong></div><div class="status-line"><span>قبلتها خدمة الإشعارات</span><strong>${num(st.provider_accepted)}</strong></div><div class="status-line"><span>فشلت</span><strong>${num(st.provider_failed)}</strong></div><p class="fineprint">تغيير إعدادات الأسبوع لا يرسل أي رسالة فورًا.</p></div></section>`;
}
function settingsView(s){return `<section class="panel" style="max-width:680px"><h2>إعدادات الضيافة</h2><form id="settings-form"><div class="field"><label>اسم النشاط</label><input name="name" required maxlength="100" value="${escapeHtml(s.name||'ضيافة القهوة الملكية')}"></div><div class="field"><label>عدد المناسبات للهدية</label><input name="reward_threshold" type="number" min="1" max="50" required value="${Number(s.reward_threshold||6)}"></div><div class="field"><label>تفاصيل الهدية</label><input name="reward_description" required maxlength="160" value="${escapeHtml(s.reward_description||'قهوتان مجانًا')}"></div><button class="btn" type="submit">حفظ الإعدادات</button></form><p class="hint">يوم إرسال التذكير ووقته ونصه تجدها في قسم «الإشعارات».</p></section>`;}
function modal(title,body,actions=''){document.querySelector('#modal-overlay')?.remove();const el=document.createElement('div');el.className='modal-backdrop';el.id='modal-overlay';el.innerHTML=`<div class="modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}"><h2>${escapeHtml(title)}</h2>${body}${actions?`<div class="modal-actions">${actions}</div>`:''}</div>`;document.body.appendChild(el);}
function closeModal(){document.querySelector('#modal-overlay')?.remove();}
function createCustomerModal(){modal('إنشاء بطاقة عميل جديد',`<form id="create-customer-form"><div class="field"><label>اسم العميل</label><input name="name" placeholder="اسم العميل" required minlength="2" maxlength="120"></div><div class="field"><label>رقم الجوال (اختياري، للإدارة فقط)</label><input name="contact" type="tel" dir="ltr" maxlength="140" placeholder="05xxxxxxxx"></div><div class="field"><label>عدد المناسبات السابقة</label><select name="initial_count">${Array.from({length:7},(_,i)=>`<option value="${i}">${num(i)}</option>`).join('')}</select></div><div class="form-grid"><div class="field"><label>تاريخ المناسبة (إذا أضفت نقاطًا)</label><input name="occurred_on" type="date" value="${today()}"></div><div class="field"><label>وصف المناسبة</label><input name="title" maxlength="150" value="مناسبة ضيافة"></div></div><div class="info-box">بعد الحفظ يظهر QR ورابط خاص ترسله للعميل. العميل يفتح بطاقته مباشرة بدون حساب أو كلمة مرور.</div><button class="btn wide" type="submit">إنشاء البطاقة والـ QR</button></form>`,`<button class="btn secondary" data-action="close-modal">إغلاق</button>`);}
function customerManageModal(c){state.currentCustomer=c;const d=state.data||{},events=(d.events||[]).filter(e=>e.customer_id===c.id),rewards=(d.rewards||[]).filter(r=>r.customer_id===c.id);
 modal(`بطاقة ${c.name}`,`<div class="status-line"><span class="mono">${escapeHtml(c.member_code)}</span><strong>${num(progressState(c.progress,d.settings?.reward_threshold||6,c.available_rewards).progress)} / ${num(d.settings?.reward_threshold||6)}</strong></div><p>إجمالي مناسباته: ${num(c.total_events)} · هداياه المتاحة: ${num(c.available_rewards)}</p><form id="add-stamp-form"><div class="form-grid"><div class="field"><label>كم مناسبة تضيف؟</label><select name="count">${[1,2,3,4,5,6].map(i=>`<option value="${i}">${num(i)}</option>`).join('')}</select></div><div class="field"><label>تاريخ المناسبة</label><input name="occurred_on" type="date" value="${today()}" required></div></div><div class="field"><label>اسم المناسبة</label><input name="title" value="مناسبة ضيافة" required maxlength="150"></div><button class="btn wide" type="submit">اعتماد النقاط</button></form><hr><p class="fineprint">لإعادة إرسال QR نحتاج إصدار رابط جديد؛ هذا يُبطل الرابط القديم على جهاز العميل.</p><button class="btn secondary wide" data-action="rotate-link" data-id="${escapeHtml(c.id)}">إصدار QR جديد</button><h3>آخر المناسبات</h3>${events.slice(0,12).map(e=>`<div class="history-item"><div><strong>${escapeHtml(e.title)}</strong><small>${date(e.occurred_on)} · ${e.status==='approved'?'معتمدة':'ملغاة'}</small></div>${e.status==='approved'?`<button class="btn danger small" data-action="reverse-event" data-id="${escapeHtml(e.id)}">إلغاء</button>`:''}</div>`).join('')||empty('لم تُسجل مناسبات بعد')}${rewards.filter(r=>r.status==='available').map(r=>`<div class="reward-banner"><strong>🎁 ${escapeHtml(r.description)}</strong><button class="btn small" data-action="redeem" data-id="${escapeHtml(r.id)}">استبدال</button></div>`).join('')}`,`<button class="btn danger" data-action="delete-customer" data-id="${escapeHtml(c.id)}" data-name="${escapeHtml(c.name)}">حذف العميل</button><button class="btn secondary" data-action="close-modal">إغلاق</button>`);}
function cardUrl(token){return location.origin+'/loyalty-card/index.html#card='+encodeURIComponent(token);}
function linkModal(token,customer){const url=cardUrl(token);let qr='';try{qr=membershipQrSvg(url);}catch(e){qr=`<p class="fineprint">تعذر عرض QR. يمكنك مشاركة رابط البطاقة مباشرة.</p>`;}
 const threshold=state.data?.settings?.reward_threshold||6;
 const message=cardWelcomeMessage(customer.name,url,threshold);
 const waLink=whatsappShareUrl({name:customer.name,cardLink:url,contact:customer.contact,rewardThreshold:threshold});
 modal(`بطاقة ${customer.name} جاهزة`,`<p>أرسل بطاقة الولاء مباشرة عبر واتساب. الرابط في الرسالة قابل للضغط ويفتح بطاقة العميل دون تسجيل دخول.</p><details class="wa-preview"><summary>عرض نص رسالة واتساب قبل الإرسال</summary><pre dir="auto">${escapeHtml(message)}</pre></details><div class="qr-display">${qr}<span>بطاقة خاصة باسم ${escapeHtml(customer.name)}</span></div><code class="secret-link">${escapeHtml(url)}</code><p class="fineprint">${customer.contact?'يفتح زر واتساب محادثة الرقم المسجل إن كان صالحًا.':'يمكنك اختيار العميل داخل واتساب.'} رابط البطاقة خاص، فلا تشاركه علنًا.</p>`,`<a class="btn whatsapp wide" href="${escapeHtml(waLink)}" target="_blank" rel="noopener noreferrer">مشاركة عبر واتساب</a><button class="btn secondary" data-action="copy-link" data-link="${escapeHtml(url)}">نسخ الرابط</button><button class="btn secondary" data-action="download-qr" data-link="${escapeHtml(url)}">حفظ QR</button><button class="btn secondary" data-action="close-modal">إغلاق</button>`);}
async function loadAdmin(){state.role='admin';state.data=await rpc('admin_dashboard');state.screen='admin';render();}
async function boot(){
 if(!configured()){root.innerHTML=`<div class="app-shell">${header()}<section class="setup"><h1>بطاقة الضيافة</h1><p>الربط بالخدمة لم يكتمل. راجع إعدادات ملف config.js.</p></section></div>`;return;}
 if(currentSession()){try{await loadAdmin();return;}catch(error){console.warn('Could not restore admin session',error);await logout();}}
 state.screen='admin-login';render();
}
async function onSubmit(event){const form=event.target;if(!form?.id)return;event.preventDefault();if(state.busy)return;state.busy=true;const button=form.querySelector('button[type=submit]');if(button)button.disabled=true;
 try{
  const values=new FormData(form);
  if(form.id==='admin-login-form'){await loginAdmin(String(values.get('email')).trim(),String(values.get('password')));await loadAdmin();toast('أهلًا بك في لوحة الإدارة.');}
  if(form.id==='create-customer-form'){
   const count=Number(values.get('initial_count'));
   const data=await rpc('admin_create_customer_card',{p_name:String(values.get('name')).trim(),p_contact:String(values.get('contact')).trim()||null,p_initial_count:count,p_occurred_on:count?String(values.get('occurred_on')):null,p_event_title:String(values.get('title')).trim()||'مناسبة ضيافة'});
   closeModal();await loadAdmin();linkModal(data.token,{...data.customer,contact:String(values.get('contact')||'').trim()});
  }
  if(form.id==='add-stamp-form'){
   const count=Number(values.get('count'));
   // Each button press has a fresh idempotency key. Requests are locked server-side.
   const result=await rpc('admin_grant_stamps',{p_customer_id:state.currentCustomer.id,p_count:count,p_title:String(values.get('title')).trim(),p_occurred_on:String(values.get('occurred_on')),p_request_id:crypto.randomUUID()});
   closeModal();await loadAdmin();toast(`تم اعتماد ${num(result.added)} نقطة.`);
  }
  if(form.id==='weekly-reminder-form'){
   await rpc('admin_save_weekly_reminder',{p_weekday:Number(values.get('weekday')),p_time:String(values.get('time')),p_title:String(values.get('title')).trim(),p_body:String(values.get('body')).trim()});
   await loadAdmin();state.adminTab='notifications';render();toast('تم حفظ التذكير الأسبوعي.');
  }
  if(form.id==='campaign-form'){
   const r=await rpc('admin_create_campaign',{p_title:String(values.get('title')).trim(),p_body:String(values.get('body')).trim()});await loadAdmin();toast(`تمت جدولة ${num(r.scheduled)} تذكير.`);
  }
  if(form.id==='settings-form'){
   await rpc('admin_update_settings',{p_name:String(values.get('name')).trim(),p_reward_threshold:Number(values.get('reward_threshold')),p_reward_description:String(values.get('reward_description')).trim(),p_weekly_weekday:Number(state.data?.settings?.weekly_weekday??4),p_weekly_time:String(state.data?.settings?.weekly_time||'17:00')});await loadAdmin();toast('تم حفظ الإعدادات.');
  }
 }catch(error){showError(error);}finally{state.busy=false;if(button?.isConnected)button.disabled=false;}
}
async function onClick(event){const el=event.target.closest('[data-action]');if(!el)return;const action=el.dataset.action;
 if(el.tagName==='A')event.preventDefault();
 try{
  if(action==='logout'){await logout();state.screen='admin-login';state.data=null;render();return;}
  if(action==='admin-tab'){state.adminTab=el.dataset.tab;render();return;}
  if(action==='refresh'){await loadAdmin();toast('تم تحديث البيانات.');return;}
  if(action==='new-customer'){createCustomerModal();return;}
  if(action==='open-customer'){const c=state.data?.customers?.find(x=>x.id===el.dataset.id);if(c)customerManageModal(c);return;}
  if(action==='close-modal'){closeModal();return;}
  if(action==='delete-customer'){
   const person=state.data?.customers?.find(c=>c.id===el.dataset.id);
   if(!person)throw Error('العميل غير موجود في قائمتك.');
   const check=prompt(`حذف بطاقة ${person.name} سيوقف الرابط وإشعارات الجوال ويزيله من قائمة العملاء. للتأكيد اكتب كلمة: حذف`);
   if(check!=='حذف')return;
   await rpc('admin_delete_customer',{p_customer_id:person.id});
   closeModal();state.currentCustomer=null;await loadAdmin();toast('تم حذف العميل وتعطيل رابط بطاقته.');return;
  }
  if(action==='rotate-link'){if(!confirm('إصدار رابط جديد سيعطّل الرابط القديم ويوقف إشعارات الأجهزة السابقة. تتابع؟'))return;const r=await rpc('admin_rotate_card_link',{p_customer_id:el.dataset.id});closeModal();linkModal(r.token,{...r.customer,contact:state.data?.customers?.find(c=>c.id===r.customer.id)?.contact||state.currentCustomer?.contact||''});return;}
  if(action==='copy-link'){await navigator.clipboard.writeText(el.dataset.link);toast('تم نسخ رابط البطاقة.');return;}
  if(action==='download-qr'){const svg=membershipQrSvg(el.dataset.link),blob=new Blob([svg],{type:'image/svg+xml'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='royal-coffee-card-qr.svg';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);return;}
  if(action==='reverse-event'){if(!confirm('هل تريد إلغاء نقطة هذه المناسبة؟'))return;await rpc('admin_reverse_event',{p_event_id:el.dataset.id});closeModal();await loadAdmin();toast('تم إلغاء النقطة وتحديث البطاقة.');return;}
  if(action==='redeem'){if(!confirm('هل استلم العميل هديته بالفعل؟ لا يمكن استبدالها مرتين.'))return;await rpc('admin_redeem_reward',{p_reward_id:el.dataset.id});closeModal();await loadAdmin();toast('تم استبدال الهدية.');return;}

 }catch(error){if(error?.name!=='AbortError')showError(error);}
}
document.addEventListener('submit',onSubmit);
document.addEventListener('click',onClick);
document.addEventListener('input',e=>{if(e.target.id==='customer-search'){state.search=e.target.value;const index=e.target.selectionStart;render();const next=document.querySelector('#customer-search');next?.focus();next?.setSelectionRange(index,index);}});
window.addEventListener('focus',()=>{if(state.screen==='admin')loadAdmin().catch(showError);});
boot().catch(showError);
