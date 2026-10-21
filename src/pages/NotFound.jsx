import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";

function NotFound() {
  const { t } = useLanguage();
  const nf = t.notFound || {};

  return (
    <main className="page">
      <div className="page-container">
        <h1>{nf.title || "Page not found"}</h1>

        <p>
          {nf.desc || "The page you are looking for may have moved or may no longer exist."}
        </p>

        <Link to="/">{nf.returnHome || "Return to homepage"}</Link>
      </div>
    </main>
  );
}

export default NotFound;