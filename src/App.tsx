import './App.css'

type Incident = {
  id: string
  severity: 'Critical' | 'High' | 'Medium'
  location: string
  description: string
  time: string
  status: string
}

const metrics = [
  { label: 'Active Incidents', value: '12', detail: '+2 since last hour', tone: 'alert' },
  { label: 'High Priority', value: '3', detail: 'Requires attention', tone: 'critical' },
  { label: 'Units Deployed', value: '28', detail: 'Across 8 districts', tone: 'neutral' },
  { label: 'Resolved Today', value: '47', detail: '92% response target met', tone: 'success' },
]

const incidents: Incident[] = [
  { id: 'INC-2048', severity: 'Critical', location: 'Midtown · 8th Avenue', description: 'Structural anomaly reported near the elevated transit line.', time: '2 min ago', status: 'Units dispatched' },
  { id: 'INC-2047', severity: 'High', location: 'Harbor District · Pier 14', description: 'Unauthorized drone activity detected over restricted airspace.', time: '11 min ago', status: 'Assessment in progress' },
  { id: 'INC-2046', severity: 'Medium', location: 'Queensboro Bridge', description: 'Traffic sensors report an obstruction in the westbound lane.', time: '24 min ago', status: 'Response unit en route' },
]

function App() {
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
        <div className="hero-actions"><button className="primary-button" type="button">View incident map <span aria-hidden="true">→</span></button><button className="secondary-button" type="button">Generate briefing</button></div>
      </section>

      <section className="metrics" aria-label="Operations overview">
        {metrics.map((metric) => <article className={`metric-card ${metric.tone}`} key={metric.label}><p>{metric.label}</p><strong>{metric.value}</strong><span>{metric.detail}</span></article>)}
      </section>

      <section className="incidents-section" aria-labelledby="incidents-title">
        <div className="section-heading"><div><p className="eyebrow">REAL-TIME FEED</p><h2 id="incidents-title">Live Incidents</h2></div><button className="text-button" type="button">View all incidents <span aria-hidden="true">→</span></button></div>
        <div className="incident-list">
          {incidents.map((incident) => <article className="incident-card" key={incident.id}><div className={`severity-dot ${incident.severity.toLowerCase()}`} aria-hidden="true" /><div className="incident-main"><div className="incident-meta"><span className={`severity-label ${incident.severity.toLowerCase()}`}>{incident.severity}</span><span>{incident.id}</span></div><h3>{incident.location}</h3><p>{incident.description}</p></div><div className="incident-status"><time>{incident.time}</time><span>{incident.status}</span></div></article>)}
        </div>
      </section>
    </main>
  )
}

export default App
