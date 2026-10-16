export const aboutNav = [
  { id: "overview", label: "Project Overview" },
  { id: "mission", label: "Our Mission & Vision" },
  { id: "journey", label: "Our Journey" },
  { id: "organiser", label: "Organiser" },
  { id: "partner", label: "Strategic Partner" },
  { id: "advisors", label: "Project Advisors" },
  { id: "supported", label: "Supported By" },
  { id: "acknowledgements", label: "Acknowledgements" },
];

export const overview = {
  project: "Alzheimer's Care Project",
  theme: "Understanding the Missing Pieces",
  platform: "Dementia Care Connect",
  intro:
    "The Alzheimer's Care Project is a continuing community initiative organised by Rotary Club of Bintulu Central (RCBC). It aims to help people understand dementia, strengthen caregiving knowledge and make reliable help easier to find.",
  platformText:
    "Dementia Care Connect is Phase 2 – Go Digital of the project: a one-stop place to understand, learn, find the right pathway and connect with relevant information, education and support.",
  is: [
    "Information, education, navigation and connection",
    "A guide to next steps and external pathways",
    "A directory to help you find resources",
  ],
  isNot: [
    "Diagnosis, consultation, treatment or medical referral",
    "Appointment booking, or an emergency or dementia hotline",
    "A guarantee or endorsement of external providers",
  ],
};

// Working wording from RCBC. Final wording may be refined before publication.
export const mission = {
  mission:
    "To improve dementia understanding, strengthen caregiving knowledge and human resources, and make reliable information, education and support pathways easier to find and navigate.",
  vision:
    "A more dementia-aware and dementia-inclusive community where individuals and families can understand, prepare, find support and navigate the dementia journey with greater confidence.",
};

export const journey = [
  {
    phase: "Phase 1",
    title: "Awareness, Education & Human Resources",
    text: "Building public awareness, caregiving knowledge and trained human resources through webinars, DCS–Family, DCS–TTT and related education.",
  },
  {
    phase: "Phase 2",
    title: "Go Digital: Dementia Care Connect",
    text: "A one-stop platform to help people understand, learn, navigate resources, find support pathways and connect with relevant information and people.",
    current: true,
  },
  {
    phase: "Phase 3",
    title: "Dementia & Alzheimer's Care Centre",
    text: "The longer-term direction: a dedicated dementia and Alzheimer's care centre.",
  },
];

export const organiser = {
  name: "Rotary Club of Bintulu Central (RCBC)",
  text: "RCBC organises and coordinates the Alzheimer's Care Project.",
  link: null, // TODO: add the official Rotary / club URL once RCBC confirms it
};

export const strategicPartner = {
  name: "Alzheimer's Disease Foundation Malaysia (ADFM)",
  text: "ADFM is the project's strategic partner. Where appropriate, ADFM guides RCBC towards relevant dementia information and recognised sources. ADFM carries out its own role and does not manage this platform.",
};

// TODO: RCBC says to confirm full names, titles and profile wording before publishing.
export const advisors = {
  role: "Providing professional guidance and helping the project remain aligned with accurate, appropriate and locally relevant dementia information.",
  people: [
    "Dr. Sally Suriani",
    "Dr. Azizah Saiee",
    "Dr. Tiong Ing Khieng",
    "Dr. Ling Jia Nee",
    "Dr. Rahmah Binti Rashid",
  ],
};

// TODO: RCBC has not supplied this list. Each item: { name, support, phase }.
export const supportedBy = {
  text: "Government agencies, institutions and organisations that provide institutional, professional or community support to the project.",
  items: [],
};

// TODO: RCBC to supply names. Each item: { name, contribution, programme }.
export const acknowledgements = [
  {
    title: "Funding Sponsors",
    text: "Financial contribution to the project or a specific programme.",
    items: [],
  },
  {
    title: "In-Kind / Service Sponsors",
    text: "Non-cash services or resources such as venues, facilitation or production.",
    items: [],
  },
  {
    title: "Professional Contributors",
    text: "Speakers, Master Trainers and other experts who contributed to education or development.",
    items: [],
  },
  {
    title: "Digital & Technical Contributors",
    text: "Contributors to the design, development and operation of Dementia Care Connect.",
    items: [],
  },
  {
    title: "Volunteers",
    text: "Volunteer contribution such as translation, design, outreach and event support.",
    items: [],
  },
];