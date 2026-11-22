import { useLocation } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { reviewedDate, whatsappShareUrl } from '../../shared/public-features';
import './PublicFeatures.css';

export function WhatsAppShare({ title = 'Rotary Hope Care', path }) {
  const location = useLocation();
  const { language } = useLanguage();
  const labels = { en: 'Share on WhatsApp', ms: 'Kongsi di WhatsApp', zh: '分享到 WhatsApp' };
  const url = new URL(path || location.pathname + location.hash, window.location.origin).href;
  return <a className="whatsapp-share" href={whatsappShareUrl(title, url)} target="_blank" rel="noopener noreferrer">
    {labels[language] || labels.en} <span aria-hidden="true">↗</span>
  </a>;
}

export function LastReviewed({ value }) {
  const { t } = useLanguage();
  const date = reviewedDate(value);
  if (!date) return null;
  return <p className="last-reviewed">{t.publishedRecords?.lastReviewed || 'Last reviewed:'}{' '}
    <time dateTime={date.iso}>{date.label}</time>
  </p>;
}

export default function PublicPageActions() {
  const { pathname } = useLocation();
  // Subscription and certificate URLs may contain private tokens or personal details.
  if (pathname.startsWith('/get-updated') || pathname.includes('certificate') || pathname.startsWith('/learn-events/event/')) return null;
  return <div className="public-page-actions"><WhatsAppShare /></div>;
}
