import { getDb } from '../../../db';
import { bookings,invoiceNumbers,quoteNumbers } from '../../../db/schema';
import { eq,asc } from 'drizzle-orm';
import { getSystemUser } from '../../system-auth';
export async function GET(){if(!await getSystemUser())return Response.json({error:'سجل الدخول أولاً'},{status:401});return Response.json(await getDb().select().from(bookings).orderBy(asc(bookings.date),asc(bookings.time)),{headers:{'Cache-Control':'no-store'}});}
export async function POST(req:Request){
 if(!await getSystemUser())return Response.json({error:'سجل الدخول أولاً'},{status:401});
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'طلب غير مسموح'},{status:403});
 let b:any;try{b=await req.json()}catch{return Response.json({error:'بيانات غير صالحة'},{status:400})}
 if(!b||typeof b!=='object')return Response.json({error:'بيانات غير صالحة'},{status:400});
 const fields=['customer','phone','occasion','date','time','place','notes'];
 if(fields.some(k=>typeof b[k]!=='string'||b[k].length>2000)||(b.date&&(!/^\d{4}-\d{2}-\d{2}$/.test(b.date)||isNaN(Date.parse(b.date))))||(b.time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(b.time))||!Number.isInteger(b.price)||!Number.isInteger(b.paid)||b.price<0||b.price>1000000000||b.paid<0||b.paid>b.price||!['confirmed','completed','cancelled'].includes(b.status))return Response.json({error:'راجع البيانات والمبالغ: الدفعة لا تتجاوز السعر'},{status:400});
 const documentType=b.documentType??'invoice';if(!['invoice','quote'].includes(documentType))return Response.json({error:'نوع المستند غير صالح'},{status:400});
 const mode=b.mode??'hospitality';if(!['food','hospitality'].includes(mode))return Response.json({error:'نوع الفاتورة غير صالح'},{status:400});
 const items=b.items??[];const taxRate=b.taxRate??0;
 if(!Array.isArray(items)||items.length>50||![0,15].includes(taxRate)||items.some((x:any)=>!x||typeof x.item!=='string'||!x.item.trim()||x.item.length>200||typeof x.description!=='string'||x.description.length>500))return Response.json({error:'راجع أصناف الفاتورة وأوصافها'},{status:400});
 if(mode==='food'&&(!items.length||items.some((x:any)=>!Number.isInteger(x.unitPrice)||x.unitPrice<0||x.unitPrice>1000000000||typeof x.quantity!=='number'||!Number.isFinite(x.quantity)||x.quantity<=0||x.quantity>10000||Math.abs(Math.round(x.quantity*100)-x.quantity*100)>0.000001||x.amount!==Math.round(x.unitPrice*x.quantity))))return Response.json({error:'راجع كميات المأكولات وأسعارها'},{status:400});
 if(mode==='food'){const net=items.reduce((s:number,x:any)=>s+x.amount,0);if(b.price!==net+Math.round(net*taxRate/100))return Response.json({error:'إجمالي المأكولات غير مطابق'},{status:400});}
 if(mode==='hospitality'&&items.some((x:any)=>x.showPrice!==undefined&&typeof x.showPrice!=='boolean'||x.showPrice===true&&(!Number.isInteger(x.amount)||x.amount<0||x.amount>1000000000)))return Response.json({error:'راجع أسعار خدمات الضيافة'},{status:400});
 const data={mode,...Object.fromEntries(fields.map(k=>[k,b[k].trim()])),items:JSON.stringify(items.map((x:any)=>({item:x.item.trim(),description:x.description.trim(),amount:Number.isInteger(x.amount)&&x.amount>=0?x.amount:0,...(mode==='food'?{quantity:x.quantity,unitPrice:x.unitPrice}:{showPrice:x.showPrice===true})}))),taxRate};
 if(b.id){const old=(await getDb().select().from(bookings).where(eq(bookings.id,b.id)))[0];if(!old)return Response.json({error:'الحجز غير موجود'},{status:404});if(documentType!==old.documentType)return Response.json({error:'لتحويل العرض استخدم زر تحويل إلى فاتورة رسمية'},{status:409});const changes={...data,price:b.price,paid:old.documentType==='quote'?0:b.paid,status:old.documentType==='quote'?'confirmed':b.status};await getDb().update(bookings).set(changes).where(eq(bookings.id,b.id));return Response.json({...old,...changes});}
 const id=crypto.randomUUID();const isQuote=documentType==='quote';const serial=(await getDb().insert(isQuote?quoteNumbers:invoiceNumbers).values({bookingId:id}).returning())[0].id;const number=isQuote?'QT-'+String(serial).padStart(4,'0'):String(serial+215).padStart(4,'0');const row={...data,id,documentType,quoteNumber:isQuote?number:'',invoice:number,price:b.price,paid:isQuote?0:b.paid,status:isQuote?'confirmed':b.status,createdAt:new Date().toISOString()} as typeof bookings.$inferInsert;await getDb().insert(bookings).values(row);return Response.json(row);
}
export async function PATCH(req:Request){
 if(!await getSystemUser())return Response.json({error:'سجل الدخول أولاً'},{status:401});
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'طلب غير مسموح'},{status:403});
 let b:any;try{b=await req.json()}catch{return Response.json({error:'بيانات غير صالحة'},{status:400})}
 if(!b||typeof b.id!=='string'||!['confirmed','completed','cancelled'].includes(b.status))return Response.json({error:'حالة الحجز غير صالحة'},{status:400});
 const existing=(await getDb().select().from(bookings).where(eq(bookings.id,b.id)))[0];if(existing?.documentType==='quote')return Response.json({error:'حوّل عرض السعر إلى فاتورة قبل تغيير حالة المناسبة'},{status:409});
 const updated=await getDb().update(bookings).set({status:b.status}).where(eq(bookings.id,b.id)).returning();
 if(!updated.length)return Response.json({error:'الحجز غير موجود'},{status:404});
 return Response.json(updated[0],{headers:{'Cache-Control':'no-store'}});
}

export async function DELETE(req:Request){
 if(!await getSystemUser())return Response.json({error:'سجل الدخول أولاً'},{status:401});
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'طلب غير مسموح'},{status:403});
 let b:any;try{b=await req.json()}catch{return Response.json({error:'بيانات غير صالحة'},{status:400})}
 if(!b||typeof b.id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(b.id))return Response.json({error:'رقم الحجز غير صالح'},{status:400});
 // Keep invoice_numbers so a deleted invoice number is never issued again.
 const deleted=await getDb().delete(bookings).where(eq(bookings.id,b.id)).returning({id:bookings.id});
 if(!deleted.length)return Response.json({error:'الفاتورة غير موجودة'},{status:404});
 return Response.json({deletedId:deleted[0].id},{headers:{'Cache-Control':'no-store'}});
}
