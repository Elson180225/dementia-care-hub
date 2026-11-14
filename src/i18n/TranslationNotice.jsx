import {useLanguage} from './LanguageContext';
export default function TranslationNotice(){
 const {language}=useLanguage();
 return language==='en'?null:<p role="status" style={{margin:0,padding:'12px 24px',background:'#f3eef8',color:'#452b60',textAlign:'center',fontSize:14}}>Some content is shown in English while translations are being reviewed.</p>;
}
