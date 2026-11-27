import { useSearchParams } from 'react-router-dom';
import DirectoryListings from '../../components/DirectoryListings';
import { useLanguage } from '../../i18n/LanguageContext';
import { directoryCategories } from '../../../shared/directory.js';

export default function ResourceFinder() {
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const requestedCategory = params.get('category');
  const category = Object.keys(directoryCategories).find(key =>
    key === requestedCategory || directoryCategories[key].includes(requestedCategory)
  ) || '';
  return <main className="rf-page">
    <header className="rf-intro">
      <div className="rf-container">
        <p className="rf-eyebrow">{t.header.menu.findHelp}</p>
        <h1>{t.header.menu.resourceFinder || 'Resource Finder'}</h1>
        <p>{t.directory.intro}</p>
      </div>
    </header>
    <section className="rf-container rf-directory" id="resource-finder">
      <DirectoryListings
        key={params.toString()}
        initial={{ category, type: params.get('type') || '', location: params.get('location') || '' }}
        linkedId={params.get('resource')}
        resultsId="finder-results"
      />
      <p className="rf-boundary">{t.resourceFinderPage.boundaryText}</p>
    </section>
  </main>;
}
