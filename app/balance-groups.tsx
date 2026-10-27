import {balanceGroups} from '../lib/booking-summary.mjs';
import type {InvoiceDocument} from './invoice-sheet';

export function BalanceGroups({rows,today,onOpen,onEdit}:{rows:InvoiceDocument[];today:string;onOpen:(row:InvoiceDocument)=>void;onEdit:(row:InvoiceDocument)=>void}){
 const groups=balanceGroups(rows,today);
 const money=(n:number)=>new Intl.NumberFormat('ar-SA',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n/100)+' ر.س';
 return <div className="balance-groups">
  <div className="balance-group-summary">{groups.map(group=><div key={group.key}><span>{group.label}</span><strong>{money(group.total)}</strong><small>{group.rows.length} فواتير</small></div>)}</div>
  {groups.filter(group=>group.rows.length>0).map(group=><section key={group.key} className={'balance-group balance-group-'+group.key}>
   <h3>{group.label}<span>{money(group.total)}</span></h3>
   <div className="balances-list">{group.rows.map((b:InvoiceDocument)=><article className="balance-card" key={b.id}>
    <div className="balance-card-head"><div><h3>{b.customer||'بدون اسم عميل'}</h3><p>فاتورة {b.invoice} · {b.occasion||'بدون مناسبة'} · {b.date||'بدون تاريخ محدد'}</p></div><span className={'badge '+b.status}>{b.status==='cancelled'?'ملغى':'مؤكد'}</span></div>
    <div className="balance-breakdown"><span>الإجمالي <b>{money(b.price)}</b></span><span>المدفوع <b>{money(b.paid)}</b></span><span className="balance-due">المتبقي عليه <strong>{money(b.price-b.paid)}</strong></span></div>
    <div className="balance-card-actions"><button onClick={()=>onOpen(b)}>تفاصيل الحجز والفاتورة</button><button onClick={()=>onEdit(b)}>تحديث الدفعات</button></div>
   </article>)}</div>
  </section>)}
 </div>;
}
