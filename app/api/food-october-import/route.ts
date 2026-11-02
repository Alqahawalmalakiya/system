import {env} from 'cloudflare:workers';
import {getSystemUser} from '../../system-auth';
import sources from '../../../lib/october-2026-food.json';
import {matchesOctoberInvoice,octoberKey} from '../../../lib/october-import.mjs';

export async function POST(req:Request){
 if(!await getSystemUser())return Response.json({error:'سجل الدخول أولًا'},{status:401});
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'طلب غير مسموح'},{status:403});
 const db=env.DB;
 await db.prepare('CREATE TABLE IF NOT EXISTS food_import_receipts (source_key TEXT PRIMARY KEY, booking_id TEXT NOT NULL)').run();
 const [{results:rows},{results:receipts}]=await Promise.all([
  db.prepare("SELECT * FROM bookings WHERE mode='food' AND date LIKE '2026-10-%'").all<any>(),
  db.prepare("SELECT * FROM food_import_receipts WHERE source_key LIKE 'royal-food-2026-10-p%'").all<{source_key:string;booking_id:string}>()
 ]);
 const imported=new Set(receipts.map(row=>row.source_key));
 const statements:D1PreparedStatement[]=[];
 let added=0,matched=0,skipped=0;
 for(const source of sources){
  const key=octoberKey(source);if(imported.has(key)){skipped++;continue}
  const matches=rows.filter(row=>matchesOctoberInvoice(source,row));
  if(matches.length>1)return Response.json({error:'يوجد أكثر من سجل مطابق لصفحة '+source.page+'؛ راجع التكرار قبل الاستيراد. لم تُستورد أي فاتورة في هذه المحاولة.'},{status:409});
  if(matches[0]){
   const old=matches[0],notes=[old.notes,'[استيراد '+key+'] مسددة بالكامل — رقم الملف الأصلي '+source.sourceInvoice].filter(Boolean).join('\n');
   // Match the exact pre-read version; changed records are reported as incomplete below.
   statements.push(db.prepare('UPDATE bookings SET paid=price,notes=? WHERE id=? AND price=? AND date=? AND items=? AND NOT EXISTS (SELECT 1 FROM food_import_receipts WHERE source_key=?)').bind(notes,old.id,source.price,source.date,old.items,key));
   statements.push(db.prepare('INSERT OR IGNORE INTO food_import_receipts(source_key,booking_id) SELECT ?,id FROM bookings WHERE id=? AND price=? AND date=? AND items=? AND paid=price').bind(key,old.id,source.price,source.date,old.items));
   matched++;
  }else{
   const id=key,notes='[استيراد '+key+'] مستورد من ملف أكتوبر 2026 — رقم الملف الأصلي '+source.sourceInvoice+' — مسددة بالكامل.';
   statements.push(db.prepare('INSERT OR IGNORE INTO invoice_numbers(booking_id) VALUES (?)').bind(id));
   statements.push(db.prepare("INSERT OR IGNORE INTO bookings(id,invoice,customer,phone,occasion,date,time,end_time,place,price,paid,notes,status,mode,items,tax_rate,created_at,base_price,discount_rate,invoice_group,document_type,quote_number) SELECT ?,printf('%04d',id+215),?,'','',?,'','',?,?,?,?, 'completed','food',?,15,?,?,0,'','invoice','' FROM invoice_numbers WHERE booking_id=?").bind(id,source.customer,source.date,source.customer,source.price,source.price,notes,JSON.stringify(source.items),source.date+'T09:00:00.000Z',source.price,id));
   statements.push(db.prepare('INSERT OR IGNORE INTO food_import_receipts(source_key,booking_id) SELECT ?,id FROM bookings WHERE id=? AND price=? AND date=? AND items=?').bind(key,id,source.price,source.date,JSON.stringify(source.items)));
   added++;
  }
 }
 if(statements.length)await db.batch(statements);
 const {results:after}=await db.prepare("SELECT r.source_key,b.price,b.paid FROM food_import_receipts r JOIN bookings b ON b.id=r.booking_id WHERE r.source_key LIKE 'royal-food-2026-10-p%'").all<{source_key:string;price:number;paid:number}>();
 const keys=new Set(after.map(row=>row.source_key)),complete=sources.every(source=>keys.has(octoberKey(source)));
 if(!complete)return Response.json({error:'اكتمل جزء من الاستيراد فقط بسبب تعديل متزامن أو سجل محذوف. حدّث الصفحة وأعد المحاولة؛ الفواتير المستوردة لن تتكرر.',count:after.length},{status:409});
 return Response.json({added,matched,skipped,count:after.length,total:after.reduce((sum,row)=>sum+row.price,0),paid:after.reduce((sum,row)=>sum+row.paid,0)},{headers:{'Cache-Control':'no-store'}});
}
