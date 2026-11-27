export const enquiryTypes = [
  'General Enquiry',
  'Education & Training',
  'Events & Participation',
  'Collaboration & Partnership',
  'Volunteering & Project Support',
  'Website & Resource Feedback',
];
export const enquiryMessageLimit = 2000;
export const enquiryStatuses = { new: 'New', 'follow-up': 'In Progress', closed: 'Responded' };

export function validateEnquiry(values) {
  const errors = {};
  if (typeof values.name !== 'string' || !values.name.trim() || values.name.length > 120) errors.name = 'Enter your name (up to 120 characters).';
  if (typeof values.email !== 'string' || values.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Enter a valid email address.';
  if (!enquiryTypes.includes(values.type)) errors.type = 'Choose an enquiry type.';
  if (typeof values.message !== 'string' || !values.message.trim() || values.message.length > enquiryMessageLimit) errors.message = 'Enter a message (up to 2,000 characters).';
  return errors;
}
