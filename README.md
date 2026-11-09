# DriveCare

DriveCare is an independent portfolio project for an Application Development graduate. It gives drivers a clear way to describe a few vehicle symptoms and prepare for a conversation with a qualified technician.

## Technology

- React and TypeScript for the interactive interface and shared rule types.
- Vite for local development and production builds.
- Express for the JSON API.
- SQLite (`node:sqlite`) for saved assessments on the local computer.

There is no AI, API key, or third-party service in this version.

## Run it on Windows

### Quick demo — no server needed

Run `npm install` and `npm run build`, then open `dist/offline-demo.html` directly from File Explorer. This build works without `localhost`; reports are kept in the browser when storage is available. The rule-based suggestions, report generation, history, and print view work in this mode.

### Full-stack mode

Install Node.js 22.12 or newer. Double-click `start-drivecare.bat`. On first run it installs the packages; it then opens a terminal for the app servers and launches the browser. Keep the terminal open while using DriveCare. Full-stack mode stores reports in SQLite.

If you prefer a terminal, open this folder and run:

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1:4173`. Vite serves the interface; it proxies `/api` requests to the Express server on port 4174. `npm run build` creates both the production bundle and the no-server demo.

## What works

- Select vehicle type, symptoms, and when the issue began.
- Get a ranked list of suggested checks with the reason behind each one.
- Save reports in `data/drivecare.sqlite` and reopen them from Recent reports.
- Delete a saved report or print a simple overview.
- Use the recommendations without the server; saving and history require the local API.

## How the rules work

Each selected symptom contributes points to a small set of technician checks. The app sums points for matching checks, ranks them, and shows the top three. These scores are only a way to order this demo's rules. They are not fault probabilities or a diagnosis. The same TypeScript rule module is used by the browser and server.

## Interview explanation

> “I built a small full-stack service-intake app. The React and TypeScript interface collects a few structured symptoms. An Express API validates those inputs, runs a transparent rule set, and stores the result in SQLite. I kept the recommendations deterministic and explainable, added basic input validation and a print view, and made the limits clear because it is not a real diagnostic system.”

## Project layout

- `src/App.tsx` — forms, results, and saved-report history.
- `src/triage.ts` — shared symptom types and rule-based ranking.
- `server/index.ts` — Express routes and SQLite persistence.
- `vite.config.ts` — local frontend server and API proxy.
- `src/ReportView.tsx` — generated report and print view.
- `logo.svg` — original car line-art mark.
