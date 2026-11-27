// Draft 02 suggestions. LanguageProvider still requires approval on the live site.
const rows = {
  caringOthers: ['Caring for Others','Menjaga Orang Lain','照顾他人'],
  caringFamily: ['Caring for Yourself & Your Family','Menjaga Diri dan Keluarga','照顾自己与家人'],
  connecting: ['Connecting & Contributing','Berhubung dan Menyumbang','联系与贡献'],
  pathways: ['Explore support options','Terokai pilihan sokongan','探索支持选项'],
  training: ['Caregiver Education & Training','Pendidikan dan Latihan Penjaga','照护者教育与培训'],
  wellbeing: ['Caregiver Wellbeing & Resilience','Kesejahteraan dan Daya Tahan Penjaga','照护者身心健康与韧性'],
  family: ['Family Support & Shared Caregiving','Sokongan Keluarga dan Penjagaan Bersama','家庭支持与共同照护'],
  communication: ['Effective Communication in Dementia Care','Komunikasi Berkesan dalam Penjagaan Demensia','失智症照护中的有效沟通'],
  trainingIntro: ['Explore webinars and courses to develop caregiving knowledge and skills.','Terokai webinar dan kursus untuk membina pengetahuan serta kemahiran penjagaan.','探索网络研讨会和课程，培养照护知识与技能。'],
  wellbeingIntro: ['Looking after yourself is part of caring for someone else.','Menjaga diri adalah sebahagian daripada menjaga orang lain.','照顾自己也是照顾他人的一部分。'],
  familyIntro: ['Supporting the person living with dementia, the primary caregiver and the family.','Menyokong individu yang hidup dengan demensia, penjaga utama dan keluarga.','支持失智症患者、主要照护者及家人。'],
  webinars: ['Learn through Webinars','Belajar melalui Webinar','通过网络研讨会学习'],
  courses: ['Develop Your Skills','Kembangkan Kemahiran Anda','提升您的技能'],
  exploreWebinars: ['Explore Webinars','Terokai Webinar','探索网络研讨会'],
  exploreCourses: ['Explore Courses','Terokai Kursus','探索课程'],
  familyNotice: ['DCS–Family provides foundational education and an RCBC Certificate of Attendance; it is not a professional qualification.','DCS–Family menyediakan pendidikan asas dan Sijil Kehadiran RCBC; ia bukan kelayakan profesional.','DCS–Family 提供基础教育及 RCBC 出席证书，并非专业资格。'],
  workerNotice: ['DCS–Worker is a future programme requiring DCS–Family completion; certification is subject to programme requirements.','DCS–Worker ialah program masa hadapan yang memerlukan tamat DCS–Family; pensijilan tertakluk pada syarat program.','DCS–Worker 是未来课程，须完成 DCS–Family；认证须符合课程要求。'],
  findGroup: ['Find a Support Group','Cari Kumpulan Sokongan','寻找支持小组'],
  publicGroup: ['Public','Awam','公共'],
  groupNotice: ['Contact groups directly. Inclusion in the directory is not an endorsement or guarantee by RCBC.','Hubungi kumpulan secara langsung. Penyenaraian bukan pengesahan atau jaminan RCBC.','请直接联系小组。列入名录并不代表 RCBC 的认可或保证。'],
  pending: ['Resources will be added after professional review and RCBC approval.','Sumber akan ditambah selepas semakan profesional dan kelulusan RCBC.','资源将在专业审核及 RCBC 批准后添加。'],
  assessment: ['Caregiver self-assessment','Penilaian kendiri penjaga','照护者自我评估'],
  assessmentNotice: ['Future resources for awareness and guidance, not diagnosis. No assessment or scoring is available yet.','Sumber masa hadapan untuk kesedaran dan panduan, bukan diagnosis. Penilaian dan skor belum tersedia.','未来资源用于认识与指导，并非诊断。目前不提供评估或评分。'],
  resources: ['Practical family caregiving tools','Alat praktikal penjagaan keluarga','家庭照护实用工具'],
  professional: ['Find medical, professional and respite support','Cari sokongan perubatan, profesional dan penjagaan sementara','寻找医疗、专业及暂托支持'],
  references: ['References and further reading','Rujukan dan bacaan lanjut','参考资料与延伸阅读'],
  reviewed: ['Last reviewed','Semakan terakhir','最近审核'],
  missionObjectives: ['Our Mission, Vision & Objectives','Misi, Visi dan Objektif Kami','我们的使命、愿景与目标'],
  objectivesTitle: ['Objectives','Objektif','目标'],
  workingWording: ['Working wording, subject to RCBC confirmation.','Draf pernyataan, tertakluk pada pengesahan RCBC.','暂定文字，须经 RCBC 确认。'],
  contributorsPending: ['Contributor details will be added after RCBC confirmation.','Butiran penyumbang akan ditambah selepas pengesahan RCBC.','贡献者资料将在 RCBC 确认后添加。'],
  volunteerTitle: ['Become a Volunteer','Jadi Sukarelawan','成为志愿者'],
  volunteerIntro: ['People who have completed DCS–Family may express interest in future Alzheimer’s Care Project initiatives.','Individu yang telah menamatkan DCS–Family boleh menyatakan minat dalam inisiatif Projek Penjagaan Alzheimer pada masa hadapan.','已完成 DCS–Family 的人士可登记参与未来阿尔茨海默病照护项目的意向。'],
  volunteerBoundary: ['Registration expresses interest only. It does not assign a role or authorise independent dementia care.','Pendaftaran hanya menyatakan minat. Ia tidak memberikan peranan atau kebenaran untuk penjagaan demensia secara bebas.','登记仅表示意向，不代表岗位安排或独立提供失智症照护的授权。'],
  register: ['Register Your Interest','Daftar Minat Anda','登记您的意向'],
  closed: ['Registration is not open yet.','Pendaftaran belum dibuka.','登记尚未开放。'],
  name: ['Full name','Nama penuh','姓名'], email: ['Email','E-mel','电子邮件'], phone: ['Contact number','Nombor telefon','联系电话'], city: ['City / Location','Bandar / Lokasi','城市／地点'], languagesLabel: ['Languages','Bahasa','语言'], certificate: ['DCS–Family Certificate of Attendance No.','No. Sijil Kehadiran DCS–Family','DCS–Family 出席证书编号'], experience: ['Profession / Skills / Experience','Profesion / Kemahiran / Pengalaman','职业／技能／经验'], interest: ['Areas of interest','Bidang minat','意向领域'], availabilityLabel: ['Availability','Ketersediaan','可参与时间'],
  consent: ['I agree to be contacted about future project initiatives and to have my registration checked against training records.','Saya bersetuju untuk dihubungi tentang inisiatif projek akan datang dan semakan pendaftaran dengan rekod latihan.','我同意接收未来项目联系，并同意根据培训记录核验登记。'],
  privacy: ['Privacy Policy','Dasar Privasi','隐私政策'], terms: ['Terms of Use','Terma Penggunaan','使用条款'],
  sent: ['Your interest has been received for review.','Minat anda telah diterima untuk semakan.','您的意向已收到，待审核。'], failure: ['Registration could not be submitted. Please try again later.','Pendaftaran tidak dapat dihantar. Sila cuba lagi kemudian.','无法提交登记，请稍后重试。'], sending: ['Submitting…','Menghantar…','正在提交…'],
};
const lists = {
  wellbeingTopics: [
    ['Understanding Caregiver Stress','Memahami Tekanan Penjaga','了解照护压力'], ['Recognising Caregiver Burden & Burnout','Mengenali Beban dan Keletihan Penjaga','识别照护负担与倦怠'], ['Emotional Wellbeing','Kesejahteraan Emosi','情绪健康'], ['Building Resilience','Membina Daya Tahan','建立韧性'], ['How Am I Coping?','Bagaimana Saya Menghadapi Cabaran?','我应对得如何？'], ['Rest, Respite & Professional Support','Rehat, Penjagaan Sementara dan Sokongan Profesional','休息、暂托与专业支持'],
  ],
  wellbeingDescriptions: [
    ['Recognising the physical and emotional demands of caregiving.','Mengenali tuntutan fizikal dan emosi penjagaan.','认识照护的身心负担。'], ['Understanding when caregiving responsibilities become overwhelming.','Memahami apabila tanggungjawab penjagaan menjadi terlalu berat.','了解照护责任何时变得难以承受。'], ['Recognising emotional challenges and changing relationships.','Mengenali cabaran emosi dan perubahan hubungan.','认识情绪挑战与关系变化。'], ['Developing sustainable coping strategies and support networks.','Membina strategi daya tindak dan rangkaian sokongan.','建立可持续的应对策略与支持网络。'], ['Reflecting on how caregiving affects your wellbeing.','Merenung kesan penjagaan terhadap kesejahteraan diri.','反思照护对自身健康的影响。'], ['Finding rest, shared assistance and professional support.','Mendapatkan rehat, bantuan bersama dan sokongan profesional.','寻找休息、共同协助及专业支持。'],
  ],
  assessmentTopics: [['Caregiver Burden','Beban Penjaga','照护负担'],['Mental & Emotional Wellbeing','Kesejahteraan Mental dan Emosi','心理与情绪健康'],['Resilience & Coping','Daya Tahan dan Daya Tindak','韧性与应对']],
  familyTopics: [['Understanding Dementia as a Family','Memahami Demensia sebagai Keluarga','全家共同认识失智症'],['Communicating Within the Family','Komunikasi dalam Keluarga','家庭内部沟通'],['Sharing Caregiving Responsibilities','Berkongsi Tanggungjawab Penjagaan','分担照护责任'],['Supporting the Primary Caregiver','Menyokong Penjaga Utama','支持主要照护者'],['Family Care Planning','Perancangan Penjagaan Keluarga','家庭照护规划'],['Managing Family Relationships','Mengurus Hubungan Keluarga','管理家庭关系']],
  familyDescriptions: [['Build a shared understanding of dementia and changing care needs.','Bina pemahaman bersama tentang demensia dan keperluan penjagaan.','共同认识失智症及变化中的照护需求。'],['Discuss needs, concerns and expectations together.','Bincangkan keperluan, kebimbangan dan jangkaan bersama.','共同讨论需求、担忧和期望。'],['Consider practical, financial and emotional responsibilities.','Pertimbangkan tanggungjawab praktikal, kewangan dan emosi.','考虑实际、经济及情感责任。'],['Recognise contributions and provide relief.','Hargai sumbangan dan berikan bantuan.','认可贡献并提供分担。'],['Coordinate routines and prepare for changing needs.','Selaras rutin dan bersedia menghadapi perubahan keperluan.','协调日常安排并准备应对变化。'],['Address disagreements and changing family roles.','Tangani perselisihan dan perubahan peranan keluarga.','处理分歧及家庭角色变化。']],
  familyResources: [['Family Care Discussion Guide','Panduan Perbincangan Penjagaan Keluarga','家庭照护讨论指南'],['Shared Caregiving Responsibility Planner','Perancang Tanggungjawab Penjagaan Bersama','共同照护责任规划表'],['Weekly Care Schedule','Jadual Penjagaan Mingguan','每周照护安排'],['Family Emergency Care Plan','Pelan Penjagaan Kecemasan Keluarga','家庭紧急照护计划'],['Supporting the Primary Caregiver Checklist','Senarai Semak Sokongan Penjaga Utama','主要照护者支持清单']],
  objectives: [['Increase public awareness of Alzheimer’s disease, symptoms and early diagnosis.','Tingkatkan kesedaran tentang penyakit Alzheimer, gejala dan diagnosis awal.','提高公众对阿尔茨海默病、症状与早期诊断的认识。'],['Educate caregivers to provide effective support for people living with Alzheimer’s disease.','Didik penjaga untuk memberi sokongan berkesan kepada individu yang hidup dengan Alzheimer.','教育照护者为阿尔茨海默病患者提供有效支持。'],['Develop continuing care and support with healthcare facilities and community organisations.','Bangunkan penjagaan dan sokongan berterusan bersama kemudahan kesihatan dan organisasi komuniti.','与医疗机构及社区组织发展持续照护与支持。']],
  phaseTitles: [['Building the Foundation Through Human Resources','Membina Asas Melalui Sumber Manusia','通过人力资源奠定基础'],['Developing Digital Support System','Membangunkan Sistem Sokongan Digital','发展数字支持系统'],['Future Development','Pembangunan Masa Hadapan','未来发展']],
};
export function applyCaregiverDraft(translations) {
  ['en','ms','zh'].forEach((lang,i) => {
    const d = Object.fromEntries(Object.entries(rows).map(([k,v])=>[k,v[i]]));
    for (const [k,v] of Object.entries(lists)) d[k]=v.map(row=>row[i]);
    translations[lang].caregiverDraft=d;
    Object.assign(translations[lang].header.menu,{caregiverTraining:d.training,caregiverWellbeing:d.wellbeing,familySupport:d.family});
    const phase=translations[lang].aboutProject.journeySteps?.[2];
    if(phase){phase.title=d.phaseTitles[2];phase.text='';}
  });
}
