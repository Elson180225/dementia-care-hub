export const volunteerFields = [
  {key:'name',max:150,required:true}, {key:'email',type:'email',max:254,required:true}, {key:'phone',type:'tel',max:40,required:true},
  {key:'city',max:150,required:true}, {key:'languages',max:250,required:true}, {key:'certificate',max:150,required:true},
  {key:'experience',max:2000,multiline:true}, {key:'interest',max:1000,multiline:true}, {key:'availability',max:500,multiline:true},
];
export function validateVolunteer(data){
  if(!data||data.consent!==true)throw Error('Consent is required.');
  const result={};
  for(const {key,max,required} of volunteerFields){const input=data[key]??'';if(typeof input!=='string')throw Error('Invalid field.');const value=input.trim();if((required&&!value)||value.length>max)throw Error('Invalid field: '+key);result[key]=value;}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)||!/^\+?[\d\s().-]{6,40}$/.test(result.phone)||result.phone.replace(/\D/g,'').length<6)throw Error('Invalid contact details.');
  return result;
}
