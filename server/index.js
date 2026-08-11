import cors from 'cors'
import Database from 'better-sqlite3'
import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const dataDirectory = path.join(currentDirectory, '..', 'data')
fs.mkdirSync(dataDirectory, { recursive: true })

const database = new Database(path.join(dataDirectory, 'spiderops.sqlite'))
database.pragma('journal_mode = WAL')
database.exec(`
  CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY,
    severity TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT NOT NULL,
    time TEXT NOT NULL,
    status TEXT NOT NULL,
    unit TEXT NOT NULL,
    note TEXT NOT NULL,
    left_position TEXT NOT NULL,
    top_position TEXT NOT NULL
  )
`)

const existingIncidents = database.prepare('SELECT COUNT(*) AS count FROM incidents').get()
if (existingIncidents.count === 0) {
  const insertIncident = database.prepare(`
    INSERT INTO incidents (id, severity, location, description, time, status, unit, note, left_position, top_position)
    VALUES (@id, @severity, @location, @description, @time, @status, @unit, @note, @left, @top)
  `)
  const seedIncidents = [
    { id: 'INC-2048', severity: 'Critical', location: 'Midtown - 8th Avenue', description: 'Structural anomaly reported near the elevated transit line.', time: '2 min ago', status: 'Units dispatched', unit: 'Unit 12 - Midtown', note: 'Perimeter team requested.', left: '48%', top: '28%' },
    { id: 'INC-2047', severity: 'High', location: 'Harbor District - Pier 14', description: 'Unauthorized drone activity detected over restricted airspace.', time: '11 min ago', status: 'Assessment in progress', unit: 'Aerial Unit 04', note: 'Awaiting airspace clearance.', left: '70%', top: '68%' },
    { id: 'INC-2046', severity: 'Medium', location: 'Queensboro Bridge', description: 'Traffic sensors report an obstruction in the westbound lane.', time: '24 min ago', status: 'Response unit en route', unit: 'Traffic Unit 07', note: 'Westbound lane remains restricted.', left: '35%', top: '54%' },
  ]
  const seedDatabase = database.transaction(() => seedIncidents.forEach((incident) => insertIncident.run(incident)))
  seedDatabase()
}

function toClientIncident(incident) {
  return { ...incident, position: { left: incident.left_position, top: incident.top_position } }
}

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/incidents', (_request, response) => {
  const incidents = database.prepare('SELECT * FROM incidents ORDER BY id').all().map(toClientIncident)
  response.json(incidents)
})

app.put('/api/incidents/:id', (request, response) => {
  const { status, unit, note } = request.body
  if (typeof status !== 'string' || typeof unit !== 'string' || typeof note !== 'string') {
    response.status(400).json({ error: 'Status, unit, and note must be text values.' })
    return
  }
  const result = database.prepare('UPDATE incidents SET status = ?, unit = ?, note = ? WHERE id = ?').run(status, unit, note, request.params.id)
  if (result.changes === 0) {
    response.status(404).json({ error: 'Incident not found.' })
    return
  }
  const incident = database.prepare('SELECT * FROM incidents WHERE id = ?').get(request.params.id)
  response.json(toClientIncident(incident))
})

app.listen(3001, () => console.log('SpiderOps API listening on http://localhost:3001'))
