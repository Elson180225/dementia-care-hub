import {Link} from 'react-router-dom';
import {isPlannedProgramme,programmeLink} from '../../shared/programme-intakes';
import Trans from '../i18n/Trans';
import {useLanguage} from '../i18n/LanguageContext';
import {educationCopy as copy} from '../i18n/educationCopy';

const fields=[['objectives','Course objectives'],['prerequisites','Prerequisites'],['facilitator','Facilitator information'],['assessment','Assessment'],['certificate','Certificate information']];
function Detail({value}) {
 if(Array.isArray(value))return <ul>{value.map((item,index)=><li key={index}>{String(item)}</li>)}</ul>;
 return <p>{typeof value==='string'&&value.trim()?value:<Trans id="educationPending">{copy.educationPending}</Trans>}</p>;
}
// Parent owns selection and ?programme= handling; this component never changes the route.
export default function DcsProgrammeGuidance({programmes=[]}) {
 const {translateLabel}=useLanguage();
 return <section className="programme-intakes" aria-label="DCS programme guidance">
  <h2><Trans id="educationDcsHeading">{copy.educationDcsHeading}</Trans></h2>
  <p><Trans id="educationPathway">{copy.educationPathway}</Trans></p>
  <p><Trans id="educationFamilyCertificate">{copy.educationFamilyCertificate}</Trans></p>
  <p><Trans id="educationTttCertificate">{copy.educationTttCertificate}</Trans></p>
  <p><Trans id="educationAdfm">{copy.educationAdfm}</Trans></p>
  <p><Trans id="educationAdi">{copy.educationAdi}</Trans></p>
  <div className="programme-intake-grid">{programmes.map(programme=><article className="tp-card" key={programme.id}>
   <h3><Link to={programmeLink(programme)}>{programme.code||programme.title}</Link></h3>
   <p>{programme.title}</p><Detail value={programme.shortIntro}/>
   {programme.description&&<Detail value={programme.description}/>}
   <p><Trans id={isPlannedProgramme(programme)?'educationFuture':'educationIntakeDetails'}>{isPlannedProgramme(programme)?copy.educationFuture:copy.educationIntakeDetails}</Trans></p>
   <dl>{fields.map(([key,label])=><div key={key}><dt>{translateLabel(label)}</dt><dd><Detail value={programme[key]}/></dd></div>)}</dl>
   {programme.highlights?.length>0&&<><h4>Learning highlights</h4><Detail value={programme.highlights}/></>}
   <Link to={programmeLink(programme)}><Trans id="educationProgrammeLink">{copy.educationProgrammeLink}</Trans></Link>
  </article>)}</div>
 </section>;
}
