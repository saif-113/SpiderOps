import { useEffect, useState } from 'react'
import './App.css'

type Incident = { id: string; severity: 'Critical' | 'High' | 'Medium'; location: string; description: string; time: string; status: string; unit: string; note: string; position: { left: string; top: string } }
type SeverityFilter = 'All' | Incident['severity']

const metrics = [
  { label: 'Active Incidents', value: '12', detail: '+2 since last hour', tone: 'alert' },
  { label: 'High Priority', value: '3', detail: 'Requires attention', tone: 'critical' },
  { label: 'Units Deployed', value: '28', detail: 'Across 8 districts', tone: 'neutral' },
  { label: 'Resolved Today', value: '47', detail: '92% response target met', tone: 'success' },
]

const initialIncidents: Incident[] = [
  { id: 'INC-2048', severity: 'Critical', location: 'Midtown - 8th Avenue', description: 'Structural anomaly reported near the elevated transit line.', time: '2 min ago', status: 'Units dispatched', unit: 'Unit 12 - Midtown', note: 'Perimeter team requested.', position: { left: '48%', top: '28%' } },
  { id: 'INC-2047', severity: 'High', location: 'Harbor District - Pier 14', description: 'Unauthorized drone activity detected over restricted airspace.', time: '11 min ago', status: 'Assessment in progress', unit: 'Aerial Unit 04', note: 'Awaiting airspace clearance.', position: { left: '70%', top: '68%' } },
  { id: 'INC-2046', severity: 'Medium', location: 'Queensboro Bridge', description: 'Traffic sensors report an obstruction in the westbound lane.', time: '24 min ago', status: 'Response unit en route', unit: 'Traffic Unit 07', note: 'Westbound lane remains restricted.', position: { left: '35%', top: '54%' } },
]

const filters: SeverityFilter[] = ['All', 'Critical', 'High', 'Medium']

function App() {
  const [incidentRecords, setIncidentRecords] = useState(initialIncidents)
  const [selectedIncident, setSelectedIncident] = useState(initialIncidents[0])
  const [activeFilter, setActiveFilter] = useState<SeverityFilter>('All')
  const [isBriefingVisible, setIsBriefingVisible] = useState(false)
  const [briefingText, setBriefingText] = useState('')
  const [isBriefingLoading, setIsBriefingLoading] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [draftStatus, setDraftStatus] = useState(selectedIncident.status)
  const [draftUnit, setDraftUnit] = useState(selectedIncident.unit)
  const [draftNote, setDraftNote] = useState(selectedIncident.note)
  const filteredIncidents = activeFilter === 'All' ? incidentRecords : incidentRecords.filter((incident) => incident.severity === activeFilter)

  const [incidentAnalysis, setIncidentAnalysis] = useState<{
  priority: string
  why: string
  recommendedAction: string
  concerns: string
  confidence: string
} | null>(null)
const [isAnalysisLoading, setIsAnalysisLoading] = useState(false)

  useEffect(() => {
    async function loadIncidents() {
      try {
        const response = await fetch('http://localhost:3001/api/incidents')
        if (!response.ok) throw new Error('Could not load incidents')
        const loadedIncidents = await response.json() as Incident[]
        if (loadedIncidents.length > 0) {
          setIncidentRecords(loadedIncidents)
          setSelectedIncident(loadedIncidents[0])
        }
      } catch {
        console.info('Local API is unavailable; displaying the built-in demo incidents.')
      }
    }
    loadIncidents()
  }, [])

  function openEditor() { setDraftStatus(selectedIncident.status); setDraftUnit(selectedIncident.unit); setDraftNote(selectedIncident.note); setIsEditorOpen(true) }
  async function saveIncident() {
    try {
      const response = await fetch(`http://localhost:3001/api/incidents/${selectedIncident.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: draftStatus, unit: draftUnit, note: draftNote }) })
      if (!response.ok) throw new Error('Could not save incident')
      const updated = await response.json() as Incident
      setIncidentRecords((records) => records.map((incident) => incident.id === updated.id ? updated : incident))
      setSelectedIncident(updated)
      setIsEditorOpen(false)
    } catch {
      window.alert('The local API is not running. Start it with npm.cmd run server, then try again.')
    }
  }

  async function generateBriefing() {
    setIsBriefingVisible(true)
    setIsBriefingLoading(true)
    setBriefingText('')
    try {
      const response = await fetch('http://localhost:3001/api/briefing', { method: 'POST' })
      const result = await response.json() as { briefing?: string; error?: string }
      if (!response.ok || !result.briefing) throw new Error(result.error || 'Could not generate briefing')
      setBriefingText(result.briefing)
    } catch (error) {
      setBriefingText(error instanceof Error ? error.message : 'Could not generate briefing')
    } finally {
      setIsBriefingLoading(false)
    }
  }

  async function analyzeIncident() {
  setIsAnalysisLoading(true)
  setIncidentAnalysis(null)

  try {
    const response = await fetch(
      `http://localhost:3001/api/incidents/${selectedIncident.id}/analyze`,
      { method: 'POST' }
    )

    const result = await response.json() as {
      analysis?: {
        priority: string
        why: string
        recommendedAction: string
        concerns: string
        confidence: string
      }
      error?: string
    }

    if (!response.ok || !result.analysis) {
      throw new Error(result.error || 'Could not analyze incident')
    }

    setIncidentAnalysis(result.analysis)
  } catch (error) {
    window.alert(
      error instanceof Error
        ? error.message
        : 'Could not analyze incident'
    )
  } finally {
    setIsAnalysisLoading(false)
  }
}

  return <main className="app-shell">
    <nav className="topbar" aria-label="Main navigation"><a className="brand" href="#overview" aria-label="SpiderOps dashboard home"><span className="brand-mark" aria-hidden="true">*</span><span>SpiderOps</span></a><div className="nav-actions"><span className="system-status"><span aria-hidden="true" />SYSTEM ONLINE</span><button className="avatar" type="button" aria-label="Open operator profile">S</button></div></nav>
    <section className="hero" id="overview" aria-labelledby="page-title"><p className="eyebrow">OPERATIONS COMMAND - NEW YORK CITY</p><h1 id="page-title">City Operations Center</h1><p className="hero-copy">Monitor, coordinate, and resolve active incidents across the city from one secure command view.</p><div className="hero-actions"><a className="primary-button" href="#incident-map">View incident map -&gt;</a><button className="secondary-button" type="button" onClick={generateBriefing}>Generate briefing</button></div></section>
    {isBriefingVisible && <section className="briefing-panel" aria-labelledby="briefing-title"><div className="briefing-topline"><p className="eyebrow">GEMINI GENERATED BRIEFING</p><button type="button" onClick={() => setIsBriefingVisible(false)} aria-label="Close briefing">x</button></div><h2 id="briefing-title">Operations Briefing</h2><p className="briefing-summary">{isBriefingLoading ? 'Gemini is reviewing the current incident data...' : briefingText}</p><div className="briefing-actions"><div><span>Source</span><strong>Current SQLite incident records</strong></div><div><span>Generated by</span><strong>Gemini 3.6 Flash</strong></div><button className="text-button" type="button" onClick={() => setIsBriefingVisible(false)}>Dismiss briefing</button></div></section>}
    {isEditorOpen && <div className="modal-backdrop"><section className="incident-editor" role="dialog" aria-modal="true" aria-labelledby="editor-title"><div className="editor-heading"><div><p className="eyebrow">INCIDENT WORKFLOW</p><h2 id="editor-title">{selectedIncident.id}</h2></div><button type="button" onClick={() => setIsEditorOpen(false)} aria-label="Close incident editor">x</button></div><p className="editor-location">{selectedIncident.location}</p><label>Status<select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value)}><option>Units dispatched</option><option>Assessment in progress</option><option>Response unit en route</option><option>Resolved</option></select></label><label>Assigned unit<input value={draftUnit} onChange={(event) => setDraftUnit(event.target.value)} /></label><label>Operator note<textarea rows={3} value={draftNote} onChange={(event) => setDraftNote(event.target.value)} /></label><div className="editor-actions"><button className="text-button" type="button" onClick={() => setIsEditorOpen(false)}>Cancel</button><button className="primary-button" type="button" onClick={saveIncident}>Save updates</button></div></section></div>}
    <section className="metrics" aria-label="Operations overview">{metrics.map((metric) => <article className={`metric-card ${metric.tone}`} key={metric.label}><p>{metric.label}</p><strong>{metric.value}</strong><span>{metric.detail}</span></article>)}</section>
    <section className="map-section" id="incident-map" aria-labelledby="map-title"><div className="section-heading"><div><p className="eyebrow">TACTICAL OVERVIEW</p><h2 id="map-title">Incident Map</h2></div><span className="map-key"><i /> Active incident <i /> Response unit</span></div><div className="map-layout"><div className="city-map" role="group" aria-label="Illustrated city incident map"><span className="district district-one">MIDTOWN</span><span className="district district-two">EAST RIVER</span><span className="district district-three">HARBOR</span><span className="river" aria-hidden="true" />{incidentRecords.map((incident) => <button className={`map-marker ${incident.severity.toLowerCase()} ${selectedIncident.id === incident.id ? 'selected' : ''}`} style={incident.position} type="button" key={incident.id} aria-label={`Select ${incident.id}, ${incident.location}`} onClick={() => {
  setSelectedIncident(incident)
  setIncidentAnalysis(null)
}}><span>{incident.id}</span></button>)}<span className="response-unit unit-one" /><span className="response-unit unit-two" /></div><aside className="map-details" aria-live="polite"><p className="eyebrow">SELECTED INCIDENT</p><div className="detail-heading"><span className={`severity-dot ${selectedIncident.severity.toLowerCase()}`} /><span className={`severity-label ${selectedIncident.severity.toLowerCase()}`}>{selectedIncident.severity}</span><span>{selectedIncident.id}</span></div><h3>{selectedIncident.location}</h3><p>{selectedIncident.description}</p><div className="detail-status"><span>Current status</span><strong>{selectedIncident.status}</strong><span>Assigned unit</span><strong>{selectedIncident.unit}</strong></div><div className="incident-actions">
  <button
    className="primary-button"
    type="button"
    onClick={openEditor}
  >
    Open incident -&gt;
  </button>

  <button
    className="secondary-button"
    type="button"
    onClick={analyzeIncident}
    disabled={isAnalysisLoading}
  >
    {isAnalysisLoading ? 'Analyzing...' : 'Analyze incident'}
  </button>
</div> 
{incidentAnalysis && (
  <div className="incident-analysis" aria-live="polite">
    <div className="analysis-heading">
      <div>
        <p className="eyebrow">AI INCIDENT ANALYSIS</p>
        <h4>Operational assessment</h4>
      </div>
      <span className={`analysis-confidence ${incidentAnalysis.confidence.toLowerCase()}`}>
        {incidentAnalysis.confidence} CONFIDENCE
      </span>
    </div>

    <div className="analysis-priority">
      <span>Priority assessment</span>
      <strong className={`analysis-priority-${incidentAnalysis.priority.toLowerCase()}`}>
        {incidentAnalysis.priority}
      </strong>
    </div>

    <div className="analysis-item">
      <span>Why</span>
      <p>{incidentAnalysis.why}</p>
    </div>

    <div className="analysis-item">
      <span>Recommended action</span>
      <p>{incidentAnalysis.recommendedAction}</p>
    </div>

    <div className="analysis-item">
      <span>Concerns</span>
      <p>{incidentAnalysis.concerns}</p>
    </div>

    <small>AI-generated from the selected incident record.</small>
  </div>
)}
</aside></div></section>
    <section className="incidents-section" aria-labelledby="incidents-title"><div className="section-heading"><div><p className="eyebrow">REAL-TIME FEED</p><h2 id="incidents-title">Live Incidents <span className="incident-count">{filteredIncidents.length}</span></h2></div><div className="filter-bar" aria-label="Filter incidents by severity">{filters.map((filter) => <button className={activeFilter === filter ? 'active' : ''} type="button" aria-pressed={activeFilter === filter} key={filter} onClick={() => setActiveFilter(filter)}>{filter}</button>)}</div></div><div className="incident-list">{filteredIncidents.map((incident) => <article className="incident-card" key={incident.id}><div className={`severity-dot ${incident.severity.toLowerCase()}`} /><div className="incident-main"><div className="incident-meta"><span className={`severity-label ${incident.severity.toLowerCase()}`}>{incident.severity}</span><span>{incident.id}</span></div><h3>{incident.location}</h3><p>{incident.description}</p>{incident.note && <p className="operator-note">Note: {incident.note}</p>}</div><div className="incident-status"><time>{incident.time}</time><span>{incident.status}</span></div></article>)}</div></section>
  </main>
}

export default App
