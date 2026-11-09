import express from 'express';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import {
  isSymptomId,
  isTimingId,
  isVehicleId,
  rankRecommendations,
  type Assessment,
  type Recommendation,
  type SymptomId,
  type TimingId,
  type VehicleId
} from '../src/triage';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataDirectory = resolve(projectRoot, 'data');
mkdirSync(dataDirectory, { recursive: true });

const database = new DatabaseSync(resolve(dataDirectory, 'drivecare.sqlite'));
database.exec('PRAGMA journal_mode = WAL');
database.exec(`
  CREATE TABLE IF NOT EXISTS assessments (
    id TEXT PRIMARY KEY,
    vehicle TEXT NOT NULL,
    timing TEXT NOT NULL,
    symptoms_json TEXT NOT NULL,
    recommendations_json TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`);

const insertAssessment = database.prepare(`
  INSERT INTO assessments (id, vehicle, timing, symptoms_json, recommendations_json, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));

app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));

app.get('/api/assessments', (_request, response) => {
  const rows = database.prepare(`
    SELECT id, vehicle, timing, symptoms_json AS symptoms,
           recommendations_json AS recommendations, created_at AS createdAt
    FROM assessments
    ORDER BY created_at DESC
    LIMIT 12
  `).all() as Array<{
    id: string;
    vehicle: VehicleId;
    timing: TimingId;
    symptoms: string;
    recommendations: string;
    createdAt: string;
  }>;

  const assessments: Assessment[] = rows.map(row => ({
    id: row.id,
    vehicle: row.vehicle,
    timing: row.timing,
    symptoms: JSON.parse(row.symptoms) as SymptomId[],
    recommendations: JSON.parse(row.recommendations) as Recommendation[],
    createdAt: row.createdAt
  }));
  response.json(assessments);
});

app.post('/api/assessments', (request, response) => {
  const body = request.body as Record<string, unknown> | undefined;
  if (!body || !Array.isArray(body.symptoms) || body.symptoms.length < 1 || body.symptoms.length > 6) {
    return response.status(400).json({ error: 'Choose between one and six symptoms.' });
  }
  if (!body.symptoms.every(isSymptomId) || !isVehicleId(body.vehicle) || !isTimingId(body.timing)) {
    return response.status(400).json({ error: 'Some of the submitted details were not recognised.' });
  }

  const symptoms = [...new Set(body.symptoms as SymptomId[])];
  const assessment: Assessment = {
    id: randomUUID(),
    vehicle: body.vehicle as VehicleId,
    timing: body.timing as TimingId,
    symptoms,
    recommendations: rankRecommendations(symptoms),
    createdAt: new Date().toISOString()
  };

  insertAssessment.run(
    assessment.id,
    assessment.vehicle,
    assessment.timing,
    JSON.stringify(assessment.symptoms),
    JSON.stringify(assessment.recommendations),
    assessment.createdAt
  );
  return response.status(201).json(assessment);
});

app.delete('/api/assessments/:id', (request, response) => {
  const result = database.prepare('DELETE FROM assessments WHERE id = ?').run(request.params.id);
  if (result.changes === 0) return response.status(404).json({ error: 'That report was not found.' });
  return response.status(204).end();
});

if (process.env.NODE_ENV === 'production') {
  const distDirectory = resolve(projectRoot, 'dist');
  app.use(express.static(distDirectory));
  app.use((request, response) => {
    if (request.method === 'GET' && !request.path.startsWith('/api/')) {
      return response.sendFile(resolve(distDirectory, 'index.html'));
    }
    return response.status(404).json({ error: 'Not found.' });
  });
}

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error instanceof SyntaxError) return response.status(400).json({ error: 'Please send valid JSON.' });
  console.error('DriveCare request failed.');
  return response.status(500).json({ error: 'Something went wrong while saving that report.' });
});

const port = Number(process.env.API_PORT) || 4174;
app.listen(port, '127.0.0.1', () => {
  console.log(`DriveCare API listening on http://127.0.0.1:${port}`);
});
