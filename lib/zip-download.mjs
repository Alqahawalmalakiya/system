// Standard ZIP (stored entries). PDFs are already compressed. UTF-8 filenames.
const crcTable=Uint32Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0});
const crc32=bytes=>{let crc=0xffffffff;for(const b of bytes)crc=crcTable[(crc^b)&255]^(crc>>>8);return (crc^0xffffffff)>>>0};
const header=size=>{const bytes=new Uint8Array(size);return {bytes,view:new DataView(bytes.buffer)}};
export async function makeZip(files){
 const parts=[],central=[];let offset=0,centralSize=0;
 if(files.length>65535)throw Error('عدد الملفات أكبر من الحد المسموح');
 for(const file of files){
  const name=new TextEncoder().encode(file.name),data=new Uint8Array(await file.blob.arrayBuffer());
  if(data.length>0xffffffff||offset+data.length>0xffffffff)throw Error('حجم الملف كبير جدًا؛ حمّل الشهر على دفعات');
  const crc=crc32(data),local=header(30),directory=header(46);
  local.view.setUint32(0,0x04034b50,true);local.view.setUint16(4,20,true);local.view.setUint16(6,0x800,true);
  local.view.setUint16(12,33,true);local.view.setUint32(14,crc,true);local.view.setUint32(18,data.length,true);local.view.setUint32(22,data.length,true);local.view.setUint16(26,name.length,true);
  directory.view.setUint32(0,0x02014b50,true);directory.view.setUint16(4,20,true);directory.view.setUint16(6,20,true);directory.view.setUint16(8,0x800,true);directory.view.setUint16(14,33,true);
  directory.view.setUint32(16,crc,true);directory.view.setUint32(20,data.length,true);directory.view.setUint32(24,data.length,true);directory.view.setUint16(28,name.length,true);directory.view.setUint32(42,offset,true);
  parts.push(local.bytes,name,data);central.push(directory.bytes,name);offset+=30+name.length+data.length;centralSize+=46+name.length;
 }
 const end=header(22);end.view.setUint32(0,0x06054b50,true);end.view.setUint16(8,files.length,true);end.view.setUint16(10,files.length,true);end.view.setUint32(12,centralSize,true);end.view.setUint32(16,offset,true);
 return new Blob([...parts,...central,end.bytes],{type:'application/zip'});
}
