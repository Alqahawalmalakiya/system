'use client';
import {useRef,useState} from 'react';
export function OctoberFoodImport({onImported}:{onImported:()=>Promise<void>}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');const lock=useRef(false);
 async function run(){
  if(lock.current||!window.confirm('استيراد فواتير ملف أكتوبر الـ28 كفواتير مسددة بالكامل؟ سيستخدم النظام أرقامه التلقائية، ويتجاوز الفواتير المطابقة الموجودة. لن تُحذف أي فاتورة.'))return;
  lock.current=true;setBusy(true);setError('');setMessage('');
  try{
   const response=await fetch('/api/food-october-import',{method:'POST'}),result=await response.json() as {error?:string;count:number;added:number;matched:number;skipped:number;total:number};
   if(!response.ok)throw Error(result.error||'تعذر الاستيراد');
   setMessage('تم تجهيز '+result.count+' فاتورة من ملف أكتوبر. أُضيفت '+result.added+'، وطُوبقت '+result.matched+' موجودة، وسبق استيراد '+result.skipped+'. الإجمالي '+new Intl.NumberFormat('ar-SA',{minimumFractionDigits:2}).format(result.total/100)+' ر.س.');
  }catch(e){setError(e instanceof Error?e.message:'تعذر الاستيراد')}
  finally{await onImported();lock.current=false;setBusy(false)}
 }
 return <section className="food-month-empty"><h3>فواتير ملف أكتوبر ٢٠٢٦</h3><p>٢٨ فاتورة جاهزة بأصنافها وكمياتها وضريبة ١٥٪، وكلها مسددة. الاستيراد يحفظها في قاعدة النظام، وليس في المتصفح، ولا يكرر الفاتورة المطابقة الموجودة.</p><button className="primary" disabled={busy} onClick={run}>{busy?'جاري استيراد فواتير أكتوبر…':'استيراد فواتير أكتوبر دفعة واحدة'}</button>{message&&<p role="status">{message}</p>}{error&&<p role="alert" className="error">{error}</p>}</section>;
}
