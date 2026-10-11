'use client';
import {useState} from 'react';

export function FoodPicker({value,catalog,onChange}:{value:string;catalog:{name:string;price:number}[];onChange:(name:string)=>void}){
 const [custom,setCustom]=useState(Boolean(value&&!catalog.some(x=>x.name===value)));
 return <div className="food-picker">
  <select aria-label="اختيار الأكلة" required={!custom} value={custom?'__custom__':value} onChange={e=>{
   const manual=e.target.value==='__custom__';
   setCustom(manual);
   onChange(manual?'':e.target.value);
  }}>
   <option value="" disabled>اختر الأكلة من القائمة</option>
   {catalog.map(x=><option key={x.name} value={x.name}>{x.name} — {new Intl.NumberFormat('ar-SA',{maximumFractionDigits:2}).format(x.price/100)} ر.س{x.name==='سمن'||x.name==='عسل'?' / كيلو':''}</option>)}
   <option value="__custom__">أكلة أخرى — اكتب الاسم</option>
  </select>
  {custom&&<input aria-label="اسم أكلة أخرى" required maxLength={200} value={value} placeholder="اكتب اسم الأكلة" onChange={e=>onChange(e.target.value)}/>}
 </div>;
}
