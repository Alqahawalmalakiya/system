import {test} from 'node:test';
import assert from 'node:assert/strict';
import {verifyAccess} from '../lib/access.mjs';
const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const jwk=await crypto.subtle.exportKey('jwk',pair.publicKey);jwk.kid='test';
const env={ACCESS_TEAM_DOMAIN:'https://royal-test.cloudflareaccess.com',ACCESS_AUD:'test-aud',ALLOWED_EMAILS:'client@example.com'};
const enc=x=>Buffer.from(typeof x==='string'?x:JSON.stringify(x)).toString('base64url');
async function token(change={}){const now=Math.floor(Date.now()/1000);const h=enc({alg:'RS256',kid:'test'});const p=enc({iss:env.ACCESS_TEAM_DOMAIN,aud:['test-aud'],type:'app',iat:now,exp:now+300,email:'client@example.com',...change});const sig=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(h+'.'+p));return h+'.'+p+'.'+Buffer.from(sig).toString('base64url');}
const fetcher=async()=>Response.json({keys:[jwk]});
test('allowed signed identity',async()=>assert.equal(await verifyAccess(await token(),env,fetcher),'client@example.com'));
test('reject invalid or unauthorized identity',async()=>{for(const change of [{exp:1},{aud:['other']},{iss:'https://wrong.cloudflareaccess.com'},{email:'other@example.com'},{type:'org'},{iat:9999999999}])assert.equal(await verifyAccess(await token(change),env,fetcher),null);assert.equal(await verifyAccess(null,env,fetcher),null);assert.equal(await verifyAccess('broken',env,fetcher),null);});
test('reject forged signature',async()=>{const t=await token();const parts=t.split('.');parts[1]=enc({...JSON.parse(Buffer.from(parts[1],'base64url')),exp:9999999999});assert.equal(await verifyAccess(parts.join('.'),env,fetcher),null);});
