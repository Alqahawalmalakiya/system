import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import {DatabaseSync} from 'node:sqlite';
import {totals,validDate,validTime,timeRange} from '../lib/invoice-values.mjs';

test('discount, VAT and rounding preserve monetary totals',()=>{
 assert.deepEqual(totals(11500,15,15),{price:9775,discount:1725,net:8500,tax:1275});
 assert.equal(totals(10000,6).price,9400);
 assert.equal(totals(999,100).price,0);
 for(const base of [1,99,1001,999999])for(const rate of [0,6,15,12.5,100]){
  const t=totals(base,rate,15);assert.equal(t.net+t.tax,t.price);assert.equal(t.price+t.discount,base);
 }
});
test('blank dates, leap days, morning/evening and overnight ranges',()=>{
 for(const value of ['', '2028-02-29','2026-10-20'])assert.ok(validDate(value));
 for(const value of ['2026-02-29','2026-04-31','2026-13-01','0000-01-01'])assert.equal(validDate(value),false);
 assert.ok(validTime(''));assert.ok(validTime('23:59'));assert.equal(validTime('24:00'),false);
 assert.equal(timeRange('00:00','12:30'),'12:00 صباحًا إلى 12:30 مساءً');
 assert.equal(timeRange('23:30','01:00'),'11:30 مساءً إلى 1:00 صباحًا (اليوم التالي)');
});
test('migration preserves old invoices and defaults',()=>{
 const db=new DatabaseSync(':memory:');
 const dir=new URL('../drizzle/',import.meta.url);
 for(const name of readdirSync(dir).filter(n=>n.endsWith('.sql')&&!n.startsWith('0005')).sort())db.exec(readFileSync(new URL(name,dir),'utf8'));
 db.exec("INSERT INTO bookings(id,invoice,customer,occasion,date,price,paid,created_at) VALUES('old','0216','عميل','حفل','2026-10-20',10000,5000,'2026-10-20')");
 db.exec(readFileSync(new URL('0005_invoice_details.sql',dir),'utf8'));
 const row=db.prepare('SELECT * FROM bookings').get();
 assert.equal(row.base_price,10000);assert.equal(row.price,10000);assert.equal(row.discount_rate,0);assert.equal(row.end_time,'');db.close();
});

// Exercise the real HTTP handlers with an in-memory query adapter.
const records=new Map();
let serial=0;
const table={id:'id'};
const db={
 select(){return {from(){return {where(condition){return Promise.resolve([...records.values()].filter(condition))}}}}},
 insert(target){return {values(row){return {async returning(){if(target!==table)return [{id:++serial}];records.set(row.id,row);return [row]},then(resolve){records.set(row.id,row);resolve()}}}}},
 update(){return {set(changes){return {where(condition){const matches=[...records.values()].filter(condition);for(const r of matches)records.set(r.id,{...r,...changes});return {then(resolve){resolve()},async returning(){return matches.map(r=>records.get(r.id))}}}}}}},
 delete(){return {where(condition){const matches=[...records.values()].filter(condition);for(const r of matches)records.delete(r.id);return {async returning(){return matches}}}}}
};
globalThis.__invoiceTest={getDb:()=>db,bookings:table,invoiceNumbers:{},quoteNumbers:{},eq:(_,id)=>row=>row.id===id,asc:x=>x,getSystemUser:async()=>({email:'test@example.com'}),totals,validDate,validTime};
const source=readFileSync(new URL('../app/api/bookings/route.ts',import.meta.url),'utf8').replace(/^import .*;\r?$/gm,'');
const api=await import('data:text/javascript;base64,'+Buffer.from('const {getDb,bookings,invoiceNumbers,quoteNumbers,eq,asc,getSystemUser,totals,validDate,validTime}=globalThis.__invoiceTest;\n'+stripTypeScriptTypes(source)).toString('base64'));
const body=(changes={})=>({customer:'شركة محمد',phone:'0500000000',occasion:'ضيافة',date:'2026-10-24',time:'09:00',endTime:'17:00',place:'',notes:'',price:8500,basePrice:10000,discountRate:15,paid:0,status:'confirmed',mode:'hospitality',items:[],taxRate:0,...changes});
async function request(method,data){const res=await api[method](new Request('https://example.com/api/bookings',{method,headers:{origin:'https://example.com','Content-Type':'application/json'},body:JSON.stringify(data)}));return {status:res.status,data:await res.json()}}
test('save, clear schedule, discount validation, group invoices and delete only selected invoice',async()=>{
 const first=await request('POST',body());assert.equal(first.status,200);
 const clear=await request('POST',body({id:first.data.id,date:'',time:'',endTime:''}));assert.equal(clear.status,200);assert.equal(clear.data.date,'');assert.equal(clear.data.time,'');assert.equal(clear.data.endTime,'');
 assert.equal((await request('POST',body({paid:8501}))).status,400);
 assert.equal((await request('POST',body({price:10000}))).status,400);
 assert.equal((await request('POST',body({date:'2026-02-30'}))).status,400);
 assert.equal((await request('POST',body({time:'',endTime:'17:00'}))).status,400);
 const second=await request('POST',body({attachTo:first.data.id,date:'2026-10-25'}));assert.equal(second.status,200);
 assert.equal(second.data.invoiceGroup,first.data.id);assert.equal(records.get(first.data.id).invoiceGroup,first.data.id);
 const third=await request('POST',body({attachTo:second.data.id}));assert.equal(third.data.invoiceGroup,first.data.id);
 assert.equal((await request('DELETE',{id:first.data.id})).status,200);assert.ok(records.has(second.data.id));assert.ok(records.has(third.data.id));
 records.set('legacy-id',{...second.data,id:'legacy-id'});assert.equal((await request('DELETE',{id:'legacy-id'})).status,200);
 const food=await request('POST',body({mode:'food',items:[{item:'قهوة',description:'',quantity:1,unitPrice:10000,amount:10000}],taxRate:15,basePrice:11500,price:9775}));assert.equal(food.status,200);assert.equal(food.data.price,9775);
});
