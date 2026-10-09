import handler from 'vinext/server/fetch-handler';
import {verifyAccess} from './lib/access.mjs';
export default {
 async fetch(request:Request,env:Cloudflare.Env,ctx:ExecutionContext){
  if(!env.ACCESS_TEAM_DOMAIN||!env.ACCESS_AUD||!env.ALLOWED_EMAILS)return new Response('يجب إعداد حماية الدخول قبل استخدام النظام.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
  const email=await verifyAccess(request.headers.get('Cf-Access-Jwt-Assertion'),env);
  if(!email)return new Response('غير مصرح بالدخول. افتح الرابط المحمي وسجل الدخول بالإيميل المعتمد.',{status:403,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
  const h=new Headers(request.headers);h.delete('x-royal-user-email');h.set('x-royal-user-email',email);
  const response=await handler.fetch(new Request(request,{headers:h}),env,ctx);
  const out=new Response(response.body,response);out.headers.set('Cache-Control','private, no-store');out.headers.set('X-Content-Type-Options','nosniff');out.headers.set('Referrer-Policy','same-origin');return out;
 }
};
