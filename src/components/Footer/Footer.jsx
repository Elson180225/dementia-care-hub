import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="footer-eyebrow">
              Rotary Hope Care
            </span>

            <h2>
              Alzheimer&apos;s Care
            </h2>

            <p>
              Clear information, practical resources and community support for
              people living with dementia, caregivers and families.
            </p>
          </div>

          <div className="footer-links-group">
            <h3>Explore</h3>

            <Link to="/understand-dementia">
              Understand Dementia
            </Link>

            <Link to="/find-help">
              Find Help
            </Link>

            <Link to="/caregiver-support">
              Caregiver Support
            </Link>

            <Link to="/learn-events">
              Learn & Events
            </Link>
          </div>

          <div className="footer-links-group">
            <h3>About</h3>

            <Link to="/about">
              About Us
            </Link>

            <Link to="/about/contact">
              Contact Us
            </Link>

            <Link to="/about/locations">
              Where to Find Us
            </Link>

            <Link to="/about/support">
              Support the Project
            </Link>
          </div>

          <div className="footer-contact">
            <h3>Need guidance?</h3>

            <p>
              If you&apos;re not sure where to start, contact the project team
              and we&apos;ll help direct you to the appropriate information.
            </p>

            <Link
              to="/about/contact"
              className="footer-contact-button"
            >
              Contact Us
            </Link>
          </div>
        </div>

        <div className="footer-divider" />

        <div className="footer-bottom">
          <div>
            <strong>
              Rotary Club of Bintulu Central
            </strong>

            <span>
              Hope Care • Alzheimer&apos;s Care
            </span>
          </div>

          <div className="footer-bottom-links">
            <button type="button">
              English
            </button>

            <span>
              © {new Date().getFullYear()} Rotary Hope Care
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;