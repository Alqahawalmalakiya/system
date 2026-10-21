'use client';
export function TimeField({label,value,onChange}:{label:string;value:string;onChange:(value:string)=>void}){
 const [h,m]=(value||'00:00').split(':');
 const hour=Number(h)%12||12,period=Number(h)<12?'am':'pm';
 function update(nextHour:number,nextMinute:string,nextPeriod:string){onChange(String(nextHour%12+(nextPeriod==='pm'?12:0)).padStart(2,'0')+':'+nextMinute)}
 return <fieldset className="time-field"><legend>{label}</legend><div className="time-controls">
  <select aria-label={label+' — الساعة'} value={value?hour:''} onChange={e=>update(Number(e.target.value),m,period)}><option value="" disabled>الساعة</option>{Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select>
  <select aria-label={label+' — الدقيقة'} value={value?m:''} onChange={e=>update(hour,e.target.value,period)}><option value="" disabled>الدقيقة</option>{Array.from({length:60},(_,i)=>String(i).padStart(2,'0')).map(n=><option key={n}>{n}</option>)}</select>
  <select aria-label={label+' — صباحًا أو مساءً'} value={value?period:''} onChange={e=>update(hour,m,e.target.value)}><option value="" disabled>الفترة</option><option value="am">صباحًا</option><option value="pm">مساءً</option></select>
  <button type="button" disabled={!value} onClick={()=>onChange('')}>مسح</button>
 </div></fieldset>;
}
