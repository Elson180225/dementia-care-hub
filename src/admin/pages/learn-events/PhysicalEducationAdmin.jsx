import { useState } from "react";
import Activities from "../../../trainer-portal/pages/Activities";
import TrackEditor from './TrackEditor';
import TrackApplications from './TrackApplications';
import './PhysicalEducationAdmin.css';
import {isPlannedProgramme} from '../../../../shared/programme-intakes';

const BLANK_PROGRAMME = {
  id: "",
  code: "",
  trackNumber: "Track 01",
  title: "",
  roleCategory: "",
  availability: "available",
  badge: "Education programme",
  shortIntro: "",
  suitableFor: "",
  description: "",
  mode: "In-Person Physical Workshop",
  sessions: "1 Full Day (9:00 AM – 6:00 PM)",
  language: "English / Bahasa Melayu / 中文",
  location: "Kuching",
  schedule: {
    date: "",
    time: "9:00 AM – 5:00 PM",
    label: "Scheduled Intake",
  },
  image: "",
  highlights: [],
  buttonLabel: "Register for Programme",
  registrationOpen: true,
};

export default function PhysicalEducationAdmin({ content, onSave }) {
  const [selectedId,setSelectedId]=useState('');
  const [editingProg,setEditingProg]=useState(null);
  const [errors,setErrors]=useState({});
  const [searchQuery,setSearchQuery]=useState('');
  const programmes=content?.physicalEducation?.programmes||[];
  // Open Edit Modal
  const openEdit = (prog) => {
    setErrors({});
    const hl = Array.isArray(prog.highlights) ? prog.highlights.join("\n") : prog.highlights || "";
    setEditingProg({
      isNew: false,
      values: {...JSON.parse(JSON.stringify(prog)),availability:isPlannedProgramme(prog)?'planned':'available'},
      rawHighlights: hl,
    });
  };

  // Open Create Modal
  const openCreate = () => {
    setErrors({});
    const nextNum = programmes.length + 1;
    const pad = nextNum < 10 ? `0${nextNum}` : `${nextNum}`;
    setEditingProg({
      isNew: true,
      values: {
        ...BLANK_PROGRAMME,
        id: `dcs-track-${Date.now()}`,
        trackNumber: `Track ${pad}`,
      },
      rawHighlights: "",
    });
  };

  // Save Modal
  const handleSaveModal = async () => {
    const v = editingProg.values;
    const errs = {};
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

    if (editingProg.isNew) {
      copy.physicalEducation.programmes.push(updatedProg);
    } else {
      const idx = copy.physicalEducation.programmes.findIndex((p) => p.id === updatedProg.id);
      if (idx >= 0) {
        copy.physicalEducation.programmes[idx] = updatedProg;
      } else {
        copy.physicalEducation.programmes.push(updatedProg);
      }
    }

    const ok = await onSave(copy);
    if (ok) setEditingProg(null);
    return ok;
  };

  const selected=programmes.find(p=>p.id===selectedId);
  if(editingProg)return <TrackEditor editing={editingProg} onChange={setEditingProg} onSave={handleSaveModal} onClose={()=>setEditingProg(null)} errors={errors}/>;
  return <div className="physical-education-admin">
    <header className="tp-card"><h2>Physical Education programmes</h2><p>Edit what people learn, then schedule intakes. Trainer Portal access is managed separately.</p><button className="tp-btn" onClick={openCreate}>Add programme</button></header>
    {selected?<section><button className="tp-btn tp-btn-ghost" onClick={()=>setSelectedId('')}>← All programmes</button><h2>{selected.code} — Intakes &amp; registration</h2>{isPlannedProgramme(selected)&&<p className="tp-note">Planned programme: you can prepare intake drafts, but registration stays closed until RCBC changes programme availability.</p>}<p>Each intake has its own date, venue, fee and participants. Published intakes also appear in the shared calendar.</p>
      <Activities key={selected.id} admin programmeId={selected.id} initialFilterMode="Physical" pageTitle={selected.code+' intakes'} newButtonLabel="+ Add intake" defaultValues={{mode:'Physical',type:'Workshop',programmeId:selected.id,title:selected.code+' — ',registrationType:'paid-in-person',registrationMethod:'closed',language:selected.language||'',audience:selected.suitableFor||selected.roleCategory||''}}/>
    </section>:<section aria-label="Programmes"><label className="tp-field">Search programmes<input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Programme code or title"/></label>
    <div className="programme-admin-grid">{programmes.filter(p=>(p.code+' '+p.title).toLowerCase().includes(searchQuery.toLowerCase())).map(p=><article className="tp-card" key={p.id}><span className="track-kicker">{p.trackNumber} · {isPlannedProgramme(p)?'Planned programme':'Education programme'}</span><h3>{p.code} — {p.title}</h3><p>{p.roleCategory}</p><p>{p.shortIntro}</p><p>{p.sessions} · {p.language}</p><div className="tp-actions"><button className="tp-btn tp-btn-ghost" onClick={()=>openEdit(p)}>Edit programme</button><button className="tp-btn" onClick={()=>setSelectedId(p.id)}>Manage intakes</button></div></article>)}</div></section>}
    <details className="tp-note"><summary>Other physical events and existing unlinked intakes</summary><p>Edit an existing event to link it to its programme, rather than creating a duplicate.</p><Activities admin programmeId="" initialFilterMode="Physical" pageTitle="Other physical events" defaultValues={{mode:'Physical',type:'Workshop'}}/></details>
    <details className="tp-note"><summary>Legacy applications (read-only archive)</summary><TrackApplications/></details>
  </div>;
}
