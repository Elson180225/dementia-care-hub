import { useId, useState } from 'react';
import { Field } from './ui';
import FormFeedback from '../components/FormFeedback';

// Pending applicants do not yet have a portal session. Submit the optional file
// with registration/amendment credentials instead of opening public uploads.
export default function CertificateEvidenceInput({value,onChange,onBusyChange,onError,disabled,hasExisting}) {
 const id=useId();
 const [error,setError]=useState('');
 async function choose(event) {
  const input=event.currentTarget, file=input.files?.[0];
  if(!file) return;
  setError('');onError('');onBusyChange(true);
  try {
   if(file.size>8388608) throw new Error('Certificate file must be 8 MB or smaller.');
   if(!/\.(png|jpe?g|webp|pdf)$/i.test(file.name)) throw new Error('Choose a PNG, JPEG, WebP or PDF certificate.');
   if(file.name.length>150) throw new Error('Shorten the filename to 150 characters or fewer.');
   const data=await new Promise((resolve,reject)=>{
    const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(new Error('The file could not be read. Please choose it again.'));reader.readAsDataURL(file);
   });
   onChange({name:file.name,data});
  } catch(failure) {setError(failure.message);onError(failure.message);onChange(null);}
  finally {input.value='';onBusyChange(false);}
 }
 return <Field id={id} label="Certificate image or PDF (optional)" example="Upload a clear photo or scan showing your name and certificate reference. RCBC uses it for verification; it is not published. PNG, JPEG, WebP or PDF, up to 8 MB.">
  <input id={id} type="file" accept=".png,.jpg,.jpeg,.webp,.pdf" onChange={choose} disabled={disabled}/>
  <p>{value ? `Ready to submit: ${value.name}` : hasExisting ? 'Certificate evidence is already on file. Selecting a new file replaces it when you submit amendments.' : 'You can attach a certificate photo or PDF for RCBC review.'}</p>
  {value && <button type="button" className="tp-btn tp-btn-ghost" disabled={disabled} onClick={()=>{onChange(null);setError('');onError('');}}>Remove selected file</button>}
  {error && <><FormFeedback>{error}</FormFeedback><button type="button" className="tp-btn tp-btn-ghost" onClick={()=>{setError('');onError('');}}>Continue without this file</button></>}
 </Field>;
}
