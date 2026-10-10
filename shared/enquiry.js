export const enquiryTypes = ['General Enquiry', 'Education & Events', 'Collaboration', 'Website & Resources', 'Others'];

export function validateEnquiry(values) {
  const errors = {};
  if (typeof values.name !== 'string' || !values.name.trim() || values.name.length > 120) errors.name = 'Enter your name (up to 120 characters).';
  if (typeof values.email !== 'string' || values.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Enter a valid email address.';
  if (!enquiryTypes.includes(values.type)) errors.type = 'Choose an enquiry type.';
  if (typeof values.message !== 'string' || !values.message.trim() || values.message.length > 5000) errors.message = 'Enter a message (up to 5,000 characters).';
  return errors;
}
