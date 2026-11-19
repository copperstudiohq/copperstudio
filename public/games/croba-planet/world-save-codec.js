const PREFIX='RCZ1:';
const encoder=new TextEncoder(),decoder=new TextDecoder('utf-8',{fatal:true});
function checksum(bytes){let hash=2166136261;for(const byte of bytes)hash=Math.imul(hash^byte,16777619);return (hash>>>0).toString(16);}
function base64(bytes){const chunks=[];for(let i=0;i<bytes.length;i+=8192)chunks.push(String.fromCharCode(...bytes.subarray(i,i+8192)));return btoa(chunks.join(''));}
/** Bounded LZSS: literal groups and 12-bit backward references, never executable data. */
export function packWorldText(text) {
  if(typeof text!=='string')throw new TypeError('World save text must be a string.');
  if(text.length<4096)return text;
  const input=encoder.encode(text),output=new Uint8Array(input.length+Math.ceil(input.length/8));
  const recent=new Int32Array(65536);recent.fill(-1);
  const hash=at=>(input[at]*251+input[at+1]*31+input[at+2])&65535;
  let at=0,end=0;
  while(at<input.length){const flagIndex=end++;let flags=0;
    for(let bit=0;bit<8&&at<input.length;bit++){
      let length=0,distance=0;
      if(at+2<input.length){const previous=recent[hash(at)];if(previous>=0&&at-previous<=4095){
        while(length<18&&at+length<input.length&&input[previous+length]===input[at+length])length++;
        if(length>=3)distance=at-previous;
      }}
      const consumed=distance?length:1;
      if(distance){flags|=1<<bit;const token=(distance<<4)|(length-3);output[end++]=token>>>8;output[end++]=token&255;}
      else output[end++]=input[at];
      for(let i=0;i<consumed;i++)if(at+i+2<input.length)recent[hash(at+i)]=at+i;
      at+=consumed;
    }
    output[flagIndex]=flags;
  }
  const packed=`${PREFIX}${input.length.toString(36)}:${checksum(input)}:${base64(output.subarray(0,end))}`;
  return packed.length<text.length?packed:text;
}

/** Old plain JSON stays readable. Length, references, UTF-8 and checksum validate before parsing. */
export function unpackWorldText(text,{maxBytes=4*1024*1024+4096}={}) {
  if(typeof text!=='string')throw new TypeError('World save text must be a string.');
  if(!text.startsWith(PREFIX))return text;
  const fail=()=>{throw new Error('The compressed world save is damaged. Its stored data has been kept.');};
  if(!Number.isSafeInteger(maxBytes)||maxBytes<1||text.length>maxBytes*2)fail();
  const match=/^RCZ1:([0-9a-z]{1,8}):([0-9a-f]{1,8}):/.exec(text);if(!match)fail();
  const expected=parseInt(match[1],36);if(!Number.isSafeInteger(expected)||expected<1||expected>maxBytes)fail();
  let packed;try{packed=Uint8Array.from(atob(text.slice(match[0].length)),char=>char.charCodeAt(0));}catch{fail();}
  const output=new Uint8Array(expected);let at=0,written=0;
  while(at<packed.length){const flags=packed[at++];if(at===packed.length)fail();
    for(let bit=0;bit<8&&at<packed.length;bit++){
      if(flags&(1<<bit)){
        if(at+1>=packed.length)fail();const token=(packed[at++]<<8)|packed[at++],distance=token>>>4,length=(token&15)+3;
        if(distance===0||distance>written||written+length>expected)fail();
        for(let i=0;i<length;i++){output[written]=output[written-distance];written++;}
      }else{if(written>=expected)fail();output[written++]=packed[at++];}
      if(at===packed.length&&flags>>>(bit+1))fail();
    }
  }
  if(written!==expected||checksum(output)!==match[2])fail();
  try{return decoder.decode(output);}catch{fail();}
}
