# SpiderOps

SpiderOps is a fictional city operations dashboard built with React, TypeScript, Express, SQLite, and Google's Gemini API.

The application demonstrates how an operator-facing dashboard can combine traditional application data with structured AI assistance while keeping the AI behind a server-side API.

## Features

- Incident dashboard with severity filtering
- Tactical incident map
- Incident status, unit, and operator-note editing
- SQLite-backed incident records
- Gemini-generated operations briefing
- AI incident analysis with structured JSON output
- AI-generated response plans based on incident analysis
- Loading and error states for AI operations
- Server-side Gemini API integration
- Environment-based API key configuration

## Architecture

React + TypeScript
       |
       | HTTP requests
       v
Express API
       |
       +------ SQLite
       |
       +------ Gemini API

The React frontend does not communicate directly with Gemini.

Instead, the Express backend:

1. Receives a request from the frontend.
2. Retrieves the relevant incident data from SQLite.
3. Builds a constrained prompt using that data.
4. Sends the request to Gemini.
5. Requests structured JSON when appropriate.
6. Returns only the data required by the frontend.

This keeps the Gemini API key on the server and gives the application a central place to handle validation and errors.

## AI Workflow

SpiderOps currently has three AI-assisted workflows.

### Operations Briefing

The backend retrieves the current incident records from SQLite and asks Gemini to produce a concise operational briefing.

SQLite incident records
        |
        v
Express API
        |
        v
Gemini
        |
        v
Operations briefing
        |
        v
React UI

### Incident Analysis

An operator selects an incident and requests an analysis.

The backend retrieves the selected incident and sends only the relevant incident data to Gemini.

Gemini returns structured information:

- Priority
- Reasoning
- Recommended action
- Concerns
- Confidence

The frontend renders each field independently rather than parsing free-form AI text.

### Response Plan

A response plan can be generated after an incident has been analyzed.

The analysis is passed to the backend along with the incident data. Gemini produces:

- Objective
- Immediate actions
- Assigned unit
- Escalation trigger
- Completion criteria
- Planning note

The response plan is presented as a recommendation for an operator to review. The AI does not directly change incident status or perform operational actions.

## AI Safety and Grounding

The AI features are intentionally constrained.

Prompts instruct Gemini to:

- Use only the supplied incident information.
- Avoid inventing facts.
- Preserve the stored incident severity and status.
- Use the assigned unit from the incident rather than inventing personnel or units.
- Distinguish known information from recommendations.
- Treat escalation triggers as hypothetical conditions.
- Report when information is insufficient.

Structured JSON output is used for the analysis and response-plan workflows so the frontend receives a predictable data structure.

AI output is treated as untrusted data and is reviewed by the application rather than being treated as an authoritative source of truth.

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- CSS

### Backend

- Node.js
- Express
- SQLite via `better-sqlite3`

### AI

- Google Gemini API
- `@google/genai`

### Development

- ESLint
- Prettier

## Project Structure

SpiderOps/
├── data/
│   └── ...
├── public/
├── server/
│   └── index.js
├── src/
│   ├── App.tsx
│   └── App.css
├── .env.example
├── .prettierrc
├── eslint.config.js
├── package.json
├── tsconfig.json
└── vite.config.ts

## Getting Started

### Requirements

- Node.js
- npm
- A Gemini API key

### Installation

Clone the repository and install dependencies:

npm install

Create a `.env` file in the project root:

GEMINI_API_KEY=your_private_key

The API key should never be committed to Git.

`.env.example` is provided as a configuration template.

### Run the frontend

npm run dev

The Vite development server will start on the local development port shown in the terminal.

### Run the backend

In a second terminal:

npm run server

The Express API runs on:

http://localhost:3001

### Production build

npm run build

### Formatting

SpiderOps uses Prettier:

npm run format

## API Endpoints

### Get incidents

GET /api/incidents

Returns the incident records used by the dashboard.

### Update an incident

PUT /api/incidents/:id

Updates:

- Status
- Assigned unit
- Operator note

### Analyze an incident

POST /api/incidents/:id/analyze

Returns a structured AI analysis for the selected incident.

### Generate a response plan

POST /api/incidents/:id/response-plan

Accepts the incident analysis and returns a structured AI response plan.

### Generate an operations briefing

POST /api/briefing

Generates a briefing from the current SQLite incident records.

## Development Notes

SpiderOps is a portfolio/demo application using fictional incident data.

The application is intentionally designed around an operator-in-the-loop model: AI provides analysis and recommendations, while the operator remains responsible for reviewing and applying them.

## Future Improvements

Potential future improvements include:

- Automated API tests
- Authentication and role-based access
- More robust server-side validation
- Persistent audit logs
- Improved accessibility testing
- Production deployment configuration
