import {isPlannedProgramme} from '../../shared/programme-intakes';
import Trans from '../i18n/Trans';
import {educationCopy as copy} from '../i18n/educationCopy';

const extraFields = [
 ['objectives', 'educationObjectives', copy.educationObjectives],
 ['prerequisites', 'educationPrerequisites', copy.educationPrerequisites],
 ['facilitator', 'educationFacilitators', copy.educationFacilitators],
 ['assessment', 'educationAssessment', copy.educationAssessment],
 ['certificate', 'educationCertificate', copy.educationCertificate],
];

const roles = {
 'dcs-family': ['educationRoleStart', copy.educationRoleStart],
 'dcs-ttt': ['educationRoleTrainer', copy.educationRoleTrainer],
 'dcs-care-worker': ['educationRoleFuture', copy.educationRoleFuture],
};

const factSets = {
 'dcs-family': [
  ['educationFactPrerequisite', copy.educationFactPrerequisite, 'educationFamilyPrerequisite', copy.educationFamilyPrerequisite],
  ['educationFactCertificate', copy.educationFactCertificate, 'educationFamilyCertificate', copy.educationFamilyCertificate],
  ['educationFactDates', copy.educationFactDates, 'educationIntakeDetails', copy.educationIntakeDetails],
 ],
 'dcs-ttt': [
  ['educationFactPrerequisite', copy.educationFactPrerequisite, 'educationAdvancedPrerequisite', copy.educationAdvancedPrerequisite],
  ['educationFactCertificate', copy.educationFactCertificate, 'educationTttCertificate', copy.educationTttCertificate],
  ['educationFactDates', copy.educationFactDates, 'educationIntakeDetails', copy.educationIntakeDetails],
 ],
 'dcs-care-worker': [
  ['educationFactStatus', copy.educationFactStatus, 'educationFuture', copy.educationFuture],
  ['educationFactPrerequisite', copy.educationFactPrerequisite, 'educationAdvancedPrerequisite', copy.educationAdvancedPrerequisite],
  ['educationFactDetails', copy.educationFactDetails, 'educationPending', copy.educationPending],
 ],
};

export function pathwayRole(id) {
 const role = roles[id];
 return role ? {id: role[0], text: role[1]} : null;
}

export function DcsPathwayLine() {
 return <p className="dcs-pathway-line"><Trans id="educationPathway">{copy.educationPathway}</Trans></p>;
}

function Fact({labelId, label, valueId, value}) {
 return <article>
  <h3><Trans id={labelId}>{label}</Trans></h3>
  <p><Trans id={valueId}>{value}</Trans></p>
 </article>;
}

export function DcsCourseDetails({programme}) {
 const planned = isPlannedProgramme(programme);
 const facts = factSets[programme.id] || factSets['dcs-family'];
 const supplied = planned ? [] : extraFields.filter(([key]) => typeof programme[key] === 'string' && programme[key].trim());
 return <section className="dcs-before" aria-labelledby="before-register">
  <h2 id="before-register"><Trans id="educationBeforeRegister">{copy.educationBeforeRegister}</Trans></h2>
  <div className="dcs-facts">
   {facts.map(([labelId, label, valueId, value]) => <Fact key={valueId} labelId={labelId} label={label} valueId={valueId} value={value}/>)}
   {supplied.map(([key, labelId, label]) => <article key={key}>
    <h3><Trans id={labelId}>{label}</Trans></h3>
    <p>{programme[key]}</p>
   </article>)}
  </div>
 </section>;
}

export function AdfmPartnership({variant='section'}) {
 const className = variant === 'inline' ? 'dcs-partner dcs-partner-inline' : 'dcs-partner';
 return <aside className={className} aria-labelledby={variant === 'inline' ? 'adfm-partnership-inline' : 'adfm-partnership'}>
  <h2 id={variant === 'inline' ? 'adfm-partnership-inline' : 'adfm-partnership'}>ADFM Training Partnership</h2>
  <p><Trans id="educationAdfm">{copy.educationAdfm}</Trans></p>
  <p><Trans id="educationAdi">{copy.educationAdi}</Trans></p>
  <p><Trans id="educationAccreditationPending">{copy.educationAccreditationPending}</Trans></p>
  <p className="dcs-partner-links">
   <a href="https://www.adfm.org.my/" target="_blank" rel="noopener noreferrer"><Trans id="educationAdfmSite">{copy.educationAdfmSite}</Trans></a>
   <a href="https://www.alzint.org/" target="_blank" rel="noopener noreferrer"><Trans id="educationAdiSite">{copy.educationAdiSite}</Trans></a>
  </p>
 </aside>;
}
