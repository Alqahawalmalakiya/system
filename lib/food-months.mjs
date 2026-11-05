import {foodOrder} from './food-catalog.mjs';
import {totals,validDate} from './invoice-values.mjs';
/** Monthly collections are derived from saved event dates, never local copies. */
export const isFoodInvoice=row=>row.mode==='food'&&row.documentType!=='quote';
export const isWeightFood=name=>['سمن','السمن','عسل','العسل'].includes(name.trim());
export function invoiceItems(row){
 try{const items=JSON.parse(row.items||'[]');return Array.isArray(items)?items:[]}catch{return []}
}
export function monthInvoices(rows,month,includeCancelled=false){
 return rows.filter(row=>isFoodInvoice(row)&&row.date?.slice(0,7)===month&&(includeCancelled||row.status!=='cancelled'))
  .sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'').localeCompare(b.time||'')||a.invoice.localeCompare(b.invoice,undefined,{numeric:true}));
}
export function invoicesByDay(rows){
 const days=new Map();
 for(const row of rows){const group=days.get(row.date)||[];group.push(row);days.set(row.date,group)}
 return [...days].sort(([a],[b])=>a.localeCompare(b)).map(([date,invoices])=>({date,invoices}));
}
const aliases=new Map([
 ['خبز الملة','خبز ملة'],['قرص خبز ملة كبير','خبز ملة'],['خبز المله','خبز ملة'],
 ['مفتوتة','مفتوت'],['مفتوته','مفتوت'],['مشغوث','مشغوثة'],['مشغوثه','مشغوثة'],
 ['جريش أحمر','جريش'],['جريش أبيض','جريش'],['جريش احمر','جريش'],['جريش ابيض','جريش'],
 ['عريكه','عريكة'],['عصيده','عصيدة'],['اصبع','مراصيع'],['أصبع','مراصيع'],['السمن','سمن'],['العسل','عسل']
]);
export function foodStatement(rows,catalog=[]){
 const items=new Map();let price=0,net=0;
 for(const row of rows){
  price+=row.price;net+=totals(row.price,0,row.taxRate||0).net;
  for(const item of invoiceItems(row)){
   const original=String(item.item||'').trim().replace(/\s+/g,' ');if(!original)continue;
   const name=aliases.get(original)||original,unit=isWeightFood(name)?'كيلو':'عدد';
   const quantity=Number(item.quantity??1);if(!Number.isFinite(quantity)||quantity<=0)continue;
   const key=name+'|'+unit,previous=items.get(key)||{name,unit,quantity:0};
   previous.quantity=Math.round((previous.quantity+quantity)*1000000)/1000000;items.set(key,previous);
  }
 }
 const dates=new Set(rows.map(row=>row.date).filter(date=>date&&validDate(date)));
 const weekdays=['السبت','الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة'].map(name=>({name,count:0}));
 for(const date of dates)weekdays[(new Date(date+'T12:00:00Z').getUTCDay()+1)%7].count++;
 const positions=new Map();
 catalog.forEach((item,index)=>{const name=aliases.get(item.name)||item.name;if(!positions.has(name))positions.set(name,index)});
 return {workDays:dates.size,price,net,tax:price-net,weekdays,items:[...items.values()].sort((a,b)=>foodOrder(a.name)-foodOrder(b.name)||(positions.get(a.name)??Infinity)-(positions.get(b.name)??Infinity)||a.name.localeCompare(b.name,'ar'))};
}
