import {
  isSafetyRelated,
  symptomLabel,
  timingLabel,
  vehicleLabel,
  type Assessment
} from './triage';

type Props = {
  assessment: Assessment;
  onBack: () => void;
};

function reportDate(value: string) {
  return new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
}

function ReportView({ assessment, onBack }: Props) {
  const safetyRelated = isSafetyRelated(assessment.symptoms);

  return (
    <main className="report-shell">
      <div className="report-toolbar">
        <button className="report-back" type="button" onClick={onBack}>← Back to checks</button>
        <button className="report-print" type="button" onClick={() => window.print()}>Print report</button>
      </div>

      <article className="report-page">
        <header className="report-header">
          <img src="./logo.svg" alt="DriveCare" />
          <span>VEHICLE SERVICE REPORT</span>
        </header>
        <p className="eyebrow report-kicker">A CLEAR STARTING POINT FOR YOUR WORKSHOP VISIT</p>
        <h1>What to discuss with your technician</h1>
        <p className="report-intro">A short summary of the symptoms you selected and the checks the guide brought up.</p>

        <section className="report-details" aria-label="Report details">
          <div><span>REPORT DATE</span><strong>{reportDate(assessment.createdAt)}</strong></div>
          <div><span>VEHICLE TYPE</span><strong>{vehicleLabel(assessment.vehicle)}</strong></div>
          <div><span>FIRST NOTICED</span><strong>{timingLabel(assessment.timing)}</strong></div>
        </section>

        <section className="report-section">
          <p className="eyebrow">YOUR NOTES</p>
          <h2>Symptoms noticed</h2>
          <ul className="report-symptoms">
            {assessment.symptoms.map(id => <li key={id}>{symptomLabel(id)}</li>)}
          </ul>
        </section>

        <section className="report-section">
          <p className="eyebrow">SUGGESTED CHECKS</p>
          <h2>Things to discuss</h2>
          <div className="report-checks">
            {assessment.recommendations.map((item, index) => (
              <div className="report-check" key={item.id}>
                <span className="report-index">0{index + 1}</span>
                <div><h3>{item.title}</h3><p>{item.reason}</p></div>
              </div>
            ))}
          </div>
        </section>

        <aside className={`report-guidance ${safetyRelated ? 'caution' : ''}`}>
          <strong>{safetyRelated ? 'Please take care' : 'A useful next step'}</strong>
          <p>{safetyRelated
            ? 'Brake changes or a high temperature can affect safety. If the car feels unsafe or the temperature is in the red, stop somewhere safe and contact roadside assistance or a qualified technician.'
            : 'Note when the issue happens and share these details with a qualified technician. Arrange a check sooner if it gets worse.'}</p>
        </aside>

        <footer className="report-footer">
          <img src="./logo.svg" alt="DriveCare" />
          <p>These suggestions come from a simple rule set. They are not a diagnosis or a measure of roadworthiness.</p>
        </footer>
      </article>
    </main>
  );
}

export default ReportView;
