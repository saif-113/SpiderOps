import 'dotenv/config'
import { GoogleGenAI } from '@google/genai'
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
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null
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
app.post('/api/incidents/:id/analyze', async (request, response) => {
  if (!ai) {
    response.status(503).json({ error: 'Gemini is not configured on the server.' })
    return
  }

  const incident = database.prepare(
    'SELECT id, severity, location, description, status, unit, note FROM incidents WHERE id = ?'
  ).get(request.params.id)

  if (!incident) {
    response.status(404).json({ error: 'Incident not found.' })
    return
  }

  const prompt = `You are an operations analyst for a fictional city incident dashboard.

Analyze the incident below using ONLY the information provided.

Rules:
- Do not invent facts.
- Do not change the stored severity.
- Clearly distinguish known information from recommendations.
- If the information is insufficient, say so.
- Keep each response concise.

Incident data:
${JSON.stringify(incident)}`

  try {
    const result = await ai.interactions.create({
      model: 'gemini-3.6-flash',
      input: prompt,
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: {
          type: 'object',
          properties: {
            priority: {
              type: 'string',
              enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
            },
            why: {
              type: 'string',
            },
            recommendedAction: {
              type: 'string',
            },
            concerns: {
              type: 'string',
            },
            confidence: {
              type: 'string',
              enum: ['HIGH', 'MEDIUM', 'LOW'],
            },
          },
          required: [
            'priority',
            'why',
            'recommendedAction',
            'concerns',
            'confidence',
          ],
        },
      },
    })

    const analysis = JSON.parse(result.output_text)
    response.json({ analysis })
  } catch (error) {
    console.error(
      'Gemini incident analysis failed:',
      error instanceof Error ? error.message : 'Unknown error'
    )
    response.status(502).json({
      error: 'Gemini could not analyze the incident. Please try again.',
    })
  }
})
app.post('/api/incidents/:id/response-plan', async (request, response) => {
  if (!ai) {
    response.status(503).json({ error: 'Gemini is not configured on the server.' })
    return
  }

  const incident = database.prepare(
    'SELECT id, severity, location, description, status, unit, note FROM incidents WHERE id = ?'
  ).get(request.params.id)

  if (!incident) {
    response.status(404).json({ error: 'Incident not found.' })
    return
  }

  const { analysis } = request.body

  if (!analysis || typeof analysis !== 'object') {
    response.status(400).json({ error: 'Incident analysis is required.' })
    return
  }

  const prompt = `You are an operations planning assistant for a fictional city incident dashboard.

Create a concise response plan using ONLY the supplied incident data and incident analysis.

Rules:
- Do not invent facts, personnel, units, resources, locations, sensor data, or external events.
- Do not claim that a recommended action has already happened.
- Do not change the incident severity or status.
- Use the assigned unit from the incident data. Do not invent another unit.
- Clearly distinguish recommendations from known facts.
- Every factual statement must be directly supported by the incident data or incident analysis.
- Do not introduce new causes, damage, risks, events, or conditions that are not explicitly stated in the supplied information.
- Escalation triggers must be hypothetical conditions, not claims that those conditions currently exist.
- immediateActions must contain only actionable steps. Do not put explanations, warnings, uncertainty, or notes in this list.
- Put any important uncertainty or missing information in planningNote.
- If information is insufficient for a specific recommendation, say so.
- Keep the plan practical and concise.

Incident data:
${JSON.stringify(incident)}

Incident analysis:
${JSON.stringify(analysis)}`

  try {
    const result = await ai.interactions.create({
      model: 'gemini-3.6-flash',
      input: prompt,
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: {
          type: 'object',
          properties: {
            objective: {
              type: 'string',
            },
            immediateActions: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            assignedUnit: {
              type: 'string',
            },
            escalationTrigger: {
              type: 'string',
            },
            completionCriteria: {
              type: 'string',
            },
            planningNote: {
             type: 'string',
            },
          },
          required: [
            'objective',
            'immediateActions',
            'assignedUnit',
            'escalationTrigger',
            'completionCriteria',
            'planningNote',
          ],
        },
      },
    })

    const responsePlan = JSON.parse(result.output_text)
    response.json({ responsePlan })
  } catch (error) {
    console.error(
      'Gemini response plan failed:',
      error instanceof Error ? error.message : 'Unknown error'
    )
    response.status(502).json({
      error: 'Gemini could not generate a response plan. Please try again.',
    })
  }
})
app.post('/api/briefing', async (_request, response) => {
  if (!ai) {
    response.status(503).json({ error: 'Gemini is not configured on the server.' })
    return
  }

  const incidents = database.prepare('SELECT id, severity, location, description, status, unit, note FROM incidents ORDER BY id').all()
  const prompt = `You are an operations assistant for a fictional city incident dashboard. Create a concise briefing based only on this incident data. State the highest priority, recommended next action, and any resolved items. Use no more than 110 words. Do not invent facts.\n\n${JSON.stringify(incidents)}`

  try {
  const result = await ai.interactions.create({
    model: 'gemini-3.6-flash',
    input: prompt,
  })
  response.json({ briefing: result.output_text?.trim() || 'No briefing was generated.' })
  } catch (error) {
  console.error('Gemini briefing request failed:', error instanceof Error ? error.message : 'Unknown error')
  response.status(502).json({ error: 'Gemini could not generate a briefing. Please try again.' })
  }
})

app.listen(3001, () => console.log('SpiderOps API listening on http://localhost:3001'))
