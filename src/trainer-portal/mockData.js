export const sampleProfile = {
  id: "t-1",
  name: "Sample Trainer",
  email: "trainer@example.com",
  city: "Bintulu",
  language: "English",
  shortProfile: "Short background goes here.",
  qualifications: "Qualifications go here.",
  experience: "Relevant experience goes here.",
  certifiedStatus: "Certified Trainer", // Admin-controlled
  certificateRef: "To be assigned by RCBC", // Admin-controlled
  status: "approved",
  adminComment: "",
};

export const sampleActivities = [
  {
    id: "a-1", title: "Caring for a Family Member with Dementia",
    date: "2026-11-21T10:00", type: "Workshop", mode: "Physical",
    venue: "Bintulu community hall", language: "English",
    audience: "Family caregivers", description: "Practical communication and daily-care skills.",
    registrationLink: "", plannedHours: 3, role: "Trainer",
    status: "approved", adminComment: "", completion: { status: "none" },
  },
  {
    id: "a-2", title: "Healthy Brain Ageing",
    date: "2026-09-12T14:00", type: "Seminar", mode: "Online",
    venue: "Online", language: "Bahasa Malaysia",
    audience: "General public", description: "Brain health and risk reduction.",
    registrationLink: "", plannedHours: 2, role: "Speaker",
    status: "approved", adminComment: "",
    completion: { status: "verified", venue: "Online", participants: 48, hours: 2 },
  },
  {
    id: "a-3", title: "Dementia Basics (draft)",
    date: "2026-12-05T09:00", type: "Workshop", mode: "Online",
    venue: "Online", language: "Chinese",
    audience: "Public", description: "Introductory session.",
    registrationLink: "", plannedHours: 2, role: "Trainer",
    status: "returned", adminComment: "Please add the registration link.",
    completion: { status: "none" },
  },
];

export const sampleAccessRequests = [
  {
    id: "r-1",
    name: "Sample Applicant",
    email: "applicant@example.com",
    city: "Sibu",
    certificateRef: "To be checked by Admin",
    status: "submitted",
    adminComment: "",
    requestedAt: "2026-10-12",
  },
];