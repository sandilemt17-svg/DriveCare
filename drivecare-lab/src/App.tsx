import { useEffect, useMemo, useState } from 'react';
import ReportView from './ReportView';
import {
  isSafetyRelated,
  rankRecommendations,
  symptomLabel,
  symptomOptions,
  timingLabel,
  timingOptions,
  vehicleLabel,
  vehicleOptions,
  type Assessment,
  type SymptomId,
  type TimingId,
  type VehicleId
} from './triage';

type ApiStatus = 'checking' | 'ready' | 'offline';
const historyKey = 'drivecare-assessments-v1';

function readBrowserHistory(): Assessment[] {
  try {
    const value = localStorage.getItem(historyKey);
    return value ? JSON.parse(value) as Assessment[] : [];
  } catch {
    return [];
  }
}

function saveBrowserHistory(items: Assessment[]) {
  try {
    localStorage.setItem(historyKey, JSON.stringify(items.slice(0, 12)));
  } catch {
    // The current report still works when browser storage is unavailable.
  }
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function App() {
  const [vehicle, setVehicle] = useState<VehicleId>('hatchback');
  const [timing, setTiming] = useState<TimingId>('today');
  const [selected, setSelected] = useState<SymptomId[]>([]);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [history, setHistory] = useState<Assessment[]>([]);
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [reportMode, setReportMode] = useState(false);

  const safetyRelated = useMemo(() => assessment ? isSafetyRelated(assessment.symptoms) : false, [assessment]);

  async function loadHistory() {
    const response = await fetch('/api/assessments');
    if (!response.ok) throw new Error('History is unavailable.');
    const rows = await response.json() as Assessment[];
    setHistory(rows);
    saveBrowserHistory(rows);
  }

  useEffect(() => {
    let active = true;
    fetch('/api/health')
      .then(response => {
        if (!response.ok) throw new Error('API is unavailable.');
        return loadHistory();
      })
      .then(() => { if (active) setApiStatus('ready'); })
      .catch(() => {
        if (active) {
          setHistory(readBrowserHistory());
          setApiStatus('offline');
        }
      });
    return () => { active = false; };
  }, []);

  function toggleSymptom(id: SymptomId) {
    setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
    setFormError('');
  }

  async function createAssessment() {
    if (!selected.length) {
      setFormError('Choose at least one symptom to get started.');
      return;
    }
    setFormError('');
    setBusy(true);
    setMessage('');

    const localPreview: Assessment = {
      id: 'preview', vehicle, timing, symptoms: [...selected],
      recommendations: rankRecommendations(selected), createdAt: new Date().toISOString()
    };
    setAssessment(localPreview);
    setReportMode(true);

    try {
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle, timing, symptoms: selected })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not save this assessment.');
      const saved = payload as Assessment;
      setAssessment(saved);
      setHistory(current => {
        const next = [saved, ...current.filter(item => item.id !== saved.id)].slice(0, 12);
        saveBrowserHistory(next);
        return next;
      });
      setApiStatus('ready');
      setMessage('Saved on this computer.');
    } catch {
      const localRecord = { ...localPreview, id: `local-${Date.now()}` };
      setAssessment(localRecord);
      setHistory(current => {
        const next = [localRecord, ...current].slice(0, 12);
        saveBrowserHistory(next);
        return next;
      });
      setApiStatus('offline');
      setMessage('Saved in this browser.');
    } finally {
      setBusy(false);
    }
  }

  function openSaved(item: Assessment) {
    setAssessment(item);
    setMessage('Saved assessment opened.');
    document.querySelector('#results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function deleteSaved(id: string) {
    if (id.startsWith('local-')) {
      setHistory(current => {
        const next = current.filter(item => item.id !== id);
        saveBrowserHistory(next);
        return next;
      });
      if (assessment?.id === id) setAssessment(null);
      setMessage('Assessment removed.');
      return;
    }
    try {
      const response = await fetch(`/api/assessments/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Could not remove assessment.');
      setHistory(current => current.filter(item => item.id !== id));
      saveBrowserHistory(history.filter(item => item.id !== id));
      if (assessment?.id === id) setAssessment(null);
      setMessage('Assessment removed.');
    } catch {
      setMessage('Could not remove that assessment. Check that the local server is running.');
    }
  }

  function startOver() {
    setAssessment(null);
    setSelected([]);
    setVehicle('hatchback');
    setTiming('today');
    setMessage('');
    setFormError('');
  }

  function openReport() {
    if (!assessment) return;
    setReportMode(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeReport() {
    setReportMode(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (reportMode && assessment) {
    return <ReportView assessment={assessment} onBack={closeReport} />;
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="DriveCare Lab home"><span className="brand-name">DRIVECARE <b>LAB</b></span></a>
        <nav className="header-nav"><a href="#history">Recent reports</a><button className="demo-reset" type="button" onClick={startOver}>Reset demo <span aria-hidden="true">↻</span></button><span className={`service-status ${apiStatus}`}><i />{apiStatus === 'ready' ? 'SAVED REPORTS ON' : apiStatus === 'offline' ? 'OFFLINE MODE' : 'CONNECTING'}</span></nav>
      </header>

      <main id="top">
        <section className="intro">
          <p className="eyebrow">THE SMART SERVICE DESK</p>
          <h1>A clearer first step<br className="desktop-break" /> when your car feels <em>off.</em></h1>
          <p className="lede">Describe a few symptoms. DriveCare ranks sensible checks and explains the clues, so you know what to tell a qualified technician.</p>
          <p className="prototype-note"><span />A learning project, not a vehicle diagnostic tool.</p>
        </section>

        <section className="workspace" aria-label="Vehicle symptom guide">
          <div className="form-card">
            <div className="card-heading"><div><p className="eyebrow">FIRST, A FEW DETAILS</p><h2>What’s going on?</h2></div><span className="section-number">01</span></div>
            <label className="field-label" htmlFor="vehicle">What do you drive?</label>
            <select id="vehicle" value={vehicle} onChange={event => setVehicle(event.target.value as VehicleId)}>
              {vehicleOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
            <fieldset className="symptom-fieldset">
              <legend className="field-label">What have you noticed? <span>Select any that fit</span></legend>
              <div className="symptom-grid">
                {symptomOptions.map(option => (
                  <label className={`symptom ${selected.includes(option.id) ? 'checked' : ''}`} key={option.id}>
                    <input type="checkbox" checked={selected.includes(option.id)} onChange={() => toggleSymptom(option.id)} />
                    <span className="sym-icon" aria-hidden="true">{option.icon}</span>
                    <span>{option.label}</span>
                    <span className="checkmark" aria-hidden="true">✓</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="field-label" htmlFor="timing">When did you first notice it?</label>
            <select id="timing" value={timing} onChange={event => setTiming(event.target.value as TimingId)}>
              {timingOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
            {formError && <p className="form-error" role="alert">{formError}</p>}
            <button className="primary-btn" type="button" onClick={createAssessment} disabled={busy}>
              {busy ? 'Preparing your report…' : 'Generate my report'} <span aria-hidden="true">→</span>
            </button>
            <button className="reset-link" type="button" onClick={startOver}>Start a fresh report</button>
            <p className="local-note"><span>ON THIS DEVICE</span> Reports stay on this device, in SQLite or browser storage.</p>
          </div>

          <div className="results-card" id="results" aria-live="polite">
            {!assessment ? (
              <div className="empty-state">
                <div className="empty-mark"><img src="./logo.svg" alt="" /></div>
                <p className="eyebrow">A PLACE TO START</p>
                <h2>Tell us what you’ve noticed.</h2>
                <p>We’ll show which checks came to mind and why. No jargon required.</p>
              </div>
            ) : (
              <div className="result-content">
                <div className="results-heading"><div><p className="eyebrow">A FEW THINGS TO DISCUSS</p><h2>Suggested checks</h2></div><span className="section-number">02</span></div>
                <p className="result-context">{vehicleLabel(assessment.vehicle)} <span>·</span> {assessment.symptoms.map(symptomLabel).join(' · ')} <span>·</span> First noticed {timingLabel(assessment.timing).toLowerCase()}</p>
                <div className="recommendations">
                  {assessment.recommendations.map((item, index) => (
                    <article className="recommendation" key={item.id}>
                      <div className="rec-top">
                        <h3><span className="rank">0{index + 1}</span>{item.title}</h3>
                        <span className="relevance">{index === 0 ? 'START HERE' : index === 1 ? 'ALSO RELEVANT' : 'WORTH MENTIONING'}</span>
                      </div>
                      <p>{item.reason}</p>
                      <div className="meter" aria-hidden="true"><span style={{ width: `${item.score}%` }} /></div>
                    </article>
                  ))}
                </div>
                <div className={`safety-note ${safetyRelated ? 'caution' : ''}`}>
                  <span aria-hidden="true">{safetyRelated ? '!' : '↗'}</span>
                  <p>{safetyRelated
                    ? 'Brake changes or a high temperature can affect safety. If the car feels unsafe or the temperature is in the red, stop somewhere safe and contact roadside assistance or a qualified technician.'
                    : 'Make a note of when it happens and share that with a qualified technician. Arrange a check sooner if it gets worse.'}</p>
                </div>
                <p className="method-note">These are rule-based suggestions, not fault probabilities or a diagnosis.</p>
                <div className="result-actions"><button className="secondary-btn" type="button" onClick={openReport}>Open report <span aria-hidden="true">→</span></button><span>{message || `Saved ${dateLabel(assessment.createdAt)}`}</span></div>
              </div>
            )}
          </div>
        </section>

        <section className="history-section" id="history">
          <div className="section-heading"><div><p className="eyebrow">KEEP TRACK</p><h2>Recent reports</h2></div><span className="history-count">{history.length} saved</span></div>
          {history.length ? (
            <div className="history-list">
              {history.map(item => (
                <div className="history-row" key={item.id}>
                  <button className="history-open" type="button" onClick={() => openSaved(item)}>
                    <span className="history-date">{dateLabel(item.createdAt)}</span>
                    <span className="history-description">{item.symptoms.map(symptomLabel).join(' · ')}</span>
                    <span className="history-arrow" aria-hidden="true">↗</span>
                  </button>
                  <button className="delete-btn" type="button" onClick={() => deleteSaved(item.id)} aria-label="Delete saved report">×</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="history-empty">Your saved reports will appear here after you create one.</p>
          )}
        </section>

        <section className="how-section">
          <p className="eyebrow">THOUGHTFUL BY DESIGN</p>
          <div className="how-grid">
            <article><span>01</span><h3>Start with your words</h3><p>Choose what you’ve actually noticed, without needing to know the technical term.</p></article>
            <article><span>02</span><h3>See the reasoning</h3><p>Simple rules connect each symptom to checks a technician could look at.</p></article>
            <article><span>03</span><h3>Keep the human in it</h3><p>Use the summary as a starting point for a conversation with a qualified person.</p></article>
          </div>
        </section>
      </main>

      <footer><img src="./logo.svg" alt="DriveCare" /><span>A practical guide for your next workshop conversation</span></footer>
    </div>
  );
}

export default App;
