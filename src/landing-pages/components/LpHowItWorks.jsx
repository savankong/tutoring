const STEPS = [
  { title: 'Snap a photo', body: 'Point your phone at the question — on a screen, a printout, anywhere.' },
  { title: 'Get the answer', body: 'Cambo reads the question and answers it in a few seconds.' },
  { title: 'See the explanation', body: 'Read the reasoning behind the answer so it actually sticks.' },
];

function LpHowItWorks() {
  return (
    <div className="zn-section">
      <div className="zn-section-head">
        <h2 className="zn-h2">Three steps, a few seconds each.</h2>
      </div>
      <div className="zn-grid3">
        {STEPS.map((step, i) => (
          <div className="zn-grid3-item" key={step.title}>
            <span className="zn-grid3-num">{String(i + 1).padStart(2, '0')}</span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LpHowItWorks;
