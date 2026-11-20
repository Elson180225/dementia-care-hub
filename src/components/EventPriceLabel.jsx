import {useLanguage} from '../i18n/LanguageContext';
import {eventPriceLabel} from '../../shared/event-registration';
export default function EventPriceLabel({event}){
 const settings=event.registration_settings;
 const {t}=useLanguage();
 return <span style={{display:'inline-block',fontSize:13,fontWeight:700,padding:'5px 9px',borderRadius:6,background:settings?.paid?'#fff0d4':'#eef6f2',color:settings?.paid?'#744a0d':'#245c47',whiteSpace:'normal'}}>{eventPriceLabel(event,t.learnEvents.priceLabels)}</span>;
}
