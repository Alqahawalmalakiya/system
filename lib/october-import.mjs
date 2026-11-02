const normalize=value=>String(value||'').normalize('NFKC').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/\s+/g,' ').trim();
const venue=value=>normalize(value).replace(/^(ال)?قاعه\s*/, '').replace(/^ال/,'').replace(/\s/g,'');
const foodName=value=>{const name=normalize(value);return ['خبز مله','قرص خبز مله كبير','خبز المله'].includes(name)?'خبز ملة':name};
export function itemsFingerprint(value){
 try{const items=typeof value==='string'?JSON.parse(value):value;if(!Array.isArray(items))return null;
 return JSON.stringify(items.map(item=>[foodName(item.item),Number(item.quantity??1),Number(item.unitPrice??item.amount),Number(item.amount)]).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))));
 }catch{return null}
}
export function matchesOctoberInvoice(source,row){
 return row.mode==='food'&&(row.document_type??row.documentType??'invoice')==='invoice'&&row.date===source.date&&row.price===source.price&&
 itemsFingerprint(row.items)===itemsFingerprint(source.items)&&[row.customer,row.place].some(name=>venue(name)===venue(source.customer));
}
export function octoberKey(source){return 'royal-food-2026-10-p'+String(source.page).padStart(2,'0')}
