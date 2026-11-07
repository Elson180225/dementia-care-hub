export const applicationStatuses = ['new','under-review','accepted','waitlisted','declined'];
export function validateTrackApplication(data) {
  const result = {};
  for (const [key,max] of Object.entries({trackId:200,fullName:200,email:254,phone:80,role:150,preferredLanguage:100,intakeLocation:300,notes:2000})) {
    const value=data[key];
    if (value != null && typeof value !== 'string') throw new Error('Invalid '+key);
    result[key]=(value || '').trim();
    if(result[key].length>max) throw new Error(key+' is too long');
  }
  result.email=result.email.toLowerCase();
  if(!result.trackId || !result.fullName || !result.phone || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) throw new Error('Enter your name, valid email address, phone number and training track.');
  if(data.consent!==true) throw new Error('Please agree to RCBC using your details to review and contact you about this application.');
  return result;
}
