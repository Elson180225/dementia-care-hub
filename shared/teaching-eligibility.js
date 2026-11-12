// RCBC teaching eligibility rules (feedback, 8 Nov 2026). Shown only; no automatic trainer matching.
export const ASSESSMENT_LABEL = {
  not_assessed: 'Not assessed yet',
  completed: 'Completed training',
  pass: 'Pass',
  independent: 'Independent',
  unsuccessful: 'Unsuccessful',
};

// hcp is the healthcare_professional field: true, false or null (not recorded).
export function teachingEligibility(status, hcp) {
  if (!['pass', 'independent', 'unsuccessful'].includes(status)) return 'Waiting for assessment';
  if (hcp === null || hcp === undefined) return 'Record whether the trainer is a healthcare professional first';
  if (status === 'independent' && hcp) return 'May teach alone';
  if (status === 'independent') return 'Non-medical topics alone; medical topics only with an HCP';
  return 'Only in a trainer group with at least one HCP';
}