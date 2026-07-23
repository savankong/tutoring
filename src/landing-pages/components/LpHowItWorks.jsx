const STEPS = [
  { title: 'Snap a photo', body: 'Point your phone at the question — on a screen, a printout, anywhere.' },
  { title: 'Get the answer', body: 'Cambo reads the question and answers it in a few seconds.' },
  { title: 'See the explanation', body: 'Read the reasoning behind the answer so it actually sticks.' },
];

function LpHowItWorks() {
  return (
    <section className="how-section lp-how-section">
      <div>
        <div className="section-eyebrow">How it works</div>
        <h2>Three steps, a few seconds each.</h2>
        <div className="steps-list">
          {STEPS.map((step, i) => (
            <div className="step-row" key={step.title}>
              <div className="step-num">{String(i + 1).padStart(2, '0')}</div>
              <div className="step-title">{step.title}</div>
              <div className="step-body">{step.body}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default LpHowItWorks;
