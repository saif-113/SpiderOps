import { useState } from 'react'
import './App.css'

type Incident = {
  id: string
  severity: 'Critical' | 'High' | 'Medium'
  location: string
  description: string
  time: string
  status: string
  position: { left: string; top: string }
}

type SeverityFilter = 'All' | Incident['severity']

const metrics = [
  { label: 'Active Incidents', value: '12', detail: '+2 since last hour', tone: 'alert' },
  { label: 'High Priority', value: '3', detail: 'Requires attention', tone: 'critical' },
  { label: 'Units Deployed', value: '28', detail: 'Across 8 districts', tone: 'neutral' },
  { label: 'Resolved Today', value: '47', detail: '92% response target met', tone: 'success' },
]

const incidents: Incident[] = [
  { id: 'INC-2048', severity: 'Critical', location: 'Midtown · 8th Avenue', description: 'Structural anomaly reported near the elevated transit line.', time: '2 min ago', status: 'Units dispatched', position: { left: '48%', top: '28%' } },
  { id: 'INC-2047', severity: 'High', location: 'Harbor District · Pier 14', description: 'Unauthorized drone activity detected over restricted airspace.', time: '11 min ago', status: 'Assessment in progress', position: { left: '70%', top: '68%' } },
  { id: 'INC-2046', severity: 'Medium', location: 'Queensboro Bridge', description: 'Traffic sensors report an obstruction in the westbound lane.', time: '24 min ago', status: 'Response unit en route', position: { left: '35%', top: '54%' } },
]

const filters: SeverityFilter[] = ['All', 'Critical', 'High', 'Medium']

function App() {
  const [selectedIncident, setSelectedIncident] = useState(incidents[0])
  const [activeFilter, setActiveFilter] = useState<SeverityFilter>('All')
  const [isBriefingVisible, setIsBriefingVisible] = useState(false)
  const filteredIncidents = activeFilter === 'All' ? incidents : incidents.filter((incident) => incident.severity === activeFilter)

  return (
    <main className="app-shell">
      <nav className="topbar" aria-label="Main navigation">
        <a className="brand" href="#overview" aria-label="SpiderOps dashboard home"><span className="brand-mark" aria-hidden="true">✦</span><span>SpiderOps</span></a>
        <div className="nav-actions"><span className="system-status"><span aria-hidden="true" />SYSTEM ONLINE</span><button className="avatar" type="button" aria-label="Open operator profile">S</button></div>
      </nav>

      <section className="hero" id="overview" aria-labelledby="page-title">
        <p className="eyebrow">OPERATIONS COMMAND · NEW YORK CITY</p>
        <h1 id="page-title">City Operations Center</h1>
        <p className="hero-copy">Monitor, coordinate, and resolve active incidents across the city from one secure command view.</p>
        <div className="hero-actions"><a className="primary-button" href="#incident-map">View incident map <span aria-hidden="true">→</span></a><button className="secondary-button" type="button" onClick={() => setIsBriefingVisible(true)}>Generate briefing</button></div>
      </section>

      {isBriefingVisible && <section className="briefing-panel" aria-labelledby="briefing-title"><div className="briefing-topline"><p className="eyebrow">BRIEFING GENERATED · LOCAL PROTOTYPE</p><button type="button" onClick={() => setIsBriefingVisible(false)} aria-label="Close briefing">×</button></div><h2 id="briefing-title">Operations Briefing</h2><p className="briefing-summary">Three incidents require active coordination. Prioritize the structural anomaly in Midtown, where units are already dispatched. Continue assessing the unauthorized drone activity at Pier 14 and keep the Queensboro Bridge response unit on route.</p><div className="briefing-actions"><div><span>Recommended priority</span><strong>Secure Midtown perimeter</strong></div><div><span>Next review</span><strong>In 10 minutes</strong></div><button className="text-button" type="button" onClick={() => setIsBriefingVisible(false)}>Dismiss briefing</button></div></section>}

      <section className="metrics" aria-label="Operations overview">
        {metrics.map((metric) => <article className={`metric-card ${metric.tone}`} key={metric.label}><p>{metric.label}</p><strong>{metric.value}</strong><span>{metric.detail}</span></article>)}
      </section>

      <section className="map-section" id="incident-map" aria-labelledby="map-title">
        <div className="section-heading"><div><p className="eyebrow">TACTICAL OVERVIEW</p><h2 id="map-title">Incident Map</h2></div><span className="map-key"><i /> Active incident <i /> Response unit</span></div>
        <div className="map-layout">
          <div className="city-map" role="group" aria-label="Illustrated city incident map">
            <span className="district district-one">MIDTOWN</span><span className="district district-two">EAST RIVER</span><span className="district district-three">HARBOR</span>
            <span className="river" aria-hidden="true" />
            {incidents.map((incident) => <button className={`map-marker ${incident.severity.toLowerCase()} ${selectedIncident.id === incident.id ? 'selected' : ''}`} style={incident.position} type="button" key={incident.id} aria-label={`Select ${incident.id}, ${incident.location}`} onClick={() => setSelectedIncident(incident)}><span>{incident.id}</span></button>)}
            <span className="response-unit unit-one" title="Response unit" aria-label="Response unit" /><span className="response-unit unit-two" title="Response unit" aria-label="Response unit" />
          </div>
          <aside className="map-details" aria-live="polite"><p className="eyebrow">SELECTED INCIDENT</p><div className="detail-heading"><span className={`severity-dot ${selectedIncident.severity.toLowerCase()}`} aria-hidden="true" /><span className={`severity-label ${selectedIncident.severity.toLowerCase()}`}>{selectedIncident.severity}</span><span>{selectedIncident.id}</span></div><h3>{selectedIncident.location}</h3><p>{selectedIncident.description}</p><div className="detail-status"><span>Current status</span><strong>{selectedIncident.status}</strong></div><button className="primary-button" type="button">Open incident <span aria-hidden="true">→</span></button></aside>
        </div>
      </section>

      <section className="incidents-section" aria-labelledby="incidents-title">
        <div className="section-heading"><div><p className="eyebrow">REAL-TIME FEED</p><h2 id="incidents-title">Live Incidents <span className="incident-count">{filteredIncidents.length}</span></h2></div><div className="filter-bar" aria-label="Filter incidents by severity">{filters.map((filter) => <button className={activeFilter === filter ? 'active' : ''} type="button" aria-pressed={activeFilter === filter} key={filter} onClick={() => setActiveFilter(filter)}>{filter}</button>)}</div></div>
        <div className="incident-list">
          {filteredIncidents.map((incident) => <article className="incident-card" key={incident.id}><div className={`severity-dot ${incident.severity.toLowerCase()}`} aria-hidden="true" /><div className="incident-main"><div className="incident-meta"><span className={`severity-label ${incident.severity.toLowerCase()}`}>{incident.severity}</span><span>{incident.id}</span></div><h3>{incident.location}</h3><p>{incident.description}</p></div><div className="incident-status"><time>{incident.time}</time><span>{incident.status}</span></div></article>)}
        </div>
      </section>
    </main>
  )
}

export default App
