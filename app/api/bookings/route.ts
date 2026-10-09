import { getDb } from '../../../db';
import { bookings,invoiceNumbers } from '../../../db/schema';
import { eq,asc } from 'drizzle-orm';
import { getSystemUser } from '../../system-auth';
export async function GET(){if(!await getSystemUser())return Response.json({error:'سجل الدخول أولاً'},{status:401});return Response.json(await getDb().select().from(bookings).orderBy(asc(bookings.date),asc(bookings.time)),{headers:{'Cache-Control':'no-store'}});}
export async function POST(req:Request){
 if(!await getSystemUser())return Response.json({error:'سجل الدخول أولاً'},{status:401});
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'طلب غير مسموح'},{status:403});
 let b:any;try{b=await req.json()}catch{return Response.json({error:'بيانات غير صالحة'},{status:400})}
 if(!b||typeof b!=='object')return Response.json({error:'بيانات غير صالحة'},{status:400});
 const fields=['customer','phone','occasion','date','time','place','notes'];
 if(fields.some(k=>typeof b[k]!=='string'||b[k].length>2000)||!b.customer.trim()||!b.occasion.trim()||!/^\d{4}-\d{2}-\d{2}$/.test(b.date)||isNaN(Date.parse(b.date))||(b.time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(b.time))||!Number.isInteger(b.price)||!Number.isInteger(b.paid)||b.price<0||b.price>1000000000||b.paid<0||b.paid>b.price||!['confirmed','completed','cancelled'].includes(b.status))return Response.json({error:'راجع البيانات والمبالغ: الدفعة لا تتجاوز السعر'},{status:400});
 const mode=b.mode??'hospitality';if(!['food','hospitality'].includes(mode))return Response.json({error:'نوع الفاتورة غير صالح'},{status:400});
 const items=b.items??[];const taxRate=b.taxRate??0;
 if(!Array.isArray(items)||items.length>50||![0,15].includes(taxRate)||items.some((x:any)=>!x||typeof x.item!=='string'||!x.item.trim()||x.item.length>200||typeof x.description!=='string'||x.description.length>500))return Response.json({error:'راجع أصناف الفاتورة وأوصافها'},{status:400});
 if(mode==='food'&&(!items.length||items.some((x:any)=>!Number.isInteger(x.unitPrice)||x.unitPrice<0||x.unitPrice>1000000000||typeof x.quantity!=='number'||!Number.isFinite(x.quantity)||x.quantity<=0||x.quantity>10000||Math.abs(Math.round(x.quantity*100)-x.quantity*100)>0.000001||x.amount!==Math.round(x.unitPrice*x.quantity))))return Response.json({error:'راجع كميات المأكولات وأسعارها'},{status:400});
 if(mode==='food'){const net=items.reduce((s:number,x:any)=>s+x.amount,0);if(b.price!==net+Math.round(net*taxRate/100))return Response.json({error:'إجمالي المأكولات غير مطابق'},{status:400});}
 const data={mode,...Object.fromEntries(fields.map(k=>[k,b[k].trim()])),items:JSON.stringify(items.map((x:any)=>({item:x.item.trim(),description:x.description.trim(),amount:Number.isInteger(x.amount)&&x.amount>=0?x.amount:0,...(mode==='food'?{quantity:x.quantity,unitPrice:x.unitPrice}:{})}))),taxRate};
 if(b.id){const old=(await getDb().select().from(bookings).where(eq(bookings.id,b.id)))[0];if(!old)return Response.json({error:'الحجز غير موجود'},{status:404});await getDb().update(bookings).set({...data,price:b.price,paid:b.paid,status:b.status}).where(eq(bookings.id,b.id));return Response.json({...old,...data,price:b.price,paid:b.paid,status:b.status});}
 const id=crypto.randomUUID();const serial=(await getDb().insert(invoiceNumbers).values({bookingId:id}).returning())[0].id;const row={...data,id,invoice:String(serial+215).padStart(4,'0'),price:b.price,paid:b.paid,status:b.status,createdAt:new Date().toISOString()} as typeof bookings.$inferInsert;await getDb().insert(bookings).values(row);return Response.json(row);
}
export async function PATCH(req:Request){
 if(!await getSystemUser())return Response.json({error:'سجل الدخول أولاً'},{status:401});
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'طلب غير مسموح'},{status:403});
 let b:any;try{b=await req.json()}catch{return Response.json({error:'بيانات غير صالحة'},{status:400})}
 if(!b||typeof b.id!=='string'||!['confirmed','completed','cancelled'].includes(b.status))return Response.json({error:'حالة الحجز غير صالحة'},{status:400});
 const updated=await getDb().update(bookings).set({status:b.status}).where(eq(bookings.id,b.id)).returning();
 if(!updated.length)return Response.json({error:'الحجز غير موجود'},{status:404});
 return Response.json(updated[0],{headers:{'Cache-Control':'no-store'}});
}
