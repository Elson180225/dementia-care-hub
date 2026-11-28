
import { Link, useSearchParams } from 'react-router-dom';
import DirectoryListings from '../../components/DirectoryListings';
import { useLanguage } from '../../i18n/LanguageContext';
import { directoryCategories } from '../../../shared/directory.js';

const listingCopy = {
  en: {
    eyebrow: 'COMMUNITY PARTNERS',
    heading: 'Are you a service provider?',
    description: 'Help us keep our community resource directory accurate and up to date.',
    applyTitle: 'Apply for a Listing',
    applyDescription: 'Submit your organisation or service for review by RCBC.',
    applyButton: 'Apply now',
    updateTitle: 'Request to Update a Listing',
    updateDescription: 'Request corrections or updates to existing directory information.',
    updateButton: 'Request update',
    note: 'All requests are subject to RCBC review before publication.'
  },

  ms: {
    eyebrow: 'RAKAN KOMUNITI',
    heading: 'Adakah anda penyedia perkhidmatan?',
    description: 'Bantu kami memastikan direktori sumber komuniti sentiasa tepat dan terkini.',
    applyTitle: 'Mohon Penyenaraian',
    applyDescription: 'Hantar maklumat organisasi atau perkhidmatan anda untuk semakan oleh RCBC.',
    applyButton: 'Mohon sekarang',
    updateTitle: 'Mohon Kemas Kini Penyenaraian',
    updateDescription: 'Mohon pembetulan atau kemas kini maklumat sedia ada dalam direktori.',
    updateButton: 'Mohon kemas kini',
    note: 'Semua permohonan tertakluk kepada semakan RCBC sebelum diterbitkan.'
  },

  zh: {
    eyebrow: '社区合作伙伴',
    heading: '您是服务提供者吗？',
    description: '帮助我们确保社区资源目录的信息准确并及时更新。',
    applyTitle: '申请加入资源目录',
    applyDescription: '提交您的机构或服务信息，由 RCBC 进行审核。',
    applyButton: '立即申请',
    updateTitle: '申请更新目录信息',
    updateDescription: '申请更正或更新资源目录中的现有信息。',
    updateButton: '申请更新',
    note: '所有申请均须经过 RCBC 审核后方可发布。'
  }
};

export default function ResourceFinder() {
  const { t, language } = useLanguage();
  const copy = listingCopy[language] || listingCopy.en;

  const [params] = useSearchParams();
  const requestedCategory = params.get('category');

  const category = Object.keys(directoryCategories).find(key =>
    key === requestedCategory ||
    directoryCategories[key].includes(requestedCategory)
  ) || '';

  return (
    <main
      className="rf-page"
      id="main-content"
      tabIndex={-1}
    >
      <header className="rf-intro">
        <div className="rf-container">
          <p className="rf-eyebrow">
            {t.header.menu.findHelp}
          </p>

          <h1>
            {t.header.menu.resourceFinder || 'Resource Finder'}
          </h1>

          <p>{t.directory.intro}</p>
        </div>
      </header>

      <section
        className="rf-container rf-directory"
        id="resource-finder"
      >
        <DirectoryListings
          finderLayout
          key={params.toString()}
          initial={{
            category,
            type: params.get('type') || '',
            location: params.get('location') || ''
          }}
          linkedId={params.get('resource')}
          resultsId="finder-results"
        />

        <section className="rf-listing-requests">
          <div className="rf-listing-heading">
            <span>{copy.eyebrow}</span>

            <h2>{copy.heading}</h2>

            <p>{copy.description}</p>
          </div>

          <div className="rf-listing-grid">

            <Link
              to="/find-help/apply-for-listing"
              className="rf-listing-card rf-listing-apply"
            >
              <div
                className="rf-listing-icon"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="30"
                  height="30"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 21V5h12v16M16 10h4v11M2 21h20" />
                  <path d="M8 9h4M8 13h4M8 17h4" />
                </svg>
              </div>

              <h3>{copy.applyTitle}</h3>

              <p>{copy.applyDescription}</p>

              <strong>
                {copy.applyButton}{' '}
                <span aria-hidden="true">→</span>
              </strong>
            </Link>

            <Link
              to="/find-help/update-listing"
              className="rf-listing-card rf-listing-update"
            >
              <div
                className="rf-listing-icon"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="30"
                  height="30"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 3H5v18h14v-9" />
                  <path d="m12 15 8-8-4-4-8 8-1 5z" />
                </svg>
              </div>

              <h3>{copy.updateTitle}</h3>

              <p>{copy.updateDescription}</p>

              <strong>
                {copy.updateButton}{' '}
                <span aria-hidden="true">→</span>
              </strong>
            </Link>

          </div>

          <p className="rf-listing-note">
            {copy.note}
          </p>
        </section>

        <p className="rf-boundary">
          {t.resourceFinderPage.boundaryText}
        </p>
      </section>
    </main>
  );
}
