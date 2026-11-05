const jareeshNames=['جريش','جريش أحمر','جريش أبيض','جريش احمر','جريش ابيض'];
export function foodOrder(name){
 if(['خبز ملة','خبز الملة','خبز المله','قرص خبز ملة كبير'].includes(name))return 0;
 if(['عريكة','عريكه'].includes(name))return 1;
 if(['عصيدة','عصيده'].includes(name))return 2;
 if(['مراصيع','اصبع','أصبع'].includes(name))return 3;
 if(['مشغوث','مشغوثة','مشغوثه'].includes(name))return 4;
 return ['سمن','السمن'].includes(name)?100:['عسل','العسل'].includes(name)?101:10;
}
/** Display legacy varieties as one item; retain the database key for edits. */
export function orderFoodCatalog(catalog){
 const jareesh=jareeshNames.map(name=>catalog.find(item=>item.name===name)).find(Boolean);
 const result=catalog.filter(item=>!jareeshNames.includes(item.name));
 if(jareesh)result.push({...jareesh,name:'جريش',originalName:jareesh.originalName||jareesh.name});
 const hasBread=result.some(item=>item.name==='خبز ملة');
 const rank=name=>hasBread&&name!=='خبز ملة'&&foodOrder(name)===0?10:foodOrder(name);
 return result.sort((a,b)=>rank(a.name)-rank(b.name));
}
