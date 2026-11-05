// Amounts entered in the form are riyals; sum integer halalas to avoid drift.
export function itemPriceEntry(mode,items,previousItems=[]){
 const priced=rows=>rows.some(row=>String(row.amount??'').trim()!=='');
 if(mode!=='food'&&!priced(items)&&!priced(previousItems))return {};
 const sum=items.reduce((total,row)=>total+(mode==='food'
  ?Math.round(Math.round(Number(row.unitPrice||0)*100)*Number(row.quantity||0))
  :Math.round(Number(row.amount||0)*100)),0);
 return {price:String(sum/100),originalPrice:null};
}
