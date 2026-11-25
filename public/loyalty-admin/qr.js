// Local, dependency-free QR code. QR v6-L handles full customer-card URLs up to 134 UTF-8 bytes.
// No third-party QR service ever sees private membership links.
const VERSION=6,SIZE=VERSION*4+17,DATA_CW=136,EC_PER_BLOCK=18,DATA_PER_BLOCK=68;
function mul(x,y){let z=0;for(let i=7;i>=0;i--){z=(z<<1)^((z>>>7)*0x11d);z^=((y>>>i)&1)*x;}return z&255;}
function divisor(degree){const r=new Uint8Array(degree);r[degree-1]=1;let root=1;for(let i=0;i<degree;i++){for(let j=0;j<degree;j++){r[j]=mul(r[j],root);if(j+1<degree)r[j]^=r[j+1];}root=mul(root,2);}return r;}
function remainder(data,div){const r=new Uint8Array(div.length);for(const b of data){const fac=b^r[0];r.copyWithin(0,1);r[r.length-1]=0;for(let j=0;j<r.length;j++)r[j]^=mul(div[j],fac);}return r;}
export function qrMatrix(text){
 const bytes=new TextEncoder().encode(text);
 if(bytes.length<1||bytes.length>134)throw Error('QR supports 1 to 134 UTF-8 bytes');
 const bits=[];const append=(x,len)=>{for(let i=len-1;i>=0;i--)bits.push((x>>>i)&1);};
 append(4,4);append(bytes.length,8);for(const v of bytes)append(v,8);
 append(0,Math.min(4,DATA_CW*8-bits.length));while(bits.length%8)bits.push(0);
 const data=[];for(let i=0;i<bits.length;i+=8){let n=0;for(let j=0;j<8;j++)n=(n<<1)|bits[i+j];data.push(n);}
 for(let i=0;data.length<DATA_CW;i++)data.push(i%2?0x11:0xec);
 const blocks=[data.slice(0,DATA_PER_BLOCK),data.slice(DATA_PER_BLOCK)];
 const div=divisor(EC_PER_BLOCK),ecc=blocks.map(b=>remainder(b,div));
 const cw=[];
 for(let i=0;i<DATA_PER_BLOCK;i++)for(const b of blocks)cw.push(b[i]);
 for(let i=0;i<EC_PER_BLOCK;i++)for(const e of ecc)cw.push(e[i]);
 const modules=Array.from({length:SIZE},()=>Array(SIZE).fill(false));
 const reserved=Array.from({length:SIZE},()=>Array(SIZE).fill(false));
 const set=(x,y,on)=>{if(x>=0&&y>=0&&x<SIZE&&y<SIZE){modules[y][x]=Boolean(on);reserved[y][x]=true;}};
 for(const [cx,cy] of [[3,3],[SIZE-4,3],[3,SIZE-4]])
  for(let dy=-4;dy<=4;dy++)for(let dx=-4;dx<=4;dx++){
   const dist=Math.max(Math.abs(dx),Math.abs(dy));set(cx+dx,cy+dy,dist!==4&&(dist===3||dist<=1));
  }
 for(let i=8;i<SIZE-8;i++){set(i,6,i%2===0);set(6,i,i%2===0);}
 // Version 6 has a single alignment pattern outside the finder areas.
 for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)set(34+dx,34+dy,Math.max(Math.abs(dx),Math.abs(dy))!==1);
 for(let i=0;i<=5;i++)set(8,i,false);
 set(8,7,false);set(8,8,false);set(7,8,false);
 for(let i=9;i<15;i++)set(14-i,8,false);
 for(let i=0;i<8;i++)set(SIZE-1-i,8,false);
 for(let i=8;i<15;i++)set(8,SIZE-15+i,false);
 set(8,SIZE-8,true);
 let index=0;
 for(let right=SIZE-1;right>=1;right-=2){
  if(right===6)right=5;
  for(let vert=0;vert<SIZE;vert++){
   const y=(((right+1)&2)===0)?SIZE-1-vert:vert;
   for(let j=0;j<2;j++){
    const x=right-j;if(reserved[y][x])continue;
    const bit=index<cw.length*8?(cw[index>>>3]>>>(7-(index&7)))&1:0;
    modules[y][x]=Boolean(bit^(((x+y)%2===0)?1:0));index++;
   }
  }
 }
 // EC level L, mask 0.
 const fmtData=(1<<3);let rem=fmtData;
 for(let i=0;i<10;i++)rem=(rem<<1)^(((rem>>>9)&1)*0x537);
 const fmt=((fmtData<<10)|rem)^0x5412;
 const bit=i=>((fmt>>>i)&1)!==0;
 for(let i=0;i<=5;i++)set(8,i,bit(i));set(8,7,bit(6));set(8,8,bit(7));set(7,8,bit(8));
 for(let i=9;i<15;i++)set(14-i,8,bit(i));
 for(let i=0;i<8;i++)set(SIZE-1-i,8,bit(i));
 for(let i=8;i<15;i++)set(8,SIZE-15+i,bit(i));
 set(8,SIZE-8,true);
 return modules;
}
export function membershipQrSvg(value){
 const matrix=qrMatrix(value),paths=[];
 for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++)if(matrix[y][x])paths.push(`M${x+4} ${y+4}h1v1h-1z`);
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE+8} ${SIZE+8}" role="img" aria-label="رمز QR لفتح البطاقة"><rect width="${SIZE+8}" height="${SIZE+8}" fill="white"/><path d="${paths.join('')}" fill="#183b31"/></svg>`;
}
