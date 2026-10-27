import {env} from 'cloudflare:workers';
import {getSystemUser} from '../../system-auth';
export async function GET(){
 if(!await getSystemUser())return Response.json({error:'سجل الدخول'},{status:401});
 const {results}=await env.DB.prepare('SELECT name, price FROM foods ORDER BY name').all();
 return Response.json(results,{headers:{'Cache-Control':'no-store'}});
}
export async function POST(req:Request){
 if(!await getSystemUser())return Response.json({error:'سجل الدخول'},{status:401});
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'طلب غير مسموح'},{status:403});
 let body:any;
 try{body=await req.json()}catch{return Response.json({error:'بيانات غير صالحة'},{status:400})}
 const name=typeof body?.name==='string'?body.name.trim():'';
 const originalName=typeof body?.originalName==='string'?body.originalName.trim():'';
 const price=body?.price;
 if(!name||name.length>200||originalName.length>200||!Number.isSafeInteger(price)||price<0||price>1000000000)
  return Response.json({error:'أدخل اسم الأكلة وسعرًا صحيحًا لا يقل عن صفر'},{status:400});
 if(originalName){
  if(originalName!==name&&await env.DB.prepare('SELECT name FROM foods WHERE name=?').bind(name).first())
   return Response.json({error:'يوجد صنف بهذا الاسم؛ اختر اسمًا آخر'},{status:409});
  try{
   const result=await env.DB.prepare('UPDATE foods SET name=?, price=? WHERE name=?').bind(name,price,originalName).run();
   if(!result.meta.changes)return Response.json({error:'الصنف لم يعد موجودًا؛ حدّث القائمة وحاول مجددًا'},{status:404});
  }catch(error){
   if(String(error).includes('UNIQUE'))return Response.json({error:'يوجد صنف بهذا الاسم؛ اختر اسمًا آخر'},{status:409});
   throw error;
  }
 }else{
  const result=await env.DB.prepare('INSERT OR IGNORE INTO foods (name,price) VALUES (?,?)').bind(name,price).run();
  if(!result.meta.changes)return Response.json({error:'الأكلة موجودة بالفعل؛ اخترها من القائمة لتعديلها'},{status:409});
 }
 return Response.json({name,price});
}
