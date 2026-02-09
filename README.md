# Job Tracking Project

A full-stack application for tracking job applications with Google OAuth authentication, Gmail scanning, and AI-powered job entry generation.

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: React (Create React App)
- **Database**: PostgreSQL
- **Auth**: Google OAuth 2.0
- **Deployment**: Render

## Project Structure

```
JobTrackingProject/
├── backend/          # Express server
│   ├── server.js     # Main server file
│   ├── oAuth.js      # Google OAuth handlers
│   ├── db.js         # Database connection
│   ├── dbJobs.js     # Job database operations
│   └── .env          # Backend environment variables
├── frontend/         # React app
│   ├── src/
│   │   ├── App.js    # Main app component
│   │   └── ...
│   └── build/        # Production build (after npm run build)
└── .env.example      # Example environment variables
```

## Local Development Setup

### Prerequisites

- Node.js (v16+)
- PostgreSQL database
- Google OAuth credentials

### 1. Install Dependencies

```powershell
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `backend/.env` and fill in your values:

```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback
CLIENT_URL=http://localhost:3000
DATABASE_URL=postgres://user:password@host:port/database
```

### 3. Run Development Servers

**Important:** Backend and frontend use different ports to avoid conflicts.

```powershell
# Terminal 1 - Backend (port 5000)
cd backend
$env:PORT=5000
npx nodemon server.js

# Terminal 2 - Frontend (port 3000)
cd frontend
npm start
```

The frontend dev server will proxy API requests to the backend.

## Production Deployment (Render)

### Build Configuration

1. **Build Command**: `npm install && cd frontend && npm install && npm run build`
2. **Start Command**: `npm start`
3. **Root Directory**: Leave as root

### Environment Variables (Render Dashboard)

Set these in your Render service's environment variables:

```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://your-app.onrender.com/auth/google/callback
CLIENT_URL=https://your-app.onrender.com
NODE_ENV=production
DATABASE_URL=your-postgres-connection-string
SESSION_SECRET=your-random-secret-string
AI_API_KEY=your-api-key
AI_API_URL=https://api.connorrussi.com
```

### Google OAuth Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add authorized redirect URIs:
   - `http://localhost:5000/auth/google/callback` (for local dev)
   - `https://your-app.onrender.com/auth/google/callback` (for production)

## Common Issues

### Port Conflict
If you see "Port 3000 is already in use":
- Run backend on port 5000: `$env:PORT=5000; npx nodemon server.js`

### Missing pg Package
If you see "Cannot find package 'pg'":
```powershell
npm install pg
```

### Environment Variables Not Working
- Frontend vars must use `REACT_APP_` prefix (but we use relative paths instead)
- Backend vars are loaded from `backend/.env`
- Render vars are set in the dashboard

### OAuth Redirect Issues
Make sure:
1. `CLIENT_URL` matches your deployed frontend URL
2. `GOOGLE_REDIRECT_URI` matches your backend URL
3. Both URIs are added to Google OAuth console

## API Endpoints

- `GET /auth/google` - Initiate Google OAuth login
- `GET /auth/google/callback` - OAuth callback handler
- `GET /auth/me` - Get current user info
- `GET /api/jobs` - Get user's jobs
- `POST /api/addJob` - Add a new job
- `POST /api/removeJob` - Remove a job
- `GET /api/scan-emails` - Scan Gmail for job-related emails
- `POST /api/generate` - Generate job entry from email text

## Features

- 🔐 Google OAuth authentication
- 📧 Gmail integration to scan job-related emails
- 🤖 AI-powered job entry generation
- 📊 Track job applications and statuses
- 🗄️ PostgreSQL database storage
- 🎨 Clean, responsive UI

## License

Private project
