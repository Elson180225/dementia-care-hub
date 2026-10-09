const statistics = [
  {
    id: "malaysia",

    shortLabel: "National",
    region: "Malaysia",

    chartType: "donut",

    value: 8.5,

    chartLabel: "Probable dementia",
    chartRemainderLabel: "Other adults aged 60+",

    title:
      "of Malaysians aged 60+ screened positive for probable dementia",

    description:
      "The National Health and Morbidity Survey 2018 estimated that 8.5% of Malaysians aged 60 years and above had probable dementia.",

    highlight:
      "Estimated 260,345 people aged 60+",

    source:
      "NHMS 2018: Elderly Health, Institute for Public Health, Ministry of Health Malaysia",

    dataYear: "2018",

    reviewed: "October 2026",

    sourceUrl:
      "https://iku.gov.my/images/IKU/Document/REPORT/NHMS2018/NHMS2018ElderlyHealthVolume2.pdf",

    note:
      "This refers to probable dementia identified through population screening, not a count of clinically diagnosed dementia cases.",
  },

  {
    id: "sarawak",

    shortLabel: "State",
    region: "Sarawak",

    chartType: "donut",

    value: 13.2,

    chartLabel: "Population aged 60+",
    chartRemainderLabel: "Population below 60",

    title:
      "of Sarawak's population was aged 60 years and above in 2025",

    description:
      "Sarawak had approximately 333,200 residents aged 60 years and above in 2025, representing 13.2% of the state's population.",

    highlight:
      "Approximately 333,200 people aged 60+",

    source:
      "Majlis Pembangunan Sosial Sarawak / official Sarawak government information",

    dataYear: "2025",

    reviewed: "October 2026",

    sourceUrl:
      "https://ukas.sarawak.gov.my/",

    note:
      "This is an ageing-population statistic and should not be interpreted as a Sarawak dementia prevalence rate.",
  },

  {
    id: "states",

    shortLabel: "Comparison",
    region: "By District",

    chartType: "bar",

    bars: [
      {
        label: "Lubok Antu",
        value: 22.6,
      },
      {
        label: "Saratok",
        value: 19.7,
      },
      {
        label: "Sri Aman",
        value: 19.2,
      },
    ],

    title:
      "Sarawak districts with high shares of residents aged 60+",

    description:
      "In preliminary 2025 population estimates, Lubok Antu recorded 22.6% of its population aged 60 years and above, followed by Saratok at 19.7% and Sri Aman at 19.2%.",

    highlight:
      "Lubok Antu recorded 22.6% aged 60+",

    source:
      "Department of Statistics Malaysia (DOSM), Current Population Estimates by Administrative District",

    dataYear: "2025 preliminary",

    reviewed: "October 2026",

    sourceUrl:
      "https://www.dosm.gov.my/",

    note:
      "These are population ageing indicators, not dementia prevalence rates.",
  },
];

export default statistics;