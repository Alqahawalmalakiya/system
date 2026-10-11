import {env} from 'cloudflare:workers';
import {getDb} from '../../../../db';
import {bookings} from '../../../../db/schema';
import {eq} from 'drizzle-orm';
import {getSystemUser} from '../../../system-auth';

export async function POST(req:Request){
 if(!await getSystemUser())return Response.json({error:'سجل الدخول أولاً'},{status:401});
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'طلب غير مسموح'},{status:403});
 let body:any;try{body=await req.json()}catch{return Response.json({error:'بيانات غير صالحة'},{status:400})}
 if(!body||typeof body.id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id))return Response.json({error:'رقم العرض غير صالح'},{status:400});
 const current=(await getDb().select().from(bookings).where(eq(bookings.id,body.id)))[0];
 if(!current)return Response.json({error:'عرض السعر غير موجود'},{status:404});
 if(current.documentType!=='quote')return Response.json(current,{headers:{'Cache-Control':'no-store'}});
 // D1 executes the batch atomically. The unique booking ID makes retries safe.
 await env.DB.batch([
  env.DB.prepare("INSERT OR IGNORE INTO invoice_numbers (booking_id) SELECT id FROM bookings WHERE id=? AND document_type='quote'").bind(body.id),
  env.DB.prepare("UPDATE bookings SET invoice=printf('%04d',(SELECT id+215 FROM invoice_numbers WHERE booking_id=bookings.id)),document_type='invoice',status='confirmed',created_at=? WHERE id=? AND document_type='quote'").bind(new Date().toISOString(),body.id)
 ]);
 const converted=(await getDb().select().from(bookings).where(eq(bookings.id,body.id)))[0];
 return Response.json(converted,{headers:{'Cache-Control':'no-store'}});
}
