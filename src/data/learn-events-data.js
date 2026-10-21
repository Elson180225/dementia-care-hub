/* ============================================================
   EDUCATION & EVENTS — DATA LAYER
   Mock data matching the RCBC Phase 2 requirements:
   - Online Education (RCBC webinars, CT webinars, learning resources)
   - Physical Education (DCS-Family, DCS-TTT)
   - Events (Expo, Dialogue, Forum, Other)
   - Certified Trainers (Directory / Profile)
   - Upcoming Calendar (shared, all activity types)
   ============================================================ */

export const SLIDE_DURATION = 5000;

/* ---- page metadata for the 5 sections ---- */
export const pageInfo = {
  "online-education": {
    eyebrow: "Online Education",
    title: "Learn from anywhere, at your own pace.",
    intro:
      "RCBC annual webinar series, certified trainer webinars, and a growing archive of recordings, videos and Q&A resources.",
    image: "learning-events",
    imageAlt: "People taking part in an online learning session",
  },
  "physical-education": {
    eyebrow: "Physical Education",
    title: "In-person programmes for families and trainers.",
    intro:
      "Dementia Care Series (DCS) programmes delivered in person — designed for families, aspiring trainers, and future care workers.",
    image: "Group_Photo_2",
    imageAlt: "Community group learning together",
  },
  events: {
    eyebrow: "Events",
    title: "Community gatherings that bring dementia care to life.",
    intro:
      "Expos, dialogues, forums and other public events across Bintulu, Kuching and beyond.",
    image: "Get-involved-hero",
    imageAlt: "Community members supporting a care initiative",
  },
  "certified-trainers": {
    eyebrow: "Certified Trainers",
    title: "Meet the people delivering dementia education.",
    intro:
      "A directory of trainers who have completed the DCS-TTT pathway. Each profile shows their role, institution, location, language and approved activities.",
    image: "understand-dementia",
    imageAlt: "Trainer supporting a community education session",
  },
  "upcoming-calendar": {
    eyebrow: "Upcoming Calendar",
    title: "One calendar for all education and events.",
    intro:
      "Search online and physical activities by type, mode, city and language. Click any item to see full details and register.",
    image: "Adelaide-Beach-volunteers",
    imageAlt: "Volunteers gathered at a community event",
  },
};

export const sectionOrder = [
  "online-education",
  "physical-education",
  "events",
  "certified-trainers",
  "upcoming-calendar",
];

export const pathFor = (key) => key;

/* ---- activity type taxonomy ---- */
export const activityTypes = [
  "RCBC Webinar",
  "CT Webinar",
  "DCS-Family",
  "DCS-TTT",
  "Expo",
  "Dialogue",
  "Forum",
  "Workshop",
  "Public Talk",
  "Other",
];

export const modes = ["Online", "Physical"];

export const cities = ["Bintulu", "Kuching", "Kota Samarahan", "Miri", "Sibu"];

export const languages = ["English", "Bahasa Malaysia", "Chinese"];

/* ---- verified activities (aligned with official 2026 calendar, DCS poster & documented sessions) ---- */
export const activities = [
  {
    id: 1,
    title: "Webinar – Season 1",
    type: "RCBC Webinar",
    mode: "Online",
    suitableFor: "General public, families, caregivers",
    date: "11 Apr 2026",
    time: "80 minutes",
    location: "Online",
    city: "Online",
    language: "English / Bahasa Malaysia",
    speaker: "RCBC & ADFM Specialists",
    trainerId: null,
    description:
      "Public online education webinar launching the 2026 Season under the Alzheimer's Care Project 'Finding the Missing Pieces'. Sessions conducted primarily in English with Bahasa Malaysia support provided where appropriate.",
    poster: null,
    registrationLink: "https://forms.google.com/",
    status: "upcoming",
    year: 2026,
  },
  {
    id: 2,
    title: "Basic Dementia Care Skill (Family) Course — DCS-Family",
    type: "DCS-Family",
    mode: "Physical",
    suitableFor: "Family caregivers, community helpers, and those interested in dementia care",
    date: "16 May 2026",
    time: "9:00 AM – 6:00 PM",
    location: "Hock Lee Hotel & Residence, Kuching",
    city: "Kuching",
    language: "English / Bahasa Malaysia / 中文",
    speaker: "12 ADFM-Certified Trainers & Advisory Specialists",
    trainerId: null,
    description:
      "1-day intensive foundation course covering 6 core modules: Basic DCS, Person-Centred Care, Effective Communication, BPSD, Meaningful Activities, and Advance Care Planning. RM120/pax (subsidized from RM1,200). Limited to 100 seats only. CPD points available.",
    poster: null,
    registrationLink: "https://forms.google.com/",
    status: "upcoming",
    year: 2026,
  },
  {
    id: 3,
    title: "Dementia Care Skill – Train the Trainer Program — DCS-TTT",
    type: "DCS-TTT",
    mode: "Physical",
    suitableFor: "Healthcare professionals, nurses, therapists, community educators",
    date: "26 Jun 2026",
    time: "9:00 AM – 5:00 PM (3-Day Program, 26–28 June 2026)",
    location: "Kuching",
    city: "Kuching",
    language: "English / Bahasa Malaysia",
    speaker: "Dr. Tiong Ing Khieng & ADFM Training Team",
    trainerId: 11,
    description:
      "3-day intensive Train-the-Trainer program in Kuching to equip and certify frontline healthcare educators and community champions across Sarawak under ADFM credentialing.",
    poster: null,
    registrationLink: "https://forms.google.com/",
    status: "upcoming",
    year: 2026,
  },
  {
    id: 11,
    title: "Community Dementia Dialogue: Finding The Missing Pieces",
    type: "Dialogue",
    mode: "Physical",
    suitableFor: "Caregivers, relatives, community members",
    date: "16 Aug 2025",
    time: "9:30 AM – 1:00 PM",
    location: "Bintulu Civic Centre — Conference Hall",
    city: "Bintulu",
    language: "Bahasa Malaysia / English",
    speaker: "Rotary HopeCare Facilitators & Clinical Team",
    trainerId: 2,
    description:
      "In-person community dialogue bringing family caregivers, community elders, and health volunteers together to share caregiving challenges and discuss local clinic resources in Bintulu.",
    poster: null,
    registrationLink: null,
    status: "completed",
    year: 2025,
    materials: "Dialogue summary and community photo archive",
  },
  {
    id: 12,
    title: "4th Cohort Dementia Care Skill — Train the Trainer (TTT) Miri",
    type: "DCS-TTT",
    mode: "Physical",
    suitableFor: "Frontline healthcare personnel from Miri, Lawas, and Limbang",
    date: "28 Nov 2025",
    time: "3-Day Program (28–30 Nov 2025)",
    location: "ParkCity Everly Hotel, Miri",
    city: "Miri",
    language: "English / Bahasa Malaysia",
    speaker: "Dr. Tiong Ing Khieng (Consultant Geriatrician, SGH) & ADFM",
    trainerId: 11,
    description:
      "Final 2025 TTT training cohort for northern Sarawak, training 18 medical personnel. Total 68 healthcare workers certified across Sarawak under ADFM in 2024–2025.",
    poster: null,
    registrationLink: null,
    status: "completed",
    year: 2025,
  },
  {
    id: 13,
    title: "3rd Cohort Dementia Care Skill — Train the Trainer (TTT) Bintulu",
    type: "DCS-TTT",
    mode: "Physical",
    suitableFor: "Frontline healthcare personnel from Bintulu division",
    date: "16 Aug 2025",
    time: "3-Day Program",
    location: "Bintulu",
    city: "Bintulu",
    language: "English / Bahasa Malaysia",
    speaker: "ADFM Training Faculty & SGH Geriatric Team",
    trainerId: null,
    description:
      "3rd TTT cohort training 18 medical personnel in Bintulu division, expanding localized community care knowledge.",
    poster: null,
    registrationLink: null,
    status: "completed",
    year: 2025,
  },
  {
    id: 14,
    title: "Alzheimer’s Care Project TTT Batch 2 — Sibu, Sarawak",
    type: "DCS-TTT",
    mode: "Physical",
    suitableFor: "Passionate participants from Kapit, Betong, and Sibu",
    date: "16 May 2025",
    time: "3-Day Program (16/5/25 – 18/5/25)",
    location: "Sibu, Sarawak",
    city: "Sibu",
    language: "English / Bahasa Malaysia",
    speaker: "ADFM Master Trainers & RCBC",
    trainerId: null,
    description:
      "Back in May, our Batch 2 TTT in Sibu brought together a group of passionate participants from Kapit, Betong, and Sibu, who dedicated three days to learning, practicing, and preparing to serve their communities. Batch 2 is a living part of our journey shaping what we do today in building a dementia-friendly Sarawak.",
    poster: null,
    registrationLink: null,
    status: "completed",
    year: 2025,
  },
  {
    id: 15,
    title: "1st Cohort Dementia Care Skill — Train the Trainer (TTT) Kuching",
    type: "DCS-TTT",
    mode: "Physical",
    suitableFor: "Frontline healthcare personnel from Kuching division",
    date: "20 Nov 2024",
    time: "3-Day Program",
    location: "Kuching",
    city: "Kuching",
    language: "English / Bahasa Malaysia",
    speaker: "ADFM Master Trainers & SGH Specialists",
    trainerId: null,
    description:
      "Inaugural TTT cohort training 16 medical personnel in Kuching, marking the beginning of the state-wide capacity building initiative.",
    poster: null,
    registrationLink: null,
    status: "completed",
    year: 2024,
  },
];

/* ---- certified trainer profiles (12 verified facilitators from ADFM credentialing) ---- */
export const trainers = [
  // --- Category: Medical Professionals & Clinical Facilitators (9) ---
  {
    id: 1,
    name: "Dr. Mohd Asri Bin Mohd Aris",
    role: "Medical Officer",
    category: "medical-professional",
    institution: "Klinik Kesihatan Batu Kawa (KK Batu Kawa)",
    city: "Kuching",
    language: "Bahasa Malaysia, English, Sarawak Malay",
    initials: "MA",
    badgeColor: "#0d716b",
    bio: "Medical Officer at Klinik Kesihatan Batu Kawa. Certified in the ADFM DCS-TTT framework, specializing in primary care dementia education, family counseling, and clinic referral pathways.",
  },
  {
    id: 2,
    name: "Dr. Idda Syafarina Binti Albar",
    role: "Medical Officer (UD43)",
    category: "medical-professional",
    institution: "KKTP, Klinik Kesihatan Tanah Putih",
    city: "Kuching",
    language: "Bahasa Malaysia, English",
    initials: "IS",
    badgeColor: "#0284c7",
    bio: "Senior Medical Officer (UD43) at KK Tanah Putih. Dedicated to bridging community health clinics with elderly caregiver networks, conducting dementia education workshops, and managing chronic care integration.",
  },
  {
    id: 3,
    name: "Catherine Suhani Bt Sulaiman",
    role: "Health Assistant (PPK U11)",
    category: "medical-professional",
    institution: "Klinik Kesihatan Kota Samarahan",
    city: "Kota Samarahan",
    language: "Bahasa Malaysia, Sarawak Malay, Iban",
    initials: "CS",
    badgeColor: "#d97706",
    bio: "Health Assistant at KK Kota Samarahan. Certified DCS facilitator with deep grassroots community outreach experience, facilitating bilingual caregiver dialogues and practical hands-on care sessions.",
  },
  {
    id: 4,
    name: "Patricia Nawai anak Wilfred Ellie",
    role: "Nursing Sister (U32)",
    category: "medical-professional",
    institution: "Pre Hospital Care, Hospital Sentosa",
    city: "Kuching",
    language: "English, Bahasa Malaysia, Iban",
    initials: "PN",
    badgeColor: "#7c3aed",
    bio: "Nursing Sister (U32) specializing in Pre-Hospital and psychiatric care at Hospital Sentosa. Experienced trainer in patient mobility, emergency home de-escalation, and dignity-first personal care routines.",
  },
  {
    id: 5,
    name: "Dr. Yap Hung Wei",
    role: "Medical Officer",
    category: "medical-professional",
    institution: "Jabatan Psikiatri dan Kesihatan Mental, Sarawak General Hospital",
    city: "Kuching",
    language: "English, 中文 (Mandarin), Bahasa Malaysia, Hokkien",
    initials: "YH",
    badgeColor: "#059669",
    bio: "Medical Officer at Sarawak General Hospital's Department of Psychiatry & Mental Health. Facilitates DCS workshops in multilingual settings, focusing on behavioral distress management and psychiatric support.",
  },
  {
    id: 6,
    name: "Dr. Cindy Chai Syn Ying",
    role: "Medical Officer",
    category: "medical-professional",
    institution: "Jabatan Psikiatri dan Kesihatan Mental, Sarawak General Hospital",
    city: "Kuching",
    language: "English, 中文 (Mandarin), Bahasa Malaysia",
    initials: "CC",
    badgeColor: "#db2777",
    bio: "Medical Officer at SGH Psychiatry and Mental Health Department. Leads caregiver empowerment circles and multilingual public education talks on recognizing cognitive decline and caregiver mental wellbeing.",
  },
  {
    id: 7,
    name: "Siti Zufa'arnida Binti Long",
    role: "Occupational Therapist (U29)",
    category: "medical-professional",
    institution: "Hospital Sentosa, Kuching",
    city: "Kuching",
    language: "Bahasa Malaysia, English",
    initials: "SZ",
    badgeColor: "#ea580c",
    bio: "Occupational Therapist at Hospital Sentosa. Specializes in adapting home living environments, sensory stimulation, fall prevention, and cognitive activities for individuals living with moderate to severe dementia.",
  },
  {
    id: 8,
    name: "Efa Erlia Binti Kadirisman",
    role: "Occupational Therapist (U29)",
    category: "medical-professional",
    institution: "Sarawak General Hospital (SGH)",
    city: "Kuching",
    language: "Bahasa Malaysia, English",
    initials: "EK",
    badgeColor: "#4f46e5",
    bio: "Occupational Therapist at Sarawak General Hospital. Experienced DCS-TTT educator training families in daily living activities (ADLs), gentle assistive transfer methods, and preserving personal autonomy at home.",
  },
  {
    id: 9,
    name: "Dr. Siti Zarina binti Zulhady",
    role: "Medical Officer",
    category: "medical-professional",
    institution: "Klinik Psikiatri, Hospital Sentosa, Kuching",
    city: "Kuching",
    language: "Bahasa Malaysia, English",
    initials: "ZZ",
    badgeColor: "#0891b2",
    bio: "Medical Officer at Hospital Sentosa Psychiatric Clinic. Focuses on dementia clinical staging, pharmacological safety awareness for family caregivers, and psychoeducation support groups.",
  },

  // --- Category: ADFM QA/QC Advisory Support (Senior Specialists — 3) ---
  {
    id: 10,
    name: "Dr. Sally Suriani Ahip",
    role: "Family Medicine Specialist",
    category: "advisory-support",
    institution: "Klinik Kesihatan Kota Samarahan",
    city: "Kota Samarahan",
    language: "English, Bahasa Malaysia",
    initials: "SS",
    badgeColor: "#b91c1c",
    bio: "Senior Family Medicine Specialist at KK Kota Samarahan. Serves on the ADFM QA/QC Advisory Board, supervising primary care dementia curriculum adaptation, clinical safety standards, and clinic referral networks.",
  },
  {
    id: 11,
    name: "Dr. Tiong Ing Khieng",
    role: "Geriatric Medicine & Internal Medicine Specialist",
    category: "advisory-support",
    institution: "Pusat Jantung Sarawak & Sarawak General Hospital",
    city: "Kota Samarahan",
    language: "English, 中文 (Mandarin), Bahasa Malaysia",
    initials: "TK",
    badgeColor: "#1e3a8a",
    bio: "Consultant Geriatrician and Internal Medicine Specialist at Sarawak Heart Centre and SGH. Provides clinical advisory governance for the DCS-TTT certification syllabus and state-wide geriatric guidelines.",
  },
  {
    id: 12,
    name: "Dr. Ling Jia Nee",
    role: "Consultant Geriatrician",
    category: "advisory-support",
    institution: "Sarawak General Hospital (SGH)",
    city: "Kuching",
    language: "English, 中文 (Mandarin), Bahasa Malaysia",
    initials: "LJ",
    badgeColor: "#9333ea",
    bio: "Consultant Geriatrician at Sarawak General Hospital. Master clinical advisor overseeing complex BPSD protocols, ethical caregiving frameworks, and academic evaluation for the RCBC HopeCare initiative.",
  },
];

/* ---- physical education programmes ---- */
export const physicalProgrammes = [
  {
    id: "dcs-family",
    code: "DCS-Family",
    trackNumber: "Track 01",
    title: "Basic Dementia Care Skill (Family) Course",
    roleCategory: "Family Caregivers, Relatives & Community Helpers",
    badge: "Open for Registration",
    shortIntro:
      "To shift the daily caregiving focus away from rigid clinical routines and toward protecting personal dignity, emotional connection, and managing the progressive changes of dementia without burning out.",
    suitableFor:
      "Family caregivers, relatives, community helpers, and those interested in or planning to further develop in dementia care.",
    description:
      "Foundation Dementia Care Course for Family Caregivers covering 6 core modules, delivered by 12 ADFM-Certified Trainers with public healthcare experience. Pre-requisite for ADFM DCS-TTT certification. Limited to 100 seats only (subsidized from RM1,200 to RM120/pax). CPD points available.",
    mode: "In-Person Physical Workshop",
    sessions: "1 Full Day (9:00 AM – 6:00 PM)",
    language: "English (with Malay & Chinese support where helpful)",
    location: "Hock Lee Hotel & Residence, Kuching",
    cities: ["Kuching"],
    schedule: {
      date: "16 May 2026",
      time: "9:00 AM – 6:00 PM",
      label: "Scheduled Intake",
      calendarActivityId: 2,
    },
    highlights: [
      "Module 1 – Basic DCS: Understanding Dementia",
      "Module 2 – Impact of Dementia & Person-Centred Care",
      "Module 3 – Effective Communication",
      "Module 4 – Behavioural & Psychological Symptoms of Dementia (BPSD)",
      "Module 5 – Meaningful Activities & Engagement",
      "Module 6 – Legal, Ethical Issues & Advance Care Planning",
    ],
    actionType: "register",
    buttonLabel: "Register for DCS-Family",
    status: "available",
  },
  {
    id: "dcs-ttt",
    code: "DCS-TTT",
    trackNumber: "Track 02",
    title: "Dementia Care Skill — Train the Trainer Program",
    roleCategory: "Healthcare Professionals, Expert Educators & Senior Volunteers",
    badge: "By Application & Review",
    shortIntro:
      "The Train-the-Trainer (TTT) framework equipping and certifying healthcare professionals so they are equipped to deliver community DCS courses across Sarawak.",
    suitableFor:
      "Selected healthcare professionals (nurses, therapists, medical officers), certified educators, and senior community volunteers.",
    description:
      "An intensive 3-day certification curriculum under ADFM credentialing. Across 2024–2025, 4 cohorts have trained 68 frontline healthcare personnel across Kuching, Sibu, Bintulu and Miri to lead grassroots education.",
    mode: "Physical 3-Day Intensive Cohort",
    sessions: "3 Days (9:00 AM – 5:00 PM)",
    language: "English (with Bahasa Malaysia support provided where appropriate)",
    location: "Kuching",
    cities: ["Kuching"],
    schedule: {
      date: "26–28 Jun 2026",
      time: "9:00 AM – 5:00 PM (3-Day Program)",
      label: "Upcoming 2026 Cohort",
      calendarActivityId: 3,
    },
    highlights: [
      "Comprehensive mastery of the community DCS curriculum & clinical nuances",
      "Adult education techniques, group facilitation & interactive roleplays",
      "Supervised mock teaching and clinical assessment under ADFM guidance",
      "Accreditation as ADFM Certified Trainer listed in the public directory",
    ],
    actionType: "apply",
    buttonLabel: "Apply for TTT Pathway",
    status: "available",
  },
  {
    id: "dcs-care-worker",
    code: "DCS-Care Worker",
    trackNumber: "Track 03",
    title: "Dementia Care Series — Care Worker",
    roleCategory: "Professional Direct-Care Staff, Nursing Home Employees & Care Aides",
    badge: "Future Track • Priority Waitlist",
    shortIntro:
      "A comprehensive workshop focused on building formal clinical competency. It establishes standard protocols for managing BPSD (Behavioral and Psychological Symptoms of Dementia), interpreting distress as communication, and mastering safe, person-centered physical handling.",
    suitableFor:
      "Professional direct-care staff, nursing home employees, paid home nurses, assisted living attendants, and community health volunteers.",
    description:
      "A rigorous, hands-on clinical training track crafted for institutional and community direct-care teams. Standardises compassionate clinical care, person-centred dementia support, and injury-free mobility assistance.",
    mode: "Physical 2-Day Intensive Hands-on Workshop",
    sessions: "Intensive 2-Day Track (16 hours clinical practice)",
    language: "English / Bahasa Malaysia",
    location: "Kuching & Regional Healthcare Venues (To be announced)",
    cities: ["Kuching"],
    schedule: {
      date: "Future Track",
      time: "9:00 AM – 5:00 PM (2-Day Intensive)",
      label: "Planned Cohort",
      calendarActivityId: null,
    },
    highlights: [
      "Standard protocols for BPSD assessment & non-pharmacological de-escalation",
      "Interpreting behavioural distress, agitation, and resistance as communication",
      "Mastering safe, person-centred transfers & physical handling ergonomics",
      "Institutional care dignity standards & care-plan documentation",
    ],
    actionType: "waitlist",
    buttonLabel: "Join Priority Waitlist / Express Interest",
    status: "future",
  },
];

/* ---- learning resources (from completed activities) ---- */
export const learningResources = [
  {
    id: 101,
    title: "Understanding the Missing Pieces — Q&A Collection",
    sourceActivity: "RCBC Community Webinar",
    type: "Q&A Document (4 Pages)",
    language: "English",
    duration: "4 pages",
    description:
      "Official Q&A resource addressing community questions and core caregiving support principles under the Alzheimer's Care Project.",
    year: 2025,
    videoUrl: "https://facebook.com/AlzheimersCarebyRCBC",
    qaIndex: 2,
  },
  {
    id: 102,
    title: "Oral Health & Ageing Webinar — Q&A Reference Pack",
    sourceActivity: "RCBC Healthcare Webinar",
    type: "Q&A Document (14 Pages)",
    language: "English",
    duration: "14 pages",
    description:
      "Illustrated question-and-answer guide exploring dental care, tooth loss, and nutritional considerations for older adults and individuals living with dementia.",
    year: 2025,
    videoUrl: "https://facebook.com/AlzheimersCarebyRCBC",
    qaIndex: 0,
  },
  {
    id: 103,
    title: "Prevention & Early Detection of Dementia — Q&A Guide",
    sourceActivity: "RCBC Webinar (Chinese Session)",
    type: "Q&A Document (5 Pages)",
    language: "中文",
    duration: "5 pages",
    description:
      "Comprehensive Chinese-language Q&A document on recognizing memory changes early, healthcare consultation pathways, and family guidance.",
    year: 2025,
    videoUrl: "https://facebook.com/AlzheimersCarebyRCBC",
    qaIndex: 1,
  },
  {
    id: 104,
    title: "DCS-Family: Foundation Course Curriculum Guide",
    sourceActivity: "DCS-Family 2026",
    type: "Syllabus Guide",
    language: "English / Bahasa Malaysia",
    duration: "6 Core Modules",
    description:
      "Structured 6-module curriculum outline for family caregivers and community helpers under the 2026 DCS-Family intake.",
    year: 2026,
    videoUrl: "https://facebook.com/AlzheimersCarebyRCBC",
    qaIndex: 2,
  },
];

/* ---- webinar topic list for online education section ---- */
export const webinarTopics = [
  {
    title: "Understanding dementia",
    description:
      "A clear introduction to symptoms, types, diagnosis, and support pathways.",
    language: "English",
    status: "upcoming",
  },
  {
    title: "Communication that supports dignity",
    description:
      "Simple ways to make conversations calmer and more connected.",
    language: "Bahasa Malaysia",
    status: "upcoming",
  },
  {
    title: "Caregiver wellbeing",
    description:
      "Recognising stress and building a support network.",
    language: "English",
    status: "completed",
  },
  {
    title: "Healthy ageing",
    description:
      "Everyday actions that support brain and overall health.",
    language: "English",
    status: "completed",
  },
  {
    title: "Responding to behaviour changes",
    description:
      "Look for possible causes and respond with patience and safety.",
    language: "Bahasa Malaysia",
    status: "upcoming",
  },
  {
    title: "Living well with dementia",
    description:
      "Person-centred routines, meaningful activities, and community.",
    language: "English",
    status: "completed",
  },
  {
    title: "Planning for the future",
    description:
      "Questions to discuss with family and healthcare professionals.",
    language: "English",
    status: "upcoming",
  },
  {
    title: "Trainer community exchange",
    description:
      "Share learning ideas and delivery experiences with trainers.",
    language: "English / Bahasa Malaysia",
    status: "upcoming",
  },
  {
    title: "Ask a dementia educator",
    description:
      "A future question-and-answer session for families and trainers.",
    language: "English",
    status: "upcoming",
  },
];
