import {dcsProgrammeRecords} from '../../../../shared/programme-intakes';
import { useState } from "react";
import Activities from "../../../trainer-portal/pages/Activities";
import TrackEditor from './TrackEditor';
import TrackApplications from './TrackApplications';
import './PhysicalEducationAdmin.css';
import {isPlannedProgramme,canActivateProgramme,programmeLink} from '../../../../shared/programme-intakes';

export default function PhysicalEducationAdmin({ content, onSave }) {
  const [selectedId,setSelectedId]=useState('');
  const [editingProg,setEditingProg]=useState(null);
  const [errors,setErrors]=useState({});
  const [searchQuery,setSearchQuery]=useState('');
  const programmes=dcsProgrammeRecords(content?.physicalEducation?.programmes||[]);
  // Open Edit Modal
  const openEdit = (prog) => {
    setErrors({});
    const hl = Array.isArray(prog.highlights) ? prog.highlights.join("\n") : prog.highlights || "";
    setEditingProg({
      isNew: false,
      values: {...JSON.parse(JSON.stringify(prog)),availability:prog.availability||(isPlannedProgramme(prog)?'planned':'available')},
      rawHighlights: hl,
    });
  };

  // Save Modal
  const handleSaveModal = async () => {
    const v = editingProg.values;
    const errs = {};
    const previous=programmes.find(p=>p.id===v.id);
    if(previous&&isPlannedProgramme(previous)&&!isPlannedProgramme(v)) {
      try {
        const response=await fetch('/api/activities',{cache:'no-store'});
        if(!response.ok)throw Error();
        const rows=await response.json();
        // The public endpoint only returns published, content-approved records.
        const events=Array.isArray(rows)?rows.map(e=>({content_approval_status:'approved',...e})):rows;
        if(!Array.isArray(events)||!canActivateProgramme(previous,v,events))
          errs.availability='Activation requires a future published intake with explicit RCBC approval.';
      } catch {
        errs.availability='Unable to verify intake approval. Programme activation has been blocked.';
      }
    }
    if (!v.code?.trim()) errs.code = "Please enter a track code (e.g. DCS-Family).";
    if (!v.title?.trim()) errs.title = "Please enter the programme title.";
    if (!v.roleCategory?.trim()) errs.roleCategory = "Please specify who this track is designed for.";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return false;
    }

    const hlArray = (editingProg.rawHighlights || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const updatedProg = {
      ...v,
      highlights: hlArray,
    };

    const copy = JSON.parse(JSON.stringify(content));
    if (!copy.physicalEducation) copy.physicalEducation = { programmes: [] };
    if (!Array.isArray(copy.physicalEducation.programmes)) copy.physicalEducation.programmes = [];

    const index = copy.physicalEducation.programmes.findIndex(programme=>programme.id===updatedProg.id);
    if(index<0)return false;
    copy.physicalEducation.programmes[index]=updatedProg;

    const ok = await onSave(copy);
    if (ok) setEditingProg(null);
    return ok;
  };

  const selected=programmes.find(p=>p.id===selectedId);
  if(editingProg)return <TrackEditor editing={editingProg} onChange={setEditingProg} onSave={handleSaveModal} onClose={()=>setEditingProg(null)} errors={errors}/>;
  return <div className="physical-education-admin">
    <header className="tp-card"><h2>Physical Education programmes</h2><p>Edit what people learn, then schedule intakes. Trainer Portal access is managed separately.</p></header>
    {selected?<section><button className="tp-btn tp-btn-ghost" onClick={()=>setSelectedId('')}>← All programmes</button><h2>{selected.code} — Intakes &amp; registration</h2>{isPlannedProgramme(selected)&&<p className="tp-note">Planned programme: prepare an intake with registration closed, review and publish it in the event editor, then activate this programme. Registration remains inactive until activation.</p>}<p>Each intake has its own date, venue, fee and participants. Published intakes also appear in the shared calendar.</p>
      {<Activities key={selected.id} admin programmeId={selected.id} initialFilterMode="Physical" pageTitle={selected.code+' intakes'} newButtonLabel={isPlannedProgramme(selected)?'+ Prepare future intake':'+ Add intake'} defaultValues={{mode:'Physical',type:'Workshop',programmeId:selected.id,title:selected.code+' — ',registrationType:'paid',registrationMethod:'closed',language:selected.language||'',audience:selected.suitableFor||selected.roleCategory||''}}/>}
    </section>:<section aria-label="Programmes"><label className="tp-field">Search programmes<input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Programme code or title"/></label>
    <div className="programme-admin-grid">{programmes.filter(p=>(p.code+' '+p.title).toLowerCase().includes(searchQuery.toLowerCase())).map(p=><article className="tp-card" key={p.id}><span className="track-kicker">{p.trackNumber} · {isPlannedProgramme(p)?'Planned programme':'Education programme'}</span><h3>{p.code} — {p.title}</h3><p>{p.roleCategory}</p><p>{p.shortIntro}</p><p>{p.sessions} · {p.language}</p><div className="tp-actions"><button className="tp-btn tp-btn-ghost" onClick={()=>openEdit(p)}>Edit programme</button><button className="tp-btn" onClick={()=>setSelectedId(p.id)}>Manage intakes</button><a href={programmeLink(p)}>Permanent programme link</a></div></article>)}</div></section>}
    <details className="tp-note"><summary>Other physical events and existing unlinked intakes</summary><p>Edit an existing event to link it to its programme, rather than creating a duplicate.</p><Activities admin programmeId="" initialFilterMode="Physical" pageTitle="Other physical events" defaultValues={{mode:'Physical',type:'Workshop'}}/></details>
    <details className="tp-note"><summary>Legacy applications (read-only archive)</summary><TrackApplications/></details>
  </div>;
}
