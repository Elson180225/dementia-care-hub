import {
    aboutNav,
    overview,
    mission,
    journey,
    organiser,
    strategicPartner,
    advisors,
    supportedBy,
    acknowledgements,
} from "../data/about";
import "../AboutProject.css";

function Section({ id, title, children }) {
    return (
        <section id={id} className="about-section" aria-labelledby={`${id}-title`}>
            <h2 id={`${id}-title`}>{title}</h2>
            {children}
        </section>
    );
}

function ContributionList({ items }) {
    return (
        <ul className="about-list">
            {items.map((item) => (
                <li key={item.name}>
                    <strong>{item.name}</strong> - {item.contribution || item.support}
                    {(item.programme || item.phase) && (
                        <span> | {item.programme || item.phase}</span>
                    )}
                </li>
            ))}
        </ul>
    );
}

export default function AboutProject(){
    return (
        <main className="about-page">
            <header className="about-hero">
                <div className="about-container">
                    <p className="about-kicker">ABOUT THE PROJECT</p>
                    <h1>{overview.project}</h1>
                    <p className="about-theme">“{overview.theme}”</p>
                </div>
            </header>

            <div className="about-container about-layout">
                <nav className="about-toc" aria-label="On this page">
                    <p className="about-toc-title">On this page</p>
                    <ol>
                        {aboutNav.map((item) => (
                            <li key={item.id}>
                                <a href={`#${item.id}`}>{item.label}</a>
                            </li>
                        ))}
                    </ol>
                </nav>

                <div className="about-content">
                    <Section id="overview" title="Project Overview">
                        <p>{overview.intro}</p>
                        <p>{overview.platformText}</p>
                        <div className="about-two-col">
                            <h3>Dementia Care Connect is</h3>
                            <ul>
                                {overview.is.map((t) => (
                                    <li key={t}>{t}</li>
                                ))}
                            </ul>
                        </div>
                        <div className="about-card about-card-isnot">
                            <h3>Dementia Care Connect is not</h3>
                            <ul>
                                {overview.isNot.map((t) => (
                                    <li key={t}>{t}</li>
                                ))}
                            </ul>
                        </div>
                    </Section>

                    <Section id="mission" title="Our Mission & Vision">
                        <div className="about-two-col">
                            <div className="about-card">
                                <h3>Mission</h3>
                                <p>{mission.mission}</p>
                            </div>
                            <div className="about-card">
                                <h3>Vision</h3>
                                <p>{mission.vision}</p>
                            </div>
                        </div>
                    </Section>

                    <Section id="journey" title="Our Journey">
                        <ol className="about-journey">
                            {journey.map((step) => (
                                <li
                                    key={step.phase}
                                    className={step.current ? "is-current": ""}
                                    aria-current={step.current ? "step" : undefined}
                                >
                                    <span className="about-phase">{step.phase}</span>
                                    <h3>{step.title}</h3>
                                    <p>{step.text}</p>
                                    {step.current && (
                                        <span className="about-badge">You are here</span>
                                    )}
                                </li>
                            ))}
                        </ol>
                    </Section>

                    <Section id="organiser" title="Organiser">
                        <h3>{organiser.name}</h3>
                        <p>{organiser.text}</p>
                        {organiser.link && (
                            <p>
                                <a href={organiser.link} target="_blank" rel="noopener noreferrer">
                                    Visit the Rotary Club Website
                                </a>
                            </p>
                        )}
                    </Section>

                    <Section id="partner" title="Strategic Partner">
                        <h3>{strategicPartner.name}</h3>
                        <p>{strategicPartner.text}</p>
                    </Section>

                    <Section id="advisors" title="Project Advisors">
                        <p>{advisors.role}</p>
                        <ul className="about-people">
                            {advisors.people.map((name) => (
                                <li key={name}>
                                    <strong>{name}</strong>
                                    <span>Project Advisor</span>
                                </li>
                            ))}
                        </ul>
                    </Section>

                    <Section id="supported" title="Supported By">
                        <p>{supportedBy.text}</p>
                        {supportedBy.items.length > 0 ? (
                            <ContributionList items={supportedBy.items} />
                        ) : (
                            <p className="about-pending">
                                Supporting organisations will be listed here once confirmed by RCBC.
                            </p>
                        )}
                    </Section>

                    <Section id="acknowledgements" title="Acknowledgements">
                        <p>
                            We thank you everyone who has contributed to the project. Each acknowledgement shows who contributed, how, and in which phase or programme.
                        </p>
                        {acknowledgments.map((group) =>(
                            <div key={group.title} className="about-ack">
                                <h3>{group.title}</h3>
                                <p>{group.text}</p>
                                {group.items.length > 0 ? (
                                    <ContributionList items={group.items} />
                                ) : (
                                    <p className="about-pending">To be confirmed by RCBC.</p>
                                )}
                            </div>
                        ))}
                    </Section>
                </div>
            </div>
        </main>
    )
}