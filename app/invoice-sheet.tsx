import {totals,timeRange} from '../lib/invoice-values.mjs';
export type InvoiceItem={item:string;description:string;amount:number;quantity?:number;unitPrice?:number;showPrice?:boolean};
export type InvoiceDocument={endTime?:string;discountRate?:number;basePrice?:number|null;invoiceGroup?:string;documentType?:string;quoteNumber?:string;mode?:string;items?:string;taxRate?:number;id:string;invoice:string;customer:string;phone:string;occasion:string;date:string;time:string;place:string;price:number;paid:number;notes:string;status:string;createdAt:string};
const hasText=(value:string|undefined)=>!!value?.trim();
const amount=(value:number)=>'SAR '+(value/100).toFixed(2);

export function InvoiceSheet({invoice,items,quantityLabel,cancellationNote}:{invoice:InvoiceDocument;items:InvoiceItem[];quantityLabel:(name:string,quantity:number)=>string;cancellationNote:string}){
 const quote=invoice.documentType==='quote';
 const food=invoice.mode==='food';
 const hasPrices=food||items.some(item=>item.showPrice===true);
 const hasDescriptions=food||items.some(item=>hasText(item.description));
 const {net,tax,discount}=totals(invoice.basePrice??invoice.price,invoice.discountRate||0,invoice.taxRate||0);
 return <div className="invoice-sheet royal-invoice">
  <div className="royal-strip">ضيافة القهوة الملكية للحفلات</div>
  <div className="invoice-brand"><img className="royal-logo" src="/royal-coffee-logo.png" alt="شعار القهوة الملكية" width="180" height="180"/><h2 className="document-title">{quote?'عرض سعر':'فاتورة'}</h2></div>
  <div className="invoice-watermark" aria-hidden="true"><img src="/royal-coffee-logo.png" alt="" width="420" height="420"/></div>
  <div className="invoice-meta">
   <span>{quote?'رقم عرض السعر':'رقم الفاتورة'}: <b dir="ltr">{invoice.invoice}</b></span>
   {hasText(invoice.customer)&&<span>العميل: {invoice.customer}</span>}
   {hasText(invoice.phone)&&<span>رقم الجوال: <b dir="ltr">{invoice.phone}</b></span>}
   {hasText(invoice.createdAt)&&<span>تاريخ الإصدار: {new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Riyadh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(invoice.createdAt))}</span>}
   {hasText(invoice.occasion)&&<span>المناسبة: {invoice.occasion}</span>}
   {hasText(invoice.date)&&<span>موعد المناسبة: {invoice.date}{hasText(invoice.time)?' — '+timeRange(invoice.time,invoice.endTime):''}</span>}
   {!hasText(invoice.date)&&hasText(invoice.time)&&<span>الوقت: {timeRange(invoice.time,invoice.endTime)}</span>}
   {hasText(invoice.place)&&<span>المكان: {invoice.place}</span>}
   {!quote&&hasText(invoice.quoteNumber)&&<span>عرض السعر السابق: <b dir="ltr">{invoice.quoteNumber}</b></span>}
  </div>
  {items.length>0&&<table className={'royal-table '+(food?'food-invoice-table':'')}>
   <thead><tr><th>الصنف</th>{hasDescriptions&&<th>الوصف</th>}{hasPrices&&<th>السعر</th>}</tr></thead>
   <tbody>{items.map((item,index)=><tr key={index}>
    <td>{food?'مأكولات':item.item}</td>
    {hasDescriptions&&<td>{food?`${quantityLabel(item.item,item.quantity||1)} ${item.item}${hasText(item.description)?' — '+item.description:''}`:hasText(item.description)?item.description:null}</td>}
    {hasPrices&&<td dir="ltr">{food||item.showPrice===true?amount(item.amount):null}</td>}
   </tr>)}</tbody>
  </table>}
  <div className="invoice-totals royal-totals">
   <>{discount>0&&<><div>الإجمالي قبل الخصم:<strong dir="ltr">{amount(invoice.basePrice??invoice.price)}</strong></div><div>الخصم ({invoice.discountRate}٪):<strong dir="ltr">− {amount(discount)}</strong></div></>}</><div>المجموع{invoice.taxRate?' قبل الضريبة':''}:<strong dir="ltr">{amount(net)}</strong></div>
   {!!invoice.taxRate&&<><div>الضريبة ({invoice.taxRate}٪):<strong dir="ltr">{amount(tax)}</strong></div><div>الإجمالي بعد الضريبة:<strong dir="ltr">{amount(invoice.price)}</strong></div></>}
   {!quote&&invoice.paid>0&&<div>الدفعة المستلمة:<strong dir="ltr">{amount(invoice.paid)}</strong></div>}
   {!quote&&<div className="balance">المتبقي:<strong dir="ltr">{amount(invoice.price-invoice.paid)}</strong></div>}
  </div>
  {hasText(invoice.notes)&&<div className="invoice-notes"><b>ملاحظات</b><p>{invoice.notes}</p></div>}
  {!quote&&<p className="cancellation-note"><b>ملاحظة:</b> {cancellationNote}</p>}
  <div className="royal-footer">للتواصل: <span dir="ltr">0536895975</span><small>{quote?'عرض سعر':invoice.status==='cancelled'?'حجز ملغى':invoice.status==='completed'?'مناسبة مكتملة':'حجز مؤكد'} · شكرًا لاختياركم القهوة الملكية</small></div>
 </div>;
}
