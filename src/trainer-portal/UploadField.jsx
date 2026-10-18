import { useState } from 'react';
export default function UploadField({label,kind,value=[],onChange,multiple=false,disabled=false,onBusyChange}) {
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const links=Array.isArray(value)?value:value?[value]:[];
 async function upload(event) {
  const files=Array.from(event.target.files || []);setBusy(true);onBusyChange?.(true);setError('');const added=[];
  try {
   for(const file of files) {
    if(file.size>8388608) throw new Error('Each file must be 8 MB or smaller');
    const response=await fetch('/api/uploads?kind='+kind,{method:'POST',headers:{'Content-Type':file.type,'X-File-Name':encodeURIComponent(file.name)},body:file});
    const result=await response.json();if(!response.ok) throw new Error(result.error);added.push(result.url);
   }
  }catch(e){setError(e.message);}
  finally {if(added.length) onChange(multiple?[...links,...added]:added[0]);setBusy(false);onBusyChange?.(false);event.target.value='';}
 }
 return <fieldset className="tp-upload"><legend>{label}</legend><p>PNG, JPEG, WebP{kind==='document'?' or PDF':''}. Maximum 8 MB each.</p>
 <input aria-label={label} type="file" accept={kind==='document'?'.png,.jpg,.jpeg,.webp,.pdf':'.png,.jpg,.jpeg,.webp'} multiple={multiple} disabled={disabled || busy} onChange={upload}/>
 {busy && <p role="status">Uploading...</p>}{error && <p role="alert">{error}</p>}
 <ul>{links.filter(Boolean).map((link,i)=><li key={link+i}><a href={link} target="_blank" rel="noreferrer">View {kind} {i+1}</a>{!disabled && <button type="button" className="tp-btn tp-btn-ghost" onClick={()=>onChange(multiple?links.filter((_,j)=>i!==j):'')}>Remove</button>}</li>)}</ul></fieldset>;
}
