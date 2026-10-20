import PublishedRecords from "../../components/PublishedRecords";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import healthcareProviders from "../../data/healthcareProviders";
import { useLanguage } from "../../i18n/LanguageContext";

import "./AssessmentHealthcare.css";

const preparationItems = [
  {
    id: 1,
    title: "Changes you have noticed",
    description:
      "Write down changes in memory, thinking, behaviour or daily routines.",
  },
  {
    id: 2,
    title: "When the changes started",
    description:
      "Think about approximately when you first noticed the changes.",
  },
  {
    id: 3,
    title: "How often they happen",
    description:
      "Consider whether the changes are occasional, frequent or becoming more noticeable.",
  },
  {
    id: 4,
    title: "Impact on daily life",
    description:
      "Note whether the changes affect work, communication, medication, finances or everyday activities.",
  },
  {
    id: 5,
    title: "Medication & health information",
    description:
      "Prepare a list of current medications and relevant medical conditions.",
  },
  {
    id: 6,
    title: "Consider bringing someone with you",
    description:
      "A family member or trusted person who has noticed the changes may help provide useful information.",
  },
];

function AssessmentHealthcare() {
  const { t } = useLanguage();
  const ah = t.assessmentHealthcare || {};
  const currentPrepItems = ah.items || preparationItems;

  const [activePathway, setActivePathway] =
    useState("government");

  const [checkedItems, setCheckedItems] =
    useState([]);

  const [providerCity, setProviderCity] =
    useState("All");

  const [providerType, setProviderType] =
    useState("All");

  const toggleItem = (id) => {
    setCheckedItems((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const completion = Math.round(
    (checkedItems.length /
      currentPrepItems.length) *
      100
  );

  const filteredProviders = useMemo(() => {
    return healthcareProviders.filter(
      (provider) => {
        const matchesCity =
          providerCity === "All" ||
          provider.city === providerCity;

        const matchesType =
          providerType === "All" ||
          provider.pathway === providerType;

        return matchesCity && matchesType;
      }
    );
  }, [providerCity, providerType]);

  return (
    <main className="assessment-page">
      <PublishedRecords kind="organisations" category="healthcare" title="Published directory records" />
      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="assessment-hero">
        <div className="assessment-container">
          <span className="assessment-kicker">
            {ah.kicker || "Find Help & Support"}
          </span>

          <h1>
            {ah.title || "Assessment & Healthcare"}
          </h1>

          <p>
            {ah.subtitle || "If you are concerned about changes in memory, thinking or behaviour, this page can help you prepare and understand where to go next."}
          </p>

          <div className="assessment-hero-actions">
            <a
              href="#prepare"
              className="assessment-primary-button"
            >
              {ah.prepHeading ? ah.prepHeading.split(" ")[0] + " " + (ah.prepHeading.split(" ")[1] || "") : "Start with preparation"}
              <span>↓</span>
            </a>

            <Link
              to="/learn-events/dementia-education"
              className="assessment-secondary-button"
            >
              {t.header?.menu?.whatIsDementia || "Learn about dementia"}
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================
          JOURNEY
      ====================================================== */}

      <section className="assessment-journey">
        <div className="assessment-container">
          <div className="assessment-journey-grid">
            <div>
              <span>01</span>
              <strong>{ah.journeyTitle1 || "Prepare"}</strong>
              <p>
                {ah.journeyDesc1 || "Note the changes you or your family have observed."}
              </p>
            </div>

            <div>
              <span>02</span>
              <strong>{ah.journeyTitle2 || "Choose a pathway"}</strong>
              <p>
                {ah.journeyDesc2 || "Understand government and private healthcare options."}
              </p>
            </div>

            <div>
              <span>03</span>
              <strong>{ah.journeyTitle3 || "Find a provider"}</strong>
              <p>
                {ah.journeyDesc3 || "Browse hospitals and specialist services in Sarawak."}
              </p>
            </div>

            <div>
              <span>04</span>
              <strong>{ah.journeyTitle4 || "Continue support"}</strong>
              <p>
                {ah.journeyDesc4 || "Use other Dementia Care Connect resources after assessment."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          PREPARATION
      ====================================================== */}

      <section
        className="assessment-preparation"
        id="prepare"
      >
        <div className="assessment-container">
          <div className="assessment-preparation-layout">
            <div className="assessment-preparation-copy">
              <span className="assessment-section-label">
                {ah.prepKicker || "Before an assessment"}
              </span>

              <h2>
                {ah.prepHeading || "A little preparation can make the conversation easier."}
              </h2>

              <p>
                {ah.prepDesc || "You do not need to diagnose anything yourself. The goal is simply to bring useful information to a healthcare professional."}
              </p>

              <div className="assessment-progress-box">
                <div>
                  <strong>
                    {ah.progressText || "Preparation checklist"}
                  </strong>

                  <span>
                    {checkedItems.length} / {currentPrepItems.length}
                  </span>
                </div>

                <div className="assessment-progress-track">
                  <div
                    className="assessment-progress-fill"
                    style={{
                      width: `${completion}%`,
                    }}
                  />
                </div>

                <small>
                  {completion}% {ah.completedSuffix || "complete"}
                </small>
              </div>
            </div>

            <div className="assessment-checklist">
              {currentPrepItems.map((item) => {
                const checked =
                  checkedItems.includes(item.id);

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`assessment-check-item ${
                      checked
                        ? "assessment-check-item-done"
                        : ""
                    }`}
                    onClick={() =>
                      toggleItem(item.id)
                    }
                  >
                    <span className="assessment-check-circle">
                      {checked ? "✓" : ""}
                    </span>

                    <div>
                      <strong>
                        {item.title}
                      </strong>

                      <p>
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          HEALTHCARE PATHWAYS
      ====================================================== */}

      <section className="assessment-pathways">
        <div className="assessment-container">
          <div className="assessment-section-heading">
            <span>
              {ah.pathwaysSectionLabel || "Healthcare pathways"}
            </span>

            <h2>
              {ah.pathwaysTitle || "Where can you go for an assessment?"}
            </h2>

            <p>
              {ah.pathwaysDesc || "The exact pathway can depend on your circumstances. Contact the healthcare provider directly to confirm referral and appointment requirements."}
            </p>
          </div>

          <div className="assessment-pathway-selector">
            <button
              type="button"
              className={
                activePathway === "government"
                  ? "assessment-pathway-active"
                  : ""
              }
              onClick={() =>
                setActivePathway("government")
              }
            >
              {ah.govtTab || "Government Healthcare"}
            </button>

            <button
              type="button"
              className={
                activePathway === "private"
                  ? "assessment-pathway-active"
                  : ""
              }
              onClick={() =>
                setActivePathway("private")
              }
            >
              {ah.privateTab || "Private Healthcare"}
            </button>
          </div>

          {activePathway === "government" && (
            <div className="assessment-pathway-content">
              <div className="assessment-pathway-intro">
                <span>
                  {ah.govtIntroSpan || "Government pathway"}
                </span>

                <h3>
                  {ah.govtIntroTitle || "Start with the public healthcare system."}
                </h3>

                <p>
                  {ah.govtIntroText || "The exact process should be confirmed with the relevant clinic or hospital before your visit."}
                </p>
              </div>

              <div className="assessment-flow">
                <div>
                  <span>01</span>
                  <strong>
                    {ah.govtFlow1Title || "Contact a government clinic"}
                  </strong>
                  <p>
                    {ah.govtFlow1Desc || "Explain the changes or concerns that you have noticed."}
                  </p>
                </div>

                <div className="assessment-flow-arrow">
                  →
                </div>

                <div>
                  <span>02</span>
                  <strong>
                    {ah.govtFlow2Title || "Initial assessment"}
                  </strong>
                  <p>
                    {ah.govtFlow2Desc || "Healthcare staff may assess the concern and determine the next step."}
                  </p>
                </div>

                <div className="assessment-flow-arrow">
                  →
                </div>

                <div>
                  <span>03</span>
                  <strong>
                    {ah.govtFlow3Title || "Hospital or specialist"}
                  </strong>
                  <p>
                    {ah.govtFlow3Desc || "Referral may be made where specialist assessment is appropriate."}
                  </p>
                </div>

                <div className="assessment-flow-arrow">
                  →
                </div>

                <div>
                  <span>04</span>
                  <strong>
                    {ah.govtFlow4Title || "Follow-up"}
                  </strong>
                  <p>
                    {ah.govtFlow4Desc || "Follow-up arrangements depend on the healthcare provider and assessment outcome."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activePathway === "private" && (
            <div className="assessment-pathway-content">
              <div className="assessment-pathway-intro">
                <span>
                  {ah.privateIntroSpan || "Private pathway"}
                </span>

                <h3>
                  {ah.privateIntroTitle || "Contact a private hospital or relevant specialist."}
                </h3>

                <p>
                  {ah.privateIntroText || "Private providers may have different appointment, referral and consultation requirements."}
                </p>
              </div>

              <div className="assessment-flow assessment-flow-private">
                <div>
                  <span>01</span>
                  <strong>
                    {ah.privateFlow1Title || "Choose a provider"}
                  </strong>
                  <p>
                    {ah.privateFlow1Desc || "Identify a private hospital or suitable specialist service."}
                  </p>
                </div>

                <div className="assessment-flow-arrow">
                  →
                </div>

                <div>
                  <span>02</span>
                  <strong>
                    {ah.privateFlow2Title || "Contact the provider"}
                  </strong>
                  <p>
                    {ah.privateFlow2Desc || "Ask about available specialists, referral requirements and appointment procedures."}
                  </p>
                </div>

                <div className="assessment-flow-arrow">
                  →
                </div>

                <div>
                  <span>03</span>
                  <strong>
                    {ah.privateFlow3Title || "Attend assessment"}
                  </strong>
                  <p>
                    {ah.privateFlow3Desc || "Bring your prepared notes and relevant health information."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          REAL PROVIDERS
      ====================================================== */}

      <section className="assessment-provider-directory">
        <div className="assessment-container">
          <div className="assessment-provider-heading">
            <div>
              <span>
                {ah.directoryEyebrow || "Healthcare providers"}
              </span>

              <h2>
                {ah.directoryTitle || "Hospitals and specialist services in Sarawak."}
              </h2>
            </div>

            <p>
              {ah.directoryDesc || "Use the filters to explore government and private providers. Always contact the provider to confirm current service availability."}
            </p>
          </div>

          <div className="assessment-provider-filters">
            <select
              value={providerCity}
              onChange={(event) =>
                setProviderCity(
                  event.target.value
                )
              }
              aria-label="Filter healthcare providers by city"
            >
              <option value="All">
                {ah.allLocations || "All locations"}
              </option>

              <option value="Kuching">
                Kuching
              </option>

              <option value="Sibu">
                Sibu
              </option>

              <option value="Miri">
                Miri
              </option>
            </select>

            <select
              value={providerType}
              onChange={(event) =>
                setProviderType(
                  event.target.value
                )
              }
              aria-label="Filter healthcare providers by pathway"
            >
              <option value="All">
                {ah.govtAndPrivate || "Government & Private"}
              </option>

              <option value="government">
                {ah.govtOnly || "Government"}
              </option>

              <option value="private">
                {ah.privateOnly || "Private"}
              </option>
            </select>
          </div>

          <div className="assessment-provider-count">
            <strong>
              {filteredProviders.length}
            </strong>

            <span>
              {filteredProviders.length === 1
                ? (ah.providerLabel || "provider")
                : (ah.providersLabel || "providers")}
            </span>
          </div>

          <div className="assessment-provider-grid">
            {filteredProviders.map(
              (provider) => (
                <article
                  key={provider.id}
                  className="assessment-provider-card"
                >
                  <div className="assessment-provider-top">
                    <span>
                      {provider.type}
                    </span>

                    <span>
                      ◎ {provider.city}
                    </span>
                  </div>

                  <h3>
                    {provider.name}
                  </h3>

                  <p className="assessment-provider-description">
                    {provider.description}
                  </p>

                  <div className="assessment-provider-info">
                    <div>
                      <span>
                        {ah.labelAddress || "Address"}
                      </span>

                      <strong>
                        {provider.address}
                      </strong>
                    </div>

                    <div>
                      <span>
                        {ah.labelPhone || "Phone"}
                      </span>

                      <a
                        href={`tel:${provider.phone.replace(
                          /\s/g,
                          ""
                        )}`}
                      >
                        {provider.phone}
                      </a>
                    </div>

                    <div>
                      <span>
                        {ah.labelSpecialist || "Specialist field"}
                      </span>

                      <strong>
                        {provider.specialistField}
                      </strong>
                    </div>

                    <div>
                      <span>
                        {ah.labelEmail || "Email"}
                      </span>

                      {provider.email ? (
                        <a
                          href={`mailto:${provider.email}`}
                        >
                          {provider.email}
                        </a>
                      ) : (
                        <strong>
                          {ah.notListed || "Not listed"}
                        </strong>
                      )}
                    </div>
                  </div>

                  <div className="assessment-services">
                    <span>
                      {ah.labelServices || "Services"}
                    </span>

                    <div>
                      {provider.services.map(
                        (service) => (
                          <small key={service}>
                            {service}
                          </small>
                        )
                      )}
                    </div>
                  </div>

                  <div className="assessment-provider-footer">
                    <div>
                      <span className="assessment-verified">
                        {ah.verifiedSource || "✓ Verified source"}
                      </span>

                      <small>
                        {ah.reviewed || "Reviewed"}{" "}
                        {provider.lastReviewed}
                      </small>
                    </div>

                    <a
                      href={provider.website}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {ah.officialWebsite || "Official website"}
                      <span>↗</span>
                    </a>
                  </div>
                </article>
              )
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          RELATED SUPPORT
      ====================================================== */}

      <section className="assessment-related">
        <div className="assessment-container">
          <span className="assessment-section-label">
            {ah.relatedKicker || "Continue from here"}
          </span>

          <h2>
            {ah.relatedTitle || "Other support you may need."}
          </h2>

          <div className="assessment-related-grid">
            <Link to="/find-help/support-services">
              <span>01</span>

              <h3>
                {ah.cardSupportServicesTitle || "Support Services Directory"}
              </h3>

              <p>
                {ah.cardSupportServicesDesc || "Browse community, rehabilitation and other external support services."}
              </p>

              <strong>
                {ah.cardSupportServicesBtn || "Explore services →"}
              </strong>
            </Link>

            <Link to="/find-help/government-financial">
              <span>02</span>

              <h3>
                {ah.cardGovtFinancialTitle || "Government & Financial"}
              </h3>

              <p>
                {ah.cardGovtFinancialDesc || "Find official programmes and financial support information."}
              </p>

              <strong>
                {ah.cardGovtFinancialBtn || "Explore resources →"}
              </strong>
            </Link>

            <Link to="/find-help/equipment-practical">
              <span>03</span>

              <h3>
                {ah.cardEquipmentTitle || "Equipment & Practical Resources"}
              </h3>

              <p>
                {ah.cardEquipmentDesc || "Explore everyday aids and assistive technology."}
              </p>

              <strong>
                {ah.cardEquipmentBtn || "Explore equipment →"}
              </strong>
            </Link>

            <Link to="/find-help/resource-finder">
              <span>04</span>

              <h3>
                {ah.cardResourceFinderTitle || "Resource Finder"}
              </h3>

              <p>
                {ah.cardResourceFinderDesc || "Not sure what you need? Use the guided Resource Finder."}
              </p>

              <strong>
                {ah.cardResourceFinderBtn || "Start finder →"}
              </strong>
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================
          SERVICE BOUNDARY
      ====================================================== */}

      <section className="assessment-boundary">
        <div className="assessment-container">
          <div className="assessment-boundary-box">
            <span>
              i
            </span>

            <div>
              <strong>
                {ah.boundaryBoxTitle || "Information & Navigation Only"}
              </strong>

              <p>
                {ah.boundaryBoxText || "Dementia Care Connect provides information and navigation to external healthcare services. It does not provide diagnosis, appointment booking, medical referral or clinical care."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default AssessmentHealthcare;