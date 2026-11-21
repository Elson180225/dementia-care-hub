import {useLanguage} from './LanguageContext';
import Trans from './Trans';
export default function TranslationNotice(){
 const {language,bundledPreview}=useLanguage();
 return language==='en'?null:<p role="status" style={{margin:0,padding:'12px 24px',background:'#f3eef8',color:'#452b60',textAlign:'center',fontSize:14}}>{bundledPreview ? <Trans id="localPreview">Local preview: the bundled translations have not been approved for public use. Some text may remain in English.</Trans> : <Trans id="reviewPending">Some content is shown in English while translations are being reviewed.</Trans>}</p>;
}
