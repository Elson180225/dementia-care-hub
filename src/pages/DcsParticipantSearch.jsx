import {dcsProgrammes} from '../../shared/programme-intakes';
import {useEffect,useState} from 'react';
import {Link} from 'react-router-dom';
import {useLanguage} from '../i18n/LanguageContext';
import Trans from '../i18n/Trans';
import {dcsPublicCopy} from '../../shared/dcs-public-copy.js';
import './DcsParticipantSearch.css';
const Copy=({id})=><Trans id={id}>{dcsPublicCopy[id]}</Trans>;
const filterLabels={q:'dcsRegistryNameFilter',programme:'dcsRegistryProgrammeFilter',location:'dcsRegistryLocationFilter',year:'dcsRegistryYearFilter'};
export default function DcsParticipantSearch(){
 const {translateLabel}=useLanguage();
 const [form,setForm]=useState({q:'',programme:'',location:'',year:''}),[filters,setFilters]=useState(null),[page,setPage]=useState(1),[data,setData]=useState(null),[error,setError]=useState(false),[busy,setBusy]=useState(false);
 useEffect(()=>{if(!filters)return;const controller=new AbortController();setBusy(true);setError(false);setData(null);fetch('/api/public/dcs-registry?'+new URLSearchParams({...filters,page}),{signal:controller.signal}).then(async r=>{if(!r.ok)throw new Error();const v=await r.json();if(!controller.signal.aborted)setData(v);}).catch(e=>{if(e.name!=='AbortError')setError(true);}).finally(()=>{if(!controller.signal.aborted)setBusy(false);});return()=>controller.abort();},[filters,page]);
 return <main className="dcs-registry-page"><header><p><Copy id="dcsRegistryEyebrow"/></p><h1><Copy id="dcsRegistryTitle"/></h1><p><Copy id="dcsRegistryIntroduction"/></p></header>
 <nav className="dcs-hub" aria-label={translateLabel(dcsPublicCopy.dcsRegistryHubLabel,'dcsRegistryHubLabel')}>
  <Link className="dcs-hub-card" to="/learn-events/verify-certificate"><strong><Copy id="dcsRegistryVerifyCardTitle"/></strong><span><Copy id="dcsRegistryVerifyCardDesc"/></span><em><Copy id="dcsRegistryVerifyCardCta"/> →</em></Link>
  <div className="dcs-hub-card is-current" aria-current="page"><strong><Copy id="dcsRegistryBrowseCardTitle"/></strong><span><Copy id="dcsRegistryBrowseCardDesc"/></span><em><Copy id="dcsRegistryBrowseCardCurrent"/></em></div>
 </nav>
 <form className="dcs-search-form" onSubmit={e=>{e.preventDefault();setPage(1);setFilters({...form});}}>{Object.entries(filterLabels).map(([k,id])=><label key={k}><Copy id={id}/>{k==='programme'?<select value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}>
 <option value="">{translateLabel('All programmes')}</option>
 {dcsProgrammes.map(p=><option key={p.id} value={p.code}>{p.code}</option>)}
 </select>:<input type={k==='year'?'number':'text'} min={k==='year'?1000:undefined} max={k==='year'?9999:undefined} maxLength={200} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}/>}</label>)}<button type="submit" disabled={busy}><Copy id="dcsRegistrySearch"/></button></form>
 <div aria-live="polite">{busy&&<p><Copy id="dcsRegistrySearching"/></p>}{error&&<p role="alert"><Copy id="dcsRegistrySearchError"/></p>}{data&&<><p><Copy id="dcsRegistryResultCount"/> {data.total}</p><div className="dcs-results">{data.rows.map((r,i)=><article key={i}><h2>{r.name}</h2><p>{r.programme}</p><dl><dt><Copy id="dcsRegistryLocation"/></dt><dd>{r.training_location}</dd><dt><Copy id="dcsRegistryAttendanceDate"/></dt><dd>{r.attendance_date}</dd><dt><Copy id="dcsRegistryCertificateNumber"/></dt><dd>{r.certificate_ref||<Copy id="dcsRegistryNoCertificate"/>}</dd></dl></article>)}</div>{!data.rows.length&&<p><Copy id="dcsRegistryEmpty"/></p>}<nav className="dcs-pagination" aria-label={translateLabel(dcsPublicCopy.dcsRegistryPagination,'dcsRegistryPagination')}><button type="button" disabled={busy||page===1} onClick={()=>setPage(page-1)}><Copy id="dcsRegistryPrevious"/></button><span><Copy id="dcsRegistryPage"/> {page}</span><button type="button" disabled={busy||page*data.pageSize>=data.total} onClick={()=>setPage(page+1)}><Copy id="dcsRegistryNext"/></button></nav></>}</div></main>;
}