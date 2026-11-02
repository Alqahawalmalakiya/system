'use client';
export async function createInvoicePdf(element:HTMLElement|HTMLElement[],invoiceNumber:string,existingPdf?:import('jspdf').jsPDF){
 const [{default:html2canvas},{jsPDF}]=await Promise.all([import('html2canvas'),import('jspdf')]);
 await document.fonts.load('500 16px RoyalInvoiceArabic');await document.fonts.load('700 16px RoyalInvoiceArabic');await document.fonts.ready;
 const pdf=existingPdf||new jsPDF({unit:'mm',format:'a4',compress:true});pdf.setProperties({title:'فواتير القهوة الملكية '+invoiceNumber,author:'القهوة الملكية'});
 let page=existingPdf?existingPdf.getNumberOfPages():0;
 for(const source of (Array.isArray(element)?element:[element])){
 const wrapper=document.createElement('div');wrapper.style.cssText='position:fixed;left:-10000px;top:0;width:794px;background:white;pointer-events:none;';
 const clone=source.cloneNode(true) as HTMLElement;clone.classList.add('pdf-export-sheet');wrapper.appendChild(clone);document.body.appendChild(wrapper);
 try{
 await Promise.all(Array.from(clone.querySelectorAll('img')).map(async img=>{if(img.complete&&img.naturalWidth)return;await img.decode()}));
 // Only tighten excess whitespace when a normal invoice would overflow A4.
 // Keep long descriptions/large statements paginated instead of clipping them.
 const rowCount=clone.querySelectorAll('.royal-table tbody tr').length;
 const regularInvoice=!clone.classList.contains('food-statement');
 const pageHeight=794*277/190;
 if(regularInvoice&&rowCount<=10&&clone.getBoundingClientRect().height>pageHeight)clone.classList.add('pdf-compact-sheet');
 const rect=clone.getBoundingClientRect();
 const blocks=Array.from(clone.querySelectorAll('tr,.invoice-totals,.invoice-meta,.cancellation-note,.royal-footer')).map(e=>{const r=e.getBoundingClientRect();return {top:r.top-rect.top,bottom:r.bottom-rect.top}});
 const canvas=await html2canvas(clone,{scale:2,backgroundColor:'#ffffff',useCORS:true,logging:false,windowWidth:1100,scrollX:0,scrollY:0,onclone(doc){doc.documentElement.style.overflow='visible';doc.body.style.overflow='visible';}});
 const fit=Math.min(1,(canvas.width*277/190)/canvas.height);
 if(regularInvoice&&rowCount<=10&&fit>=0.88){
  const width=190*fit,height=canvas.height*width/canvas.width;
  if(page++)pdf.addPage();pdf.addImage(canvas.toDataURL('image/jpeg',0.97),'JPEG',(210-width)/2,10,width,height);
  continue;
 }
 
 const ratio=canvas.width/rect.width;const maxHeight=Math.floor(canvas.width*277/190);let offset=0;
 while(offset<canvas.height){let end=Math.min(offset+maxHeight,canvas.height);for(const block of blocks){const top=Math.floor(block.top*ratio),bottom=Math.ceil(block.bottom*ratio);if(top>offset&&top<end&&bottom>end)end=top;}if(end<=offset)end=Math.min(offset+maxHeight,canvas.height);
 const slice=document.createElement('canvas');slice.width=canvas.width;slice.height=end-offset;const context=slice.getContext('2d');if(!context)throw Error('تعذر تجهيز الفاتورة');context.fillStyle='#fff';context.fillRect(0,0,slice.width,slice.height);context.drawImage(canvas,0,offset,canvas.width,slice.height,0,0,slice.width,slice.height);
 if(page++)pdf.addPage();pdf.addImage(slice.toDataURL('image/jpeg',0.97),'JPEG',10,10,190,slice.height*190/slice.width);offset=end;
 }
 }finally{wrapper.remove()}
 }
 return pdf;
}
