'use client';
import {useRef,useState} from 'react';
import type {InvoiceDocument as Invoice} from './invoice-sheet';
import {foodStatement,isFoodInvoice,monthInvoices} from '../lib/food-months.mjs';
const money=(n:number)=>new Intl.NumberFormat('ar-SA',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n/100)+' ر.س';
const monthTitle=(month:string)=>new Intl.DateTimeFormat('ar-SA-u-ca-gregory',{month:'long',year:'numeric'}).format(new Date(month+'-01T12:00:00+03:00'));
type Props={rows:Invoice[];loading:boolean;onCreate:(date:string)=>void;onOpen:(invoice:Invoice)=>void};
export function FoodMonths({rows,loading,onCreate,onOpen}:Props){
 const now=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Riyadh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const [month,setMonth]=useState(now.slice(0,7)),[includeCancelled,setIncludeCancelled]=useState(false),[selected,setSelected]=useState<string[]>([]),[busy,setBusy]=useState(false),[progress,setProgress]=useState(''),[error,setError]=useState('');
 const exportLock=useRef(false);
 const validMonth=/^\d{4}-(0[1-9]|1[0-2])$/.test(month)&&Number(month.slice(0,4))>0;
 const invoices=validMonth?monthInvoices(rows,month,includeCancelled) as Invoice[]:[];
 const summary=foodStatement(invoices),chosen=invoices.filter(row=>selected.includes(row.id));
 const months=Array.from(new Set([now.slice(0,7),...rows.filter(isFoodInvoice).map(row=>row.date?.slice(0,7)).filter(Boolean)])).sort().reverse();
 const undated=rows.filter(row=>isFoodInvoice(row)&&!row.date).length;
 function changeMonth(value:string){setMonth(value);setSelected([]);setError('')}
 async function exportFiles(kind:'all'|'zip'|'selected'){
  if(exportLock.current||loading)return;
  const snapshot=kind==='selected'?chosen:invoices;if(!snapshot.length)return;
  exportLock.current=true;setBusy(true);setError('');setProgress('جاري تجهيز الملفات…');
  try{
   const {exportFoodMonth}=await import('./food-month-export');
   await exportFoodMonth(snapshot,month,kind,setProgress);
  }catch(e){setError(e instanceof Error?e.message:'تعذر تجهيز الملفات. حاول مرة أخرى.')}
  finally{exportLock.current=false;setBusy(false);setProgress('')}
 }
 return <section className="food-months" aria-labelledby="food-months-title" aria-busy={busy}>
  <div className="food-months-heading"><div><h2 id="food-months-title">ملف فواتير المأكولات الشهري</h2><p>اختر شهرًا وابدأ إضافة فواتيره. تحفظ الفواتير في النظام وتظهر هنا تلقائيًا حسب تاريخ المناسبة.</p></div><label>الشهر<input type="month" required value={month} disabled={busy} onChange={e=>changeMonth(e.target.value)}/></label></div>
  <div className="food-month-links" aria-label="الشهور المحفوظة">{months.map(value=><button key={value} disabled={busy} aria-pressed={month===value} className={month===value?'chosen':''} onClick={()=>changeMonth(value)}>{monthTitle(value)}</button>)}</div>
  {validMonth?<><div className="food-month-stats"><strong>{monthTitle(month)}</strong><span>{invoices.length} فاتورة</span><span>{summary.workDays} أيام عمل</span><span>الإجمالي: {money(summary.price)}</span></div>
  <label className="food-month-cancelled"><input type="checkbox" checked={includeCancelled} disabled={busy} onChange={e=>{setIncludeCancelled(e.target.checked);setSelected([])}}/>تضمين الفواتير الملغاة في القائمة والتحميل والبيان</label>
  <div className="food-month-actions"><button className="primary" disabled={busy||loading} onClick={()=>onCreate(month===now.slice(0,7)?now:month+'-01')}>إضافة فاتورة إلى {monthTitle(month)}</button><button disabled={busy||loading||!invoices.length} onClick={()=>exportFiles('all')}>تحميل جماعي PDF + بيان</button><button disabled={busy||loading||!invoices.length} onClick={()=>exportFiles('zip')}>تحميل ZIP حسب اليوم + بيان</button><button disabled={busy||loading||!chosen.length} onClick={()=>exportFiles('selected')}>تحميل المحدد فقط ({chosen.length}) بدون بيان</button></div>
  <p className="muted">التحميل الجماعي: الفواتير كلها ثم البيان الشهري. ZIP: ملف واحد لكل يوم، والبيان في نهاية ملف آخر يوم. التحميل الاختياري لا يحتوي بيانًا ولا يضيف فواتير أخرى من ملف العميل.</p>
  {busy&&<p role="status" aria-live="polite">{progress} — انتظر حتى يكتمل التحميل ولا تغلق الصفحة.</p>}{error&&<p className="error" role="alert">{error}</p>}
  {loading?<p role="status">جاري تحميل الفواتير المحفوظة…</p>:invoices.length?<><label className="food-month-select-all"><input type="checkbox" disabled={busy} checked={chosen.length===invoices.length} onChange={e=>setSelected(e.target.checked?invoices.map(row=>row.id):[])}/>تحديد كل فواتير هذا الشهر</label><div className="food-month-list">{invoices.map((row,index)=><article key={row.id} className="food-month-row"><label><input type="checkbox" disabled={busy} checked={selected.includes(row.id)} aria-label={'تحديد فاتورة '+row.invoice} onChange={e=>setSelected(e.target.checked?[...selected,row.id]:selected.filter(id=>id!==row.id))}/><b>{index+1}</b></label><div><strong>فاتورة {row.invoice} · {row.customer||'بدون اسم عميل'}</strong><p>{row.date} · {row.place||'بدون مكان'}{row.status==='cancelled'?' · ملغاة':''}</p></div><strong>{money(row.price)}</strong><button disabled={busy} onClick={()=>onOpen(row)}>عرض / تعديل</button></article>)}</div></>:<p className="food-month-empty">لا توجد فواتير مأكولات لهذا الشهر. اضغط «إضافة فاتورة» لبدء تجميعها.</p>}</>:<p role="alert">اختر شهرًا صحيحًا لعرض فواتيره.</p>}
  {undated>0&&<p className="warning">يوجد {undated} فاتورة مأكولات بدون تاريخ؛ لن تدخل في أي ملف شهري حتى تحدد تاريخها من قائمة الفواتير.</p>}
 </section>;
}
