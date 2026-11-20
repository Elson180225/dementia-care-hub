// RCBC teaching eligibility rules (feedback, 8 Nov 2026). Shown only; no automatic trainer matching.
export const ASSESSMENT_LABEL = {
  not_assessed: 'Not assessed yet',
  completed: 'Completed',
  pass: 'Pass',
  independent: 'Independent',
  unsuccessful: 'Unsuccessful',
};

// Assessment and background never grant teaching permission.
export function teachingEligibility(_status,_hcp,allowed=false){
 return allowed?'Teaching approved by RCBC — within recorded scope':'Not approved to conduct training';
}
