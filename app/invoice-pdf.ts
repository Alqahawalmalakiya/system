'use client';
export async function createInvoicePdf(element:HTMLElement,invoiceNumber:string){
 const [{default:html2canvas},{jsPDF}]=await Promise.all([import('html2canvas'),import('jspdf')]);
 await document.fonts.load('500 16px RoyalInvoiceArabic');await document.fonts.load('700 16px RoyalInvoiceArabic');await document.fonts.ready;
 const wrapper=document.createElement('div');wrapper.style.cssText='position:fixed;left:-10000px;top:0;width:794px;background:white;pointer-events:none;';
 const clone=element.cloneNode(true) as HTMLElement;clone.classList.add('pdf-export-sheet');wrapper.appendChild(clone);document.body.appendChild(wrapper);
 try{
 await Promise.all(Array.from(clone.querySelectorAll('img')).map(async img=>{if(img.complete&&img.naturalWidth)return;await img.decode()}));
 const rect=clone.getBoundingClientRect();
 const blocks=Array.from(clone.querySelectorAll('tr,.invoice-totals,.invoice-meta,.cancellation-note,.royal-footer')).map(e=>{const r=e.getBoundingClientRect();return {top:r.top-rect.top,bottom:r.bottom-rect.top}});
 const canvas=await html2canvas(clone,{scale:2,backgroundColor:'#ffffff',useCORS:true,logging:false,windowWidth:1100,scrollX:0,scrollY:0,onclone(doc){doc.documentElement.style.overflow='visible';doc.body.style.overflow='visible';}});
 const pdf=new jsPDF({unit:'mm',format:'a4',compress:true});pdf.setProperties({title:(invoiceNumber.startsWith('QT-')?'عرض سعر القهوة الملكية ':'فاتورة القهوة الملكية ')+invoiceNumber,author:'القهوة الملكية'});
 const ratio=canvas.width/rect.width;const maxHeight=Math.floor(canvas.width*277/190);let offset=0,page=0;
 while(offset<canvas.height){let end=Math.min(offset+maxHeight,canvas.height);for(const block of blocks){const top=Math.floor(block.top*ratio),bottom=Math.ceil(block.bottom*ratio);if(top>offset&&top<end&&bottom>end)end=top;}if(end<=offset)end=Math.min(offset+maxHeight,canvas.height);
 const slice=document.createElement('canvas');slice.width=canvas.width;slice.height=end-offset;const context=slice.getContext('2d');if(!context)throw Error('تعذر تجهيز الفاتورة');context.fillStyle='#fff';context.fillRect(0,0,slice.width,slice.height);context.drawImage(canvas,0,offset,canvas.width,slice.height,0,0,slice.width,slice.height);
 if(page++)pdf.addPage();pdf.addImage(slice.toDataURL('image/jpeg',0.97),'JPEG',10,10,190,slice.height*190/slice.width);offset=end;
 }
 return pdf;
 }finally{wrapper.remove()}
}
