import { useState } from "react";
import faqs from "../../data/faqs";
import "./FAQ.css";

function FAQ() {
  const [openId, setOpenId] = useState(null);

  const toggleFAQ = (id) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <section className="faq-section">
      <div className="faq-container">
        <div className="faq-heading">
          <span className="faq-label">Frequently Asked Questions</span>

          <h2>Questions people often ask.</h2>

          <p>
            Find quick answers to common questions about dementia,
            Alzheimer&apos;s disease, support and available resources.
          </p>
        </div>

        <div className="faq-list">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;

            return (
              <div
                className={`faq-item ${isOpen ? "faq-item-open" : ""}`}
                key={faq.id}
              >
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => toggleFAQ(faq.id)}
                  aria-expanded={isOpen}
                >
                  <span>{faq.question}</span>

                  <span className="faq-icon">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                <div
                  className={`faq-answer ${
                    isOpen ? "faq-answer-open" : ""
                  }`}
                >
                  <div className="faq-answer-inner">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FAQ;