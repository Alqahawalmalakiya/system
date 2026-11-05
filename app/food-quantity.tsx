'use client';
import {useState} from 'react';

const quantities=['1','2','3','4','5'];
const labels=['واحد','اثنين','ثلاثة','أربعة','خمسة'];
export function FoodQuantity({value,onChange}:{value:string;onChange:(value:string)=>void}){
 const [manual,setManual]=useState(false);
 const custom=manual||!quantities.includes(value);
 return <>
  <select aria-label="الكمية" value={custom?'other':value} onChange={e=>{
   const other=e.target.value==='other';
   setManual(other);
   onChange(other?'':e.target.value);
  }}>
   {quantities.map((number,i)=><option key={number} value={number}>{labels[i]}</option>)}
   <option value="other">عدد آخر</option>
  </select>
  {custom&&<input aria-label="اكتب العدد" placeholder="اكتب العدد" type="number" inputMode="numeric" required min="1" max="10000" step="1" value={value} onChange={e=>onChange(e.target.value)}/>}
 </>;
}
