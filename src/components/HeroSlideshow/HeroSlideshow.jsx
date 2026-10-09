import { useCallback, useEffect, useState } from "react";

import alzheimersHero from "../../assets/alzheimers-hero.jpg";
import seniorCitizens from "../../assets/Senior-citizens-chatting.png";
import groupPhoto from "../../assets/Group_Photo.png";
import groupPhoto2 from "../../assets/Group_Photo_2.png";
import adelaideBeach from "../../assets/Adelaide-Beach-volunteers.png";
import getInvolvedHero from "../../assets/Get-involved-hero.png";

import "./HeroSlideshow.css";

const slides = [
  {
    src: alzheimersHero,
    alt: "Rotary Hope Care Alzheimer's Care artwork",
    label: "Hope Care",
  },
  {
    src: seniorCitizens,
    alt: "Senior citizens chatting and sharing stories",
    label: "Community Connection",
  },
  {
    src: groupPhoto,
    alt: "Volunteers and community members group photo",
    label: "Together We Care",
  },
  {
    src: groupPhoto2,
    alt: "Rotary volunteers group gathering",
    label: "Volunteer Spirit",
  },
  {
    src: adelaideBeach,
    alt: "Volunteers at Adelaide Beach community event",
    label: "Community Events",
  },
  {
    src: getInvolvedHero,
    alt: "Get involved with dementia care support",
    label: "Get Involved",
  },
];

const SLIDE_DURATION = 5000;

function HeroSlideshow() {
  const [activeIndex, setActiveIndex] = useState(0);

  const goToSlide = useCallback((index) => {
    const next =
      index < 0 ? slides.length - 1 : index >= slides.length ? 0 : index;
    setActiveIndex(next);
  }, []);

  const goNext = useCallback(() => {
    setActiveIndex((current) => (current + 1) % slides.length);
  }, []);

  const goPrev = useCallback(() => {
    setActiveIndex(
      (current) => (current - 1 + slides.length) % slides.length
    );
  }, []);

  /* auto-advance */
  useEffect(() => {
    const timer = setInterval(goNext, SLIDE_DURATION);

    return () => clearInterval(timer);
  }, [goNext, activeIndex]);

  /* keyboard navigation when slideshow container is focused */
  const handleKeyDown = (event) => {
    if (event.key === "ArrowLeft") {
      goPrev();
    } else if (event.key === "ArrowRight") {
      goNext();
    }
  };

  return (
    <div
      className="hero-slideshow"
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Hero image slideshow"
      aria-roledescription="carousel"
      tabIndex={0}
    >
      {/* SLIDES */}
      <div className="hero-slideshow-track">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`hero-slide ${
              index === activeIndex ? "hero-slide-active" : ""
            }`}
            aria-hidden={index !== activeIndex}
            role="group"
            aria-label={`${index + 1} of ${slides.length}: ${slide.label}`}
            aria-roledescription="slide"
          >
            <img src={slide.src} alt={slide.alt} />
            <div className="hero-slide-overlay" />
            <span className="hero-slide-label">{slide.label}</span>
          </div>
        ))}
      </div>

      {/* ARROWS */}
      <button
        type="button"
        className="hero-slideshow-arrow hero-slideshow-arrow-prev"
        onClick={goPrev}
        aria-label="Previous slide"
      >
        &#8249;
      </button>

      <button
        type="button"
        className="hero-slideshow-arrow hero-slideshow-arrow-next"
        onClick={goNext}
        aria-label="Next slide"
      >
        &#8250;
      </button>

      {/* DOTS */}
      <div className="hero-slideshow-dots" role="tablist">
        {slides.map((slide, index) => (
          <button
            key={index}
            type="button"
            className={`hero-slideshow-dot ${
              index === activeIndex ? "hero-slideshow-dot-active" : ""
            }`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}: ${slide.label}`}
            aria-selected={index === activeIndex}
            role="tab"
          />
        ))}
      </div>
    </div>
  );
}

export default HeroSlideshow;
