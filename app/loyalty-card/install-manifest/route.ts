export async function GET(request:Request){
 const token=new URL(request.url).searchParams.get('card')||'';
 if(!/^[a-f0-9]{64}$/.test(token))return new Response(null,{status:404});
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
 const id=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 return Response.json({
  id:'/loyalty-card/id/'+id,scope:'/loyalty-card/',start_url:'/loyalty-card/open?card='+token,
  name:'بطاقة الولاء | القهوة الملكية',short_name:'القهوة الملكية',lang:'ar',dir:'rtl',display:'standalone',
  theme_color:'#fbf4ea',background_color:'#fbf4ea',
  icons:[192,512].flatMap(n=>['any','maskable'].map(purpose=>({src:'/loyalty-card/assets/icon-'+(purpose==='maskable'?'maskable-':'')+n+'.png',sizes:n+'x'+n,type:'image/png',purpose})))
 },{headers:{'Content-Type':'application/manifest+json','Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
}
