import {enquiryTypes} from './enquiry.js';
import supportServices from '../src/data/supportServices.js';
export const understandingDementiaContent = {
  eyebrow: "Understanding Dementia",
  title: "Understanding Dementia",
  lead: "Learn about dementia, changes to look out for, and ways to support brain health and wellbeing.",
  exploreEarly: "Explore early signs",
  healthyActive: "Healthy living",
  keyPoints: "Key points",
  keyPointsList: [
    "Dementia is not a normal part of ageing.",
    "Different conditions can cause dementia symptoms.",
    "A healthcare professional can help assess changes in memory or thinking.",
  ],
  overview: "Overview",
  earlySigns: "Early signs",
  faq: "FAQs",
  basics: "The basics",
  whatIs: "What is dementia?",
  overviewIntro:
    "Dementia describes symptoms that affect memory, thinking, communication and everyday activities.",
  overviewCards: [
    {
      title: "Understanding dementia",
      text: "Dementia is an umbrella term for symptoms caused by conditions affecting the brain.",
    },
    {
      title: "Alzheimer's disease",
      text: "Alzheimer's disease is one of the most common causes of dementia.",
    },
    {
      title: "Different experiences",
      text: "Symptoms and progression vary between individuals and types of dementia.",
    },
  ],
  overviewDetails: [
    "Dementia is not a single disease. It describes a group of symptoms that can affect memory, reasoning, language and the ability to manage everyday tasks. Different underlying conditions can cause these changes. A healthcare professional can help investigate persistent concerns.",
    "Alzheimer's disease is a common cause of dementia, but the terms are not interchangeable. It generally develops gradually, and people may experience changes in memory, communication and daily activities over time. Assessment and support can help individuals and families plan for their needs.",
    "Dementia affects people differently. The changes someone experiences, how quickly they develop and the support they need can vary. Listening to the person, respecting their preferences and adapting support to their situation are important.",
  ],
  commonTypesTitle: "Common types of dementia",
  commonTypesIntro:
    "Dementia is an umbrella term. These are some of the conditions that can cause dementia symptoms:",
  commonTypes: [
    {
      title: "Alzheimer’s disease",
      description:
        "Often involves gradual changes in memory, thinking and everyday functioning.",
    },
    {
      title: "Vascular dementia",
      description:
        "Linked to problems with blood supply to the brain; symptoms can include difficulties with planning and thinking.",
    },
    {
      title: "Lewy body dementia",
      description:
        "May involve changes in attention, movement, sleep and visual perception.",
    },
    {
      title: "Frontotemporal dementia",
      description:
        "Often affects behaviour, personality or language, sometimes before memory changes become obvious.",
    },
  ],
  youngerOnset: "Younger-onset dementia:",
  youngerText: "Dementia can sometimes affect people under 65.",
  signsEyebrow: "Recognising changes",
  signsTitle: "Early signs and changes",
  signsIntro:
    "Occasional forgetfulness is common. Persistent changes that interfere with daily life deserve professional assessment.",
  comparisonLabel:
    "Comparison of everyday changes and potentially concerning changes",
  comparisonHead: [
    "Common everyday changes",
    "Changes worth discussing with a professional",
  ],
  comparison: [
    [
      "Occasionally forgetting a name",
      "Frequently forgetting recently learned information",
    ],
    [
      "Sometimes misplacing belongings",
      "Repeatedly losing items and struggling to retrace steps",
    ],
    [
      "Occasionally needing help with a new task",
      "Difficulty completing familiar everyday tasks",
    ],
    [
      "Occasionally losing track of the day",
      "Frequent confusion about time or place",
    ],
  ],
  selfAssessmentEyebrow: "Reflection",
  selfAssessmentTitle: "Notice changes in daily life",
  selfAssessmentIntro:
    "These questions are for reflection only. They are not a medical test or diagnosis.",
  questions: [
    "Have you noticed recurring memory difficulties?",
    "Have familiar tasks become more difficult?",
    "Have you noticed recurring confusion about time or place?",
    "Have communication or word-finding difficulties become more frequent?",
  ],
  options: ["Never", "Sometimes", "Often"],
  answered: "answered",
  viewGuidance: "View guidance",
  answerAll: "Answer every question to continue.",
  resultTitle: "General guidance",
  considerTitle: "Consider seeking advice.",
  considerText:
    "If changes are persistent or affecting everyday life, speak with a healthcare professional.",
  observeTitle: "Pay attention to changes.",
  observeText:
    "Consider recording concerns and discussing them with a healthcare professional.",
  wellbeingTitle: "Keep supporting wellbeing.",
  wellbeingText:
    "Healthy routines and social connections can support overall wellbeing. Seek advice about any concerns.",
  findHelp: "Find healthcare support",
  healthcareLink: "Healthcare information",
  startAgain: "Start again",
  disclaimer:
    "This questionnaire cannot diagnose or rule out dementia. A qualified healthcare professional can assess symptoms.",
  livingEyebrow: "Everyday wellbeing",
  livingTitle: "Healthy and active living",
  livingIntro:
    "Healthy routines can support general wellbeing and brain health.",
  livingCards: [
    {
      title: "Stay Healthy",
      items: [
        "Have regular checks for blood pressure and diabetes, and manage them with your healthcare team.",
        "Check hearing and vision, and seek support when they change.",
        "Avoid smoking and limit alcohol; protect yourself from head injuries.",
        "Make sleep and balanced meals part of your routine.",
      ],
    },
    {
      title: "Stay Active",
      items: [
        "Choose enjoyable activities such as walking, dancing or gardening.",
        "Make movement part of daily life in ways that suit your abilities.",
      ],
    },
    {
      title: "Stay Connected & Engaged",
      items: [
        "Spend time with family, friends and neighbours.",
        "Join community, cultural or volunteering activities that interest you.",
      ],
    },
    {
      title: "Keep Your Brain & Mind Active",
      items: [
        "Explore hobbies, reading, music or learning something new.",
        "Try activities that encourage thinking, creativity and conversation.",
      ],
    },
  ],
  riskTitle: "Dementia Risk Reduction",
  riskDescription:
    "Looking after heart health, hearing and vision, staying active and connected, avoiding smoking and harmful alcohol use, preventing head injuries, and getting enough sleep may help reduce the risk of dementia. No single habit can eliminate the risk, and healthy living cannot guarantee prevention.",
  learnTogether: "Learn and connect",
  learnTogetherText:
    "Explore education and community activities for people and families.",
  learnEvents: "Learn and events",
  riskNote:
    "Healthy habits support wellbeing but cannot guarantee prevention of dementia.",
  faqEyebrow: "Common questions",
  faqTitle: "Frequently asked questions",
  faqIntro: "Answers to common questions about dementia and support.",
  faqs: [
    {
      q: "Is dementia a normal part of ageing?",
      a: "No. Dementia is not a normal part of ageing, although age can increase risk.",
      link: { href: "#overview", label: "Learn about dementia" },
    },
    {
      q: "Is dementia the same as Alzheimer's disease?",
      a: "No. Alzheimer's disease is one cause of dementia, but there are others.",
      link: { href: "#common-types", label: "See common types" },
    },
    {
      q: "Can dementia be diagnosed through an online questionnaire?",
      a: "No. A qualified healthcare professional must assess symptoms.",
      link: { href: "#early-signs", label: "See early signs" },
    },
    {
      q: "What should I do if I notice changes?",
      a: "Speak with a healthcare professional if changes persist or affect everyday life.",
      link: {
        href: "/find-help/assessment-healthcare",
        label: "Find assessment information",
      },
    },
    {
      q: "Where can caregivers find help?",
      a: "Caregiver Support offers practical guidance, training and community connections.",
      link: { href: "/caregiver-support", label: "Explore caregiver support" },
    },
    {
      q: "Can younger people develop dementia?",
      a: "Yes. Dementia can affect people under 65, although it is less common.",
      link: { href: "#overview", label: "Read the overview" },
    },
    {
      q: "Is dementia hereditary?",
      a: "Most cases are not directly inherited, but some rare forms have strong genetic links.",
      link: { href: "#common-types", label: "Explore dementia types" },
    },
    {
      q: "Can dementia risk be reduced?",
      a: "Some risk factors can be managed through health care and everyday habits.",
      link: { href: "#risk-reduction", label: "Explore risk reduction" },
    },
    {
      q: "Can healthy living prevent dementia?",
      a: "Healthy habits may reduce risk, but they cannot guarantee prevention.",
      link: { href: "#healthy-living", label: "Healthy and active living" },
    },
    {
      q: "When should I seek further assessment?",
      a: "Seek professional advice if changes are persistent, worsening or affecting daily life.",
      link: {
        href: "/find-help/assessment-healthcare",
        label: "Find assessment information",
      },
    },
  ],
  concerned: "Need more support?",
  visitFindHelp: "Find help and support",
};
export const reviewCopy = {
    normalTitle: "Normal Ageing",
    normalIntro: "Occasional forgetfulness can happen in everyday life. Dementia is not a normal part of ageing.",
    normalNote: "These examples are for general information. They cannot confirm or rule out a condition.",
    changesTitle: "Concerning Changes",
    earlyTitle: "Early Signs",
    earlyIntro: "Some changes in memory, communication or everyday activities may be worth discussing with a healthcare professional.",
    earlyNote: "There is no single checklist that can tell whether someone has dementia.",
    earlyExamples: ["Repeated changes in memory or thinking", "Growing difficulty with familiar activities or communication", "More frequent confusion about time or place"],
    selfCheckTitle: "Self-Assessment",
    selfCheckIntro: "This is a guide to help you think about changes. It is not a screening test, medical advice or a diagnosis.",
    guideNotice: "For reference only — not a diagnosis.",
    guideReminder: "These answers cannot diagnose or rule out dementia. If changes concern you, seek advice from a qualified healthcare professional.",
    generalGuidance: "Your answers are a personal reflection, not a medical result or risk score. If you have concerns, consider speaking with a qualified healthcare professional, whatever your answers were.",
    professionalTitle: "Professional Assessment",
    professionalIntro: "If changes are ongoing, worrying or affect daily life, a qualified healthcare professional can discuss your concerns and advise on assessment. This website cannot determine the cause.",
    furtherTitle: "Further Care",
    furtherIntro: "Explore practical caregiver information and community support. A person's situation and preferences should guide any next steps.",
    caregiverLink: "Explore Caregiver Support",
    webinarLink: "Explore education and webinars",
    healthNote: "RCBC will review and update educational content before publication. These sections link to the existing webinar archive rather than offering personal medical advice.",
  };
export const livingSections = [
  {
    slug: "healthy-stay-healthy", title: "Stay Healthy",
    description: "Explore RCBC education on ageing and general wellbeing.",
    webinarTitle: "A Practical Webinar on Cataracts", webinarQuery: "Cataracts",
  },
  {
    slug: "healthy-stay-active", title: "Stay Active",
    description: "Explore educational sessions about activity and everyday wellbeing.",
    webinarTitle: "Embracing Wellness: Ageing with Dignity in Sarawak", webinarQuery: "Embracing Wellness",
  },
  {
    slug: "healthy-stay-connected", title: "Stay Connected & Engaged",
    description: "Explore RCBC sessions about connection and community involvement.",
    webinarTitle: "Alzheimer's Awareness Webinar", webinarQuery: "Alzheimer's Awareness",
  },
  {
    slug: "healthy-mind-active", title: "Keep Your Brain & Mind Active",
    description: "Explore webinars about learning, awareness and wellbeing.",
    webinarTitle: "Alzheimer's 101: Eye-opening facts", webinarQuery: "Alzheimer's 101",
  },
];
export const publicCopy = {
 understandDementia:{...understandingDementiaContent,reviewCopy,livingSections,...{"next":"Next:","healthyTitle":"Healthy & Active Living","healthyIntro":"Explore four education topics and selected existing RCBC webinars. Webinar suggestions are provisional and await RCBC approval; they are not personal medical advice.","suggestedWebinar":"Suggested webinar (pending RCBC review):"}},
 caregiverSupport:{"workerPlannedLabel":"(planned for 2028)","workerApprovalLabel":"(from 2028, subject to RCBC approval)","workerAvailabilityNotice":"DCS–Worker is planned to commence in 2028. Training and public worker listings are not yet available; any future public listing requires verified credentials, individual consent and RCBC approval.","programmeNoticeTitle":"Important programme information from RCBC","programmeFamilyNotice":"DCS–Family provides family caregiver education and does not constitute professional caregiver certification.","programmeWorkerNotice":"DCS–Worker training and public listing will be introduced following the commencement of the programme in 2028. There is no public DCS–Worker listing yet. In the future, verified graduates may have their names and contact email addresses listed only with their consent and RCBC approval.","programmePlatformNotice":"RCBC and Dementia Care Connect serve solely as a platform to verify and display relevant training credentials and facilitate connections. They do not act as employers, employment agents or intermediaries in any employment or commercial arrangements. All such arrangements remain the sole responsibility of the individuals and parties involved.","programmeDetailsLink":"View DCS–Family and DCS–Worker programme details","certVerificationTag":"CERTIFICATE VERIFICATION","certReadyPrompt":"Have the name shown on the certificate and the certificate reference ready.","certNotice":"Only programme completion is verified; this is not a professional licence."},
 projectServices:{getUpdatedIntro:'Stay connected with Dementia Care Connect. Register to receive updates on upcoming webinars, education, training and project activities.'},
 contact:{enquiryOptions:enquiryTypes},
 supportDirectory:{statusLabels:{draft:'Draft',published:'Published',archived:'Archived'},records:supportServices,categories:['Pharmacy','Occupational Therapy','Physiotherapy / Rehabilitation','Home / Community Care','Respite / Elderly Care','Support Group / NGO']},
 learnEvents:{trainerGovernance:{hcp:'HCP — Healthcare Professional',nonHcp:'Non-HCP',intro:'RCBC-verified training records and approved education activities. Teaching permissions are approved separately for each person.',nonHcpIntro:'People from non-healthcare backgrounds with RCBC-verified training records. Approved teaching scope is shown on each profile.',background:'Background',assessment:'Recorded assessment outcome',certificate:'Certificate reference',teaching:'Teaching permission',approved:'Approved within recorded scope',notApproved:'Not approved to conduct training',scope:'Permitted programmes / modules',contact:'Contact RCBC about a session',directoryEmpty:'No approved trainer profiles match these filters.',record:'RCBC-verified training record'},registrationCopy:{"loading":"Checking registration options…","retry":"Try again","contact":"Contact RCBC","unavailable":"Registration unavailable","notOpen":"Registration is not open.","loadError":"We could not load registration options. Please try again.","submitError":"Unable to submit. Please try again.","duplicateTitle":"This phone number is already registered","pendingTitle":"Registration received — awaiting payment review","confirmedTitle":"Your registration is confirmed","errorTitle":"We could not submit your registration","join":"Join this event","heading":"Register for this event","noAccount":"No website account is needed.","paidProgramme":"Paid programme","freeAttend":"Free to attend","paidIntro":"Your place is confirmed only after RCBC reviews your registration and verifies payment.","freeIntro":"This event is free. Your registration is confirmed automatically; no payment is required.","paymentInstructions":"Payment instructions","viewStatus":"View submission status","complete":"Complete registration form","external":"Continue to registration","externalHelp":"Opens the organiser’s form in a new tab.","pendingSummary":"Your registration is awaiting payment verification and approval.","confirmedSummary":"Your registration is confirmed.","paidSummary":"Your place is confirmed after RCBC verifies payment and approves your registration.","freeSummary":"No payment is required. Your registration is confirmed automatically.","received":"Submission received","check":"Please check before continuing","checkPhone":"Check phone number","pendingFootnote":"Your place is pending RCBC payment verification and approval.","confirmedFootnote":"Your place is confirmed. No payment is required.","contactDetails":"Your contact details","requiredHint":"Fields marked “required” must be completed.","fullName":"Full name","required":"(required)","emailLabel":"Email address","phoneLabel":"Phone number","notesLabel":"Questions for the speaker / notes","optional":"(optional)","namePlaceholder":"Your full name","notesPlaceholder":"Add a question you would like the speaker to address. Avoid sensitive medical details.","emailHelp":"You may use a family member’s email. Each participant needs a different WhatsApp phone number.","consent":"I agree that RCBC may use these details to manage this event registration and contact me about it.","back":"Back to event details","submitting":"Submitting…","submit":"Submit registration","paidFooter":"Your place is confirmed only after RCBC verifies payment and approves your registration.","freeFooter":"Free registrations are confirmed automatically. No payment is required.","dialogEyebrow":"Event registration","dialogTitle":"Complete your registration","dialogClose":"Close registration form","duplicateMessage":"This phone number is already registered for this intake. Use a different WhatsApp contact number or contact RCBC for help."},activityModal:{mode:'Mode',language:'Language'},programmeLabel:'Education programme',statusLabels:{upcoming:'Upcoming',completed:'Completed',closed:'Registration closed',cancelled:'Cancelled'},intakeLabels:{familyNotice:'DCS-Family provides family caregiver education, not professional caregiver certification.',tttNotice:'Registering for DCS-TTT does not establish trainer qualification. Trainer Portal access and public listing require separate RCBC verification and approvals.',planned:'Planned programme',upcoming:'Upcoming intakes',past:'Past intakes',view:'View intake details',viewPast:'View past intake',details:'View details for registration and payment instructions.',closed:'Registration closed',deadline:'Registration deadline passed',loading:'Loading intakes…',none:'No intake is currently scheduled.',contact:'Contact RCBC',future:'to enquire about future dates.',plannedNotice:'This programme is planned.',enquiries:'for availability enquiries.',pastNotice:'Completed sessions remain available as activity records. Registration has closed.',malaysiaTime:'Malaysia time'},priceLabels:{free:'Free',paid:'Paid',physical:'In person',online:'Online',pending:'Registration details pending'},openFullDetails:'Open full event details & registration',capacityLabel:'Capacity',seatsLabel:'seats',deadlineLabel:'Reg. Deadline',closedLabel:'Closed'}
};
export function addMissingCopy(target,defaults){for(const [key,value]of Object.entries(defaults)){if(target[key]===undefined)target[key]=value;else if(value&&typeof value==='object'&&!Array.isArray(value)&&target[key]&&typeof target[key]==='object')addMissingCopy(target[key],value);}return target;}
