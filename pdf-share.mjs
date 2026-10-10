/** @param {Blob} blob @param {string} invoiceNumber */
export function invoicePdfFile(blob,invoiceNumber){
 const safeNumber=invoiceNumber.replace(/[^a-zA-Z0-9_-]/g,'');
 return new File([blob],'القهوة-الملكية-'+safeNumber+'.pdf',{type:'application/pdf'});
}
/** @param {File} file */
export function downloadPdfFile(file){
 const url=URL.createObjectURL(file);const a=document.createElement('a');a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
/** Share only the actual PDF, with no text, page URL, or link fallback.
 * Call directly from a user click once the PDF has been prepared.
 * @param {File} file @param {Navigator} nav @param {(file:File)=>void} save
 */
export async function sharePdfFile(file,nav=navigator,save=downloadPdfFile){
 if(typeof nav.share!=='function'||typeof nav.canShare!=='function'||!nav.canShare({files:[file]})){save(file);return 'downloaded';}
 try{await nav.share({files:[file]});return 'shared';}
 catch(error){if(error&&typeof error==='object'&&'name' in error&&error.name==='AbortError')return 'cancelled';save(file);return 'downloaded';}
}
