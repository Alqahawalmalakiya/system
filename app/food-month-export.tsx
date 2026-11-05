'use client';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import type {ReactNode} from 'react';
import {InvoiceSheet,type InvoiceDocument as Invoice} from './invoice-sheet';
import {createInvoicePdf} from './invoice-pdf';
import {downloadPdfFile} from '../lib/pdf-share.mjs';
import {foodStatement,invoiceItems,invoicesByDay,isWeightFood} from '../lib/food-months.mjs';
import {makeZip} from '../lib/zip-download.mjs';
const number=(n:number)=>new Intl.NumberFormat('ar-SA',{maximumFractionDigits:6}).format(n);
const money=(n:number)=>number(n/100)+' ر.س';
const quantityLabel=(name:string,q:number)=>isWeightFood(name)?number(q)+' كيلو':number(q);
function Statement({rows,month,catalog}:{rows:Invoice[];month:string;catalog:{name:string}[]}){
 const summary=foodStatement(rows,catalog);
 return <section className="royal-invoice invoice-sheet food-statement" dir="rtl"><div className="royal-strip">القهوة الملكية · البيان الشهري للمأكولات</div><div className="invoice-brand"><img className="royal-logo" src="/royal-coffee-logo.png" alt="" width="140" height="140"/><h2>بيان {new Intl.DateTimeFormat('ar-SA-u-ca-gregory',{month:'long',year:'numeric'}).format(new Date(month+'-01T12:00:00+03:00'))}</h2></div>
 <h3>إجمالي الأصناف والكميات</h3><table className="royal-table"><thead><tr><th>الصنف</th><th>الكمية</th><th>الوحدة</th></tr></thead><tbody>{summary.items.map(item=><tr key={item.name+'|'+item.unit}><td>{item.name}</td><td>{number(item.quantity)}</td><td>{item.unit}</td></tr>)}</tbody></table>
 <table className="royal-table"><thead><tr><th>اليوم</th><th>عدد أيام العمل</th></tr></thead><tbody>{summary.weekdays.map(day=><tr key={day.name}><td>{day.name}</td><td>{number(day.count)}</td></tr>)}</tbody></table>
 <div className="royal-totals"><div>السعر بدون الضريبة: <b>{money(summary.net)}</b></div><div>الضريبة: <b>{money(summary.tax)}</b></div><div>الإجمالي مع الضريبة: <b>{money(summary.price)}</b></div></div></section>;
}
export async function exportFoodMonth(rows:Invoice[],month:string,kind:'all'|'zip'|'selected',onProgress:(text:string)=>void,catalog:{name:string}[]=[]){
 if(!rows.length)throw Error('لا توجد فواتير للتحميل');
 const host=document.createElement('div');host.dir='rtl';host.style.cssText='position:fixed;left:-12000px;top:0;width:794px;pointer-events:none;background:white;';host.setAttribute('aria-hidden','true');document.body.appendChild(host);
 const root=createRoot(host);let done=0;
 async function append(content:ReactNode,pdf?:import('jspdf').jsPDF){
  flushSync(()=>root.render(content));
  const sheet=host.querySelector<HTMLElement>('.invoice-sheet');if(!sheet)throw Error('تعذر عرض الفاتورة');
  return createInvoicePdf(sheet,month,pdf);
 }
 async function build(invoices:Invoice[],withStatement:boolean){
  let pdf:import('jspdf').jsPDF|undefined;
  for(const row of invoices){onProgress('تجهيز الفاتورة '+(++done)+' من '+rows.length);pdf=await append(<InvoiceSheet invoice={row} items={invoiceItems(row)} quantityLabel={quantityLabel} cancellationNote="في حال إلغاء المناسبة، لا يُسترجع المبلغ المدفوع."/>,pdf);await new Promise(resolve=>setTimeout(resolve,0))}
  if(withStatement){onProgress('تجهيز البيان الشهري…');pdf=await append(<Statement rows={rows} month={month} catalog={catalog}/>,pdf)}
  if(!pdf)throw Error('تعذر تجهيز الفواتير');return pdf.output('blob');
 }
 try{
  if(kind==='zip'){
   const days=invoicesByDay(rows),files:{name:string;blob:Blob}[]=[];
   for(let i=0;i<days.length;i++)files.push({name:days[i].date+'.pdf',blob:await build(days[i].invoices,i===days.length-1)});
   onProgress('تجميع ملفات الأيام في ZIP…');const zip=await makeZip(files);
   downloadPdfFile(new File([zip],'القهوة-الملكية-مأكولات-'+month+'.zip',{type:'application/zip'}));
  }else{
   const blob=await build(rows,kind==='all');
   const file=new File([blob],'القهوة-الملكية-'+month+(kind==='selected'?'-فواتير-مختارة':'-جميع-الفواتير-والبيان')+'.pdf',{type:'application/pdf'});
   downloadPdfFile(file);
   if(kind==='selected')return file;
  }
 }finally{root.unmount();host.remove()}
}
