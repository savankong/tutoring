function PhoneMockup({ children, headerRight, onPrev, onNext, activeIndex, count, onGoTo }) {
  return (
    <>
      <div className="mockup-row">
        <button
          type="button"
          className="mockup-nav-arrow mockup-nav-arrow-prev"
          onClick={onPrev}
          aria-label="Previous example"
        >
          ‹
        </button>
        <div className="phone-frame">
          <div className="phone-inner">
            <div className="phone-notch" />
            <div className="phone-app-header">
              <span>📷 Cambo</span>
              {headerRight}
            </div>
            {children}
          </div>
        </div>
        <button
          type="button"
          className="mockup-nav-arrow mockup-nav-arrow-next"
          onClick={onNext}
          aria-label="Next example"
        >
          ›
        </button>
      </div>
      <div className="mockup-dots-row">
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            type="button"
            className={`mockup-dot${i === activeIndex ? ' mockup-dot-active' : ''}`}
            onClick={() => onGoTo(i)}
            aria-label={`Example ${i + 1}`}
          />
        ))}
      </div>
    </>
  );
}

export default PhoneMockup;
