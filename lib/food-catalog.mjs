const jareeshNames=['جريش','جريش أحمر','جريش أبيض','جريش احمر','جريش ابيض'];
/** Display legacy varieties as one item; retain the database key for edits. */
export function orderFoodCatalog(catalog){
 const jareesh=jareeshNames.map(name=>catalog.find(item=>item.name===name)).find(Boolean);
 const result=catalog.filter(item=>!jareeshNames.includes(item.name));
 if(jareesh)result.push({...jareesh,name:'جريش',originalName:jareesh.originalName||jareesh.name});
 const rank=name=>name==='خبز ملة'?0:name==='عريكة'?1:name==='عصيدة'?2:['مفتوت','مفتوتة','مفتوته'].includes(name)?3:['سمن','السمن'].includes(name)?100:['عسل','العسل'].includes(name)?101:10;
 return result.sort((a,b)=>rank(a.name)-rank(b.name));
}
