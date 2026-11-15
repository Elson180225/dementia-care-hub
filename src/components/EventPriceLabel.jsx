export default function EventPriceLabel({event}){
 const settings=event.registration_settings;
 return <span style={{display:'inline-block',fontSize:13,fontWeight:700,padding:'5px 9px',borderRadius:6,background:settings?.paid?'#fff0d4':'#eef6f2',color:settings?.paid?'#744a0d':'#245c47',whiteSpace:'normal'}}>{settings?(settings.paid?'Paid in-person programme':'Free online webinar'):'Registration details pending'}{settings?.paid&&settings.fee?' · '+settings.fee:''}</span>;
}
