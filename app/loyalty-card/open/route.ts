export function GET(request:Request){
 const token=new URL(request.url).searchParams.get('card')||'';
 if(!/^[a-f0-9]{64}$/.test(token))return new Response(null,{status:404});
 return new Response(null,{status:302,headers:{Location:'/loyalty-card/index.html#card='+token,'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
}
