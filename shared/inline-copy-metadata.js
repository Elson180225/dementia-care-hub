/**
 * Stable administrative classification for formerly hardcoded public labels.
 * The same ui/inlineCopy/<key> is used by the page and translation review.
 * New plain UI labels are STANDARD; credential and health claims have
 * explicitly more restrictive defaults. Persisted per-row review settings
 * and RCBC page requirements continue to take precedence on the server.
 */
const keysByPage = {
  home: [
    'projectUpdates', 'slideshowLabel', 'previousSlide', 'nextSlide', 'statsAged',
    'statsCategories', 'slideAlt1', 'slideAlt2', 'slideAlt3', 'slideAlt4',
    'slideAlt5', 'slideAlt6', 'slideLabel1', 'slideLabel2', 'slideLabel3',
    'slideLabel4', 'slideLabel5', 'slideLabel6', 'goToSlide',
    'districtAgedCaption',
  ],
  caregiver: [
    'aboutCaregiverAlt', 'caregiverInfo', 'caregiverProgramme', 'caregiverEducation', 'caregiverGuidance',
    'groupsLoading', 'groupsChecking', 'groupsError', 'retryArrow', 'cityColon',
    'languagesColon', 'volunteerTypes',
    'acceptingVolunteers',
  ],
  contact: [
    'leaveBlank',
  ],
  understanding: [
    'healthyActive', 'selectedTopic',
  ],
  help: [
    'providerCityFilter', 'providerPathFilter', 'directoryTitle', 'equipmentDirectoryNote', 'financeDirectoryNote',
    'servicesDirectoryNote', 'publishedLoading', 'publishedDetails', 'locationColon', 'statusColon',
    'contactInfo', 'visitWebsite', 'filterCategory', 'filterService', 'unsureStart',
    'helpChoose', 'chooseClosest', 'noticedChanges', 'assessArrow', 'dailyHelp',
    'supportArrow', 'costsHelp', 'financialArrow', 'equipmentHelp', 'equipmentArrow',
    'eligibility', 'fees', 'reviewStatus', 'website', 'directoryIn',
    'answersOut', 'publishedSource', 'pendingSource', 'noDescription', 'otherCityFilter',
    'govtHospital', 'govtPsyHospital', 'privateSpecialistHospital', 'govtSpecialistHealth', 'psychiatryMental',
    'neurologySpec', 'mentalRehab', 'generalMedicine', 'specialistServices', 'neurology',
    'geriatrics', 'mentalSupport', 'psychiatry', 'mentalHealth', 'specMental',
    'specConsult', 'healthAssess', 'alliedHealth', 'specialistService', 'psychiatryAndMentalHealth',
    'rehabilitation', 'physio', 'occupationTherapy', 'providerDesc1', 'providerDesc2',
    'providerDesc3', 'providerDesc4', 'providerDesc5', 'fromPublisher', 'defaultPractical',
    'noSource', 'exampleOnly', 'categoryPreparing', 'categoryGovernmentHealth', 'categoryPrivateHealth',
    'categoryHealthcareProvider', 'categoryPharmacy', 'categoryPhysioRehab', 'categoryHomeCare', 'categoryRespiteCare',
    'categorySupportGroup', 'categoryGovernmentSupport', 'categoryFinancialAssistance', 'categoryOlderPersons', 'categoryDailyAids',
    'categoryMedication', 'categoryReminders', 'categoryMobility', 'categoryAssistive', 'categoryAll',
    'directorySample', 'directoryRecord', 'directoryPublished', 'directoryOfficial',
    'locationLabel', 'phoneLabel', 'emailLabel', 'sourceLabel', 'sourceColon',
  ],
  education: [
    'learnSiteTitle', 'eventDetailsClose', 'eventPoster', 'fullPoster', 'rcbcEvents',
    'eventSideInfo', 'malaysiaTime', 'registrationAvailability', 'eventCancelled', 'eventEnded',
    'eventClosed', 'externalForm', 'eventNotYet', 'contactRcbc', 'learningMaterials',
    'closeQA', 'previousQA', 'nextQA', 'qaPages', 'clearSearch',
    'layoutSwitch', 'listView', 'gridView', 'watchRecording', 'qaReview',
    'qaReviewSimple', 'qaUnavailable', 'learningTracks', 'availableIntakes', 'dcsFamilyUpcoming',
    'exploreTrainers', 'curriculum', 'serviceArea', 'scheduledIntakes', 'intakeNote',
    'openOriginal', 'closeImage', 'closeFacilitator', 'adfmFacilitator', 'dcsFramework',
    'facilitatedSessions', 'registrationNotOpen', 'certifiedActivityNote', 'governanceNotice', 'governanceText',
    'selectCalendar', 'previousCalendar', 'nextCalendar', 'fullCalendar', 'searchEvents',
    'clearSearchInput', 'filteringBy', 'registrationClosed', 'capacityColon', 'deadlineColon',
    'suitableForColon', 'viewRegistration', 'newsClipping', 'highResClipping', 'grassroot',
    'dialogueTown', 'dialoguePartnership', 'proposeVenue', 'viewTrainers', 'certified',
    'previousTrainer', 'nextTrainer', 'facilitatorCategory', 'searchTrainers', 'verifiedRCBC',
    'adfmPoster', 'facilitatorGuide', 'eventDetails', 'approvedResources', 'allOpenParen',
    'upcomingOpenParen', 'pastArchiveOpenParen', 'viewProfileArrow', 'viewDirectoryArrow', 'sessionsBy',
    'noSessions', 'viewPoster', 'viewInfo', 'more', 'closedParen',
    'registerForEvent', 'seats', 'cancelled', 'verifiedProfiles',
  ],
  shared: [
    'updatesTrainerAccess', 'selectLanguage', 'rotaryInternational', 'mainNavigation', 'mobileNavigation',
    'clickSwitchLanguage', 'searchSite', 'closeSearch', 'clearSearchLabel', 'please',
    'localPreview', 'reviewPending', 'searchUnderstand', 'searchFindHelp', 'searchLearnEvents',
    'searchDementiaDesc', 'searchAlzDesc', 'searchSignsDesc', 'searchMedicalDesc', 'searchHealthyDesc',
    'searchHealthTitle', 'searchHealthDesc', 'searchFinancialTitle', 'searchFinancialDesc', 'searchEquipmentTitle',
    'searchEquipmentDesc', 'searchServicesTitle', 'searchServicesDesc', 'searchCaringTitle', 'searchCaringDesc',
    'searchWellbeingTitle', 'searchWellbeingDesc', 'searchEducationTitle', 'searchEducationDesc', 'searchTrainingTitle',
    'searchTrainingDesc', 'searchWebinars', 'searchWebinarDesc', 'searchCTEvents', 'searchCTEventsDesc',
    'searchAboutDesc', 'searchContactDesc', 'onThisPage', 'readMore', 'showLess',
  ],
};

const reviewTypeOverrides = {
  providerDesc1: "medical",
  providerDesc2: "medical",
  providerDesc3: "medical",
  providerDesc4: "medical",
  providerDesc5: "medical",
  searchAlzDesc: "medical",
  searchMedicalDesc: "medical",
  searchHealthyDesc: "medical",
  searchDementiaDesc: "medical",
  caregiverEducation: "professional",
  dcsFramework: "professional",
  adfmFacilitator: "professional",
  facilitatedSessions: "professional",
  certifiedActivityNote: "professional",
  governanceNotice: "professional",
  governanceText: "professional",
  verifiedRCBC: "professional",
  adfmPoster: "professional",
  facilitatorGuide: "professional",
};

export const inlineCopyMetadata = Object.fromEntries(
  Object.entries(keysByPage).flatMap(([page, keys]) =>
    keys.map(key => [key, { page, reviewType: reviewTypeOverrides[key] || 'standard' }])
  )
);

export function inlineCopyMeta(key) {
  if(/^(education|dcsRegistry)/.test(key))return {page:'education',reviewType:/(Certificate|Ttt|Adfm|Adi|Pathway|Prerequisite|Assessment)/i.test(key)?'professional':'standard'};
  return inlineCopyMetadata[key] || null;
}
