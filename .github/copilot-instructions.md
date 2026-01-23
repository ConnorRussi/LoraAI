<!-- .github/copilot-instructions.md
     Purpose: concise, repo-specific guidance for AI coding agents
-->

# Quick orientation — JobTrackingProject

- What this repo is: a small demo with a Node/Express backend that implements Google OAuth and a Create-React-App frontend in `frontend/`.
- Key runtime link: backend serves API routes and may also serve the React production build from `../frontend/build` when present.

## Big picture (files you must read first)
- `backend/server.js` — Express app, OAuth flow, reads env vars via `dotenv`, listens on `process.env.PORT || 3000`, serves API routes and the React `build/` folder when it exists. Important lines:
  - `const buildPath = path.join(__dirname, '..', 'frontend', 'build');`
  - `app.use(express.static(buildPath));` and `app.get('*', ...)` (SPA fallback)
- `frontend/package.json` and `frontend/README.md` — CRA app, dev server and build scripts.
- `.env` (root) — environment variables used by backend (e.g. `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`). See `implementation oauth.md` for install notes.

## Developer workflows (commands and gotchas)
- Install deps:
  - Backend: open `c:\JobTrackingProject\backend` then `npm install` (or `npm ci` if lockfile present).
  - Frontend: open `c:\JobTrackingProject\frontend` then `npm install`.

- Run backend (development):
  - Use nodemon (installed as a dev tool in this workspace):
    - PowerShell: `Set-Location C:\JobTrackingProject\backend; npx nodemon server.js`
  - Or run directly: `node server.js`

- Run frontend (development CRA):
  - PowerShell: `Set-Location C:\JobTrackingProject\frontend; npm start`

- IMPORTANT port conflict (observed):
  - `backend/server.js` defaults to port 3000. CRA dev server also defaults to 3000. You will get a start failure if both use the same port.
  - Resolution (pick one):
    - Start backend on a different port: PowerShell example:
      `Set-Location C:\JobTrackingProject\backend; $env:PORT=5000; npx nodemon server.js`
    - Or set CRA to another port before `npm start` (less common). Prefer moving backend to 5000 in dev.

- Test the API quickly (PowerShell):
  - `Invoke-RestMethod 'http://localhost:5000/api/hello'` (or adjust the port you set).

- Build & production flow (single-deploy option):
  1. `cd frontend && npm run build` — creates `frontend/build`
  2. Run backend (which will detect `../frontend/build`) — backend will serve static assets and return `index.html` for unknown routes so client-side routing works.

## Project-specific conventions and patterns
- SPA fallback: server uses `app.get('*', ...)` to return `index.html` for non-API routes. This is required for React Router `BrowserRouter` deep-links.
- Env usage: backend relies on `.env` for OAuth secrets; the server uses `dotenv` in `backend/server.js`.
- OAuth flow: implemented in `backend/server.js` with `google-auth-library` (look at `/auth/google` and `/auth/google/callback`). Treat any changes carefully — tokens and redirect URIs must match Google Console settings.

## Integration points & external deps
- Google OAuth: `google-auth-library` (backend). Required env vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.
- `express`, `cors`, `dotenv` used in backend.
- Frontend uses Create React App (`react-scripts`) and standard dev scripts.

## Notable repository oddities (what an agent should watch for)
- `frontend/package.json` currently lists some backend libraries (`express`, `google-auth-library`, `dotenv`). That looks like leftover or misplaced dependencies — do not assume backend-only packages are needed in the client build. If you change packages, verify where they are installed.
- `backend/server.js` in this workspace contains triple-backtick wrappers in some earlier file dumps; when editing, ensure the file contains plain JS (no surrounding Markdown fences).

## Suggested safe edits an AI can do autonomously
- Add a clear `README.md` at repo root with the start/build steps (or update `frontend/README.md` with combined instructions). Include the port-resolution tip.
- Add `.env.example` listing required env vars (no secrets). Example keys: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `PORT`.
- Provide a dev helper script in `backend/package.json`:`"dev":"cross-env PORT=5000 nodemon server.js"` (or update docs to suggest `$env:PORT=5000; npx nodemon server.js` for PowerShell).

## What to avoid changing without review
- OAuth redirect flow and client IDs — changing redirect URIs, scopes, or token handling can break authentication. Coordinate with a human if editing this area.
- Changing default ports or the SPA fallback without updating README and deployment configuration.

---
If this looks correct, I will add a short root README and `.env.example` next. Tell me if you want the backend default dev port changed to `5000` (I can patch `backend/server.js`) or if you'd prefer documentation-only changes.
