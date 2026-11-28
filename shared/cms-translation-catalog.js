/** Sparse CMS English → Malay / Chinese for learn_events_content catalogue keys. */

const bySource = {
  'RCBC annual webinar series': {
    ms: 'Siri webinar tahunan RCBC',
    zh: 'RCBC年度网络讲座系列',
  },
  'Previous & future public education webinars': {
    ms: 'Webinar pendidikan awam terdahulu & akan datang',
    zh: '往期与未来公众教育网络讲座',
  },
  'Certified Trainer webinar': {
    ms: 'Webinar Jurulatih Bertauliah',
    zh: '认证培训师网络讲座',
  },
  'DCS-Family webinar': {
    ms: 'Webinar DCS–Family',
    zh: 'DCS–Family 网络讲座',
  },
  'Learning resources': {
    ms: 'Sumber pembelajaran',
    zh: '学习资源',
  },
  'Approved learning materials': {
    ms: 'Bahan pembelajaran diluluskan',
    zh: '已批准学习材料',
  },
  'RCBC & ADFM Specialists': {
    ms: 'Pakar RCBC & ADFM',
    zh: 'RCBC 与 ADFM 专家',
  },
  '9 ADFM-certified facilitators (poster roster)': {
    ms: '9 fasilitator bertauliah ADFM (senarai poster)',
    zh: '九位 ADFM 认证引导者（海报名册）',
  },
  'Dr. Tiong Ing Khieng & ADFM Training Team': {
    ms: 'Dr. Tiong Ing Khieng & Pasukan Latihan ADFM',
    zh: '程英庆医生与 ADFM 培训团队',
  },
  'Foundation Dementia Care Course (DCS-Family)': {
    ms: 'Kursus Penjagaan Demensia Asas (DCS–Family)',
    zh: '基础失智照护课程（DCS–Family）',
  },
  'Foundation Dementia Care Course for Family Caregivers covering 6 core modules, delivered by nine ADFM-certified facilitators with public healthcare experience. Pre-requisite for ADFM DCS-TTT certification. Limited to 100 seats only (subsidized from RM1,200 to RM120/pax). CPD points available.':
    {
      ms: 'Kursus Penjagaan Demensia Asas untuk Penjaga Keluarga merangkumi 6 modul teras, disampaikan oleh sembilan fasilitator bertauliah ADFM dengan pengalaman penjagaan kesihatan awam. Prasyarat untuk pensijilan ADFM DCS-TTT. Terhad kepada 100 tempat sahaja (disubsidi daripada RM1,200 kepada RM120/orang). Mata CPD tersedia.',
      zh: '面向家庭照护者的基础失智照护课程涵盖六个核心模块，由九位具有公共医疗经验的 ADFM 认证引导者授课。为 ADFM DCS-TTT 认证的先修课程。限额 100 名（补贴后每人 RM120，原价 RM1,200）。可申请 CPD 学分。',
    },
  'RCBC & ADFM Certified': {
    ms: 'Diperakui RCBC & ADFM',
    zh: 'RCBC 与 ADFM 认证',
  },
  'Meet your facilitators.': {
    ms: 'Kenali fasilitator anda.',
    zh: '认识您的引导者。',
  },
  'Experienced medical professionals certified under the Dementia Care Series (DCS-TTT) framework — bringing real caregiving knowledge to every session.':
    {
      ms: 'Profesional perubatan berpengalaman yang diperakui di bawah rangka kerja Dementia Care Series (DCS–TTT) — membawa pengetahuan penjagaan sebenar ke setiap sesi.',
      zh: '在 Dementia Care Series（DCS–TTT）框架下获得认证的经验丰富的医疗专业人员——为每场课程带来实实在在的照护知识。',
    },
  'ADFM & Rotary Framework': {
    ms: 'Rangka Kerja ADFM & Rotary',
    zh: 'ADFM 与扶轮框架',
  },
  "Collaborative mission between Rotary Club of Bintulu Central and Alzheimer's Disease Foundation Malaysia (ADFM) to deliver certified dementia care education.":
    {
      ms: 'Misi kerjasama antara Kelab Rotary Bintulu Central dan Alzheimer’s Disease Foundation Malaysia (ADFM) untuk menyampaikan pendidikan penjagaan demensia bertauliah.',
      zh: '民都鲁中央扶轮社与马来西亚阿尔茨海默症基金会（ADFM）合作，提供认证的失智照护教育。',
    },
  'Alzheimer’s Disease Foundation Malaysia (ADFM) is RCBC’s Strategic Partner and Training Facilitator for the Dementia Care Skills programmes, including DCS-Family, DCS-TTT and future DCS-Careworker.':
    {
      ms: 'Alzheimer’s Disease Foundation Malaysia (ADFM) ialah Rakan Strategik dan Fasilitator Latihan RCBC untuk program Kemahiran Penjagaan Demensia, termasuk DCS–Family, DCS–TTT dan DCS–Careworker pada masa hadapan.',
      zh: '马来西亚阿尔茨海默症基金会（ADFM）是 RCBC 的战略合作伙伴及 Dementia Care Skills 课程（含 DCS–Family、DCS–TTT 与未来 DCS–Careworker）的培训引导方。',
    },
  'ADFM is a member of Alzheimer’s Disease International (ADI). This does not mean that ADI issues individual programme certificates.':
    {
      ms: 'ADFM ialah ahli Alzheimer’s Disease International (ADI). Ini tidak bermakna ADI mengeluarkan sijil program individu.',
      zh: 'ADFM 为阿尔茨海默病国际（ADI）成员。这并不意味着 ADI 颁发个人课程证书。',
    },
};

const byKey = {
  'cms/physicalEducation/partnershipHeading': {
    ms: 'Maklumat ADFM & ADI',
    zh: 'ADFM 与 ADI 信息',
  },
  'cms/physicalEducation/partnershipIntro': {
    ms: 'Kerjasama rasmi antara RCBC, ADFM dan rujukan ADI untuk program Dementia Care Skills.',
    zh: 'RCBC、ADFM 及 ADI 参考资料就 Dementia Care Skills 课程的官方合作说明。',
  },
};

export function cmsTranslationForSource(key, source, language) {
  if (!source || !['ms', 'zh'].includes(language)) return '';
  const fromSource = bySource[source]?.[language];
  if (fromSource) return fromSource;
  return byKey[key]?.[language] || '';
}