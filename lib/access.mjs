// Validate Cloudflare Access signatures and membership before forwarding identity.
const cache=new Map();
function decode(s){if(!/^[A-Za-z0-9_-]+$/.test(s))throw Error('encoding');return Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));}
function json(s){return JSON.parse(new TextDecoder().decode(decode(s)));}
export async function verifyAccess(token,env,fetcher=fetch){
 try{
  if(!token||token.length>16384)return null;
  const issuer=new URL(env.ACCESS_TEAM_DOMAIN);
  if(issuer.protocol!=='https:'||!issuer.hostname.endsWith('.cloudflareaccess.com')||issuer.pathname!=='/'||issuer.search||issuer.hash||issuer.username||issuer.password)return null;
  const origin=issuer.origin;
  const parts=token.split('.');if(parts.length!==3)return null;
  const [head,body,sig]=parts,h=json(head),p=json(body),now=Math.floor(Date.now()/1000);
  if(h.alg!=='RS256'||typeof h.kid!=='string'||p.iss!==origin||p.type!=='app'||!Array.isArray(p.aud)||!p.aud.includes(env.ACCESS_AUD)||typeof p.exp!=='number'||p.exp<=now||typeof p.iat!=='number'||p.iat>now+30||(p.nbf!==undefined&&(typeof p.nbf!=='number'||p.nbf>now+30)))return null;
  const email=typeof p.email==='string'?p.email.toLowerCase().trim():'';
  const allowed=env.ALLOWED_EMAILS.split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);if(!email||!allowed.includes(email))return null;
  let entry=cache.get(origin);
  if(!entry||entry.expires<=Date.now()){
   const r=await fetcher(origin+'/cdn-cgi/access/certs',{signal:AbortSignal.timeout(5000)});if(!r.ok)return null;
   const data=await r.json();if(!Array.isArray(data.keys))return null;
   entry={keys:data.keys,expires:Date.now()+300000};cache.set(origin,entry);
  }
  const jwk=entry.keys.find(k=>k.kid===h.kid&&k.kty==='RSA');if(!jwk){cache.delete(origin);return null;}
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  return await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(sig),new TextEncoder().encode(head+'.'+body))?email:null;
 }catch{return null;}
}
