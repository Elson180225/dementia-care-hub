export const normaliseEmail=value=>String(value||'').trim().toLowerCase();
export function normalisePhone(value){
 let digits=String(value||'').replace(/\D/g,'');
 if(digits.startsWith('00'))digits=digits.slice(2);
 if(digits.startsWith('0'))digits='60'+digits.slice(1);
 return digits;
}
export function registrationDuplicates(value,existing){
 const email=normaliseEmail(value.email),phone=normalisePhone(value.phone);
 return {
  email:existing.find(p=>email&&normaliseEmail(p.email)===email),
  phone:existing.find(p=>phone&&normalisePhone(p.phone)===phone)
 };
}
