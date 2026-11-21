import { useLanguage } from './LanguageContext';
import { translations } from './translations';
import { translateCataloguedLabel } from './labelLookup';

/** Fixed public text bound to a stable ui/inlineCopy/<id> approval key. */
export default function Trans({ children, text, id }) {
  const { t, translateLabel } = useLanguage();
  const original = text ?? children;
  if (id) return translateCataloguedLabel(original, id, translations.en, t);
  // Legacy fallback for labels that do not have a dedicated catalogue key.
  return translateLabel(original);
}
