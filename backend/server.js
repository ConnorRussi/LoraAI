import dotenv from 'dotenv';
dotenv.config();
// require('dotenv').config(); // load .env into process.env (must run before using process.env)
// const express = require('express');
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// const cors = require('cors');
import cors from 'cors';
import { google } from 'googleapis';

//const { OAuth2Client } = require('google-auth-library');
// const session = require('express-session');
import session from 'express-session';
// const oAuth = require('./oAuth.js');
import { redirectToGoogle, googleCallback } from './oAuth.js';

const MAX_EMAILS_TO_SCAN = 300;
// Check for required env vars
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
  console.error('Missing required Google OAuth env vars. Ensure backend/.env contains GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI');
  process.exit(1);
}

const app = express();
const AIURL = process.env.AI_API_URL;

// Trust the proxy (Render/Heroku/etc) so secure cookies work
app.set('trust proxy', 1);

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000', // Allow configuring client URL
  credentials: true
}));
app.use(express.json());


// session middleware
// NOTE: We are using the default MemoryStore for this portfolio demo.
// For a large-scale production app, you would use a dedicated store like 'connect-redis'.
app.use(session({
  name: 'sid',
  secret: process.env.SESSION_SECRET || 'change_this_in_production_' + Date.now(),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,                 // Prevents client-side JS from reading the cookie
    secure: process.env.NODE_ENV === 'production', // true = only send over HTTPS (Required for Render)
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // Enhanced CSRF protection for production
    maxAge: 24 * 60 * 60 * 1000     // 1 day
  }
}));


// Serve static files from the React app
const buildPath = path.join(__dirname, '..', 'frontend', 'build');
app.use(express.static(buildPath));

// Minimal Google OAuth endpoints
app.get("/auth/google", redirectToGoogle);
app.get("/auth/google/callback", googleCallback);

app.get('/auth/me', (req, res) => {
  console.log('Session ID:', req.sessionID);
  console.log('Session user:', req.session.user ? `${req.session.user.name} (${req.session.user.googleId})` : 'Not logged in');
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});


//**************TODO AI interaction LINK with microservice
app.get('/api/ping', async (req, res) => {
  try {
    const response = await fetch(`${AIURL}/health`);
    const data = await response.json();
    console.log('Python /health response:', data); // This prints the response
    console.log('Python /health status:', data.status);
    res.json({ message: 'pong', pythonHealth: data });
  } catch (err) {
    console.error('Error calling Python /health:', err);
    res.status(500).json({ error: 'Failed to reach Python service' });
  }
});



app.post('/api/generate', async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'Missing or invalid prompt' });
  }
  console.log("calling AI ");
  try {
    // askGenAI should be async and return the model text (or structured response)
    const response = await fetch(`${AIURL}/generate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        "X-API-KEY": process.env.AI_API_KEY
       },
      body: JSON.stringify({ email: prompt,
        max_new_tokens: 128,
        temperature: 0.0
       })
    })
    const data = await response.json();
    let output = data.result || '';
    if (Array.isArray(output)) {
      output = output[0]; // Take the first job object
    }
    console.log('Generated output:', output);
    return res.json({ output });
  } 
  catch (error) {
    console.error('Error generating response:', error?.message || error);
    // If the underlying library returned an HTTP response, include limited details
    if (error?.response && error.response.data) {
      console.error('Provider response data:', error.response.data);
    }
    return res.status(500).json({ error: 'Error generating response' });
  }
});






//Job tracking
import { addJob, readJobs, removeJob } from './fileSaving.js';
import { findOrCreateUser, getJobsForUser, saveJobForUser, updateJobForUser, removeJobForUser } from './dbJobs.js';

app.post('/api/addJob', (req, res) => {

  const { job } = req.body || {};
  if (!job || typeof job !== 'object') {
    return res.status(400).json({ error: 'Missing or invalid job object' });
  }

  // Map job fields for DB
  function mapJobFields(job) {
    return {
      googleid: job.googleid,
      job_title: job.job || job.job_title || '',
      company: job.company || '',
      status: job.status || '',
      application_date: job.application_date || null,
      job_url: job.job_url || '',
      notes: job.notes || ''
    };
  }

  if (req.session.user) {
    // Save job to DB
    const dbJob = mapJobFields({ ...job, googleid: req.session.user.googleId });
    saveJobForUser(dbJob)
      .then(() => res.json({ message: 'Job added successfully' }))
      .catch(error => {
        console.error('Error adding job to DB:', error?.message || error);
        res.status(500).json({ error: 'Error adding job to DB' });
      });
  } else {
    // Save job locally
    try {
      addJob(job);
      return res.json({ message: 'Job added successfully' });
    } catch (error) {
      console.error('Error adding job:', error?.message || error);
      return res.status(500).json({ error: 'Error adding job' });
    }
  }
});

app.get('/api/jobs', (req, res) => {
  console.log('Received request for jobs');
  console.log('Session ID:', req.sessionID);
  console.log('Session user:', req.session.user ? `${req.session.user.name} (${req.session.user.googleId})` : 'Not logged in');
  if (req.session.user) {
    // Logged-in: pull jobs from DB
    const { googleId } = req.session.user;
    getJobsForUser(googleId)
      .then(jobs => {
        console.log(`Found ${jobs.length} jobs for user ${googleId}`);
        res.json({ jobs });
      })
      .catch(error => {
        console.error('Error reading jobs from DB:', error?.message || error);
        res.status(500).json({ error: 'Error reading jobs from DB' });
      });
  } else {
    // Not logged-in: use local cache
    try {
      const jobs = readJobs();
      return res.json({ jobs });
    } catch (error) {
      console.error('Error reading jobs:', error?.message || error);
      return res.status(500).json({ error: 'Error reading jobs' });
    }
  }
});

app.post('/api/removeJob', async (req, res) => {
  const { index } = req.body || {};
  if (typeof index !== 'number' || index < 0) {
    return res.status(400).json({ error: 'Missing or invalid index' });
  }
  
  if (req.session.user) {
    // Remove job from DB
    const { googleId } = req.session.user;
    try {
      const success = await removeJobForUser(googleId, index);
      if (success) {
        return res.json({ message: `Job at index ${index} removed successfully` });
      } else {
        return res.status(404).json({ error: 'Job not found' });
      }
    } catch (error) {
      console.error('Error removing job from DB:', error?.message || error);
      return res.status(500).json({ error: 'Error removing job from DB' });
    }
  } else {
    // Remove job locally
    try {
      await removeJob(index);
      return res.json({ message: `Job at index ${index} removed successfully` });
    } catch (error) {
      console.error('Error removing job:', error?.message || error);
      return res.status(500).json({ error: 'Error removing job' });
    }
  }
});

// Gmail API Endpoint
app.get('/api/scan-emails', async (req, res) => {
  if (!req.session.tokens) {
    return res.status(401).json({ error: 'Not authenticated with Google' });
  }

  try {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    auth.setCredentials(req.session.tokens);

    const gmail = google.gmail({ version: 'v1', auth });

    // Handle date filter (expecting MM/DD/YYYY from frontend)
    let dateString = '';
    
    if (req.query.since) {
      const parts = req.query.since.split('/');
      if (parts.length === 3) {
        // Convert MM/DD/YYYY -> YYYY/MM/DD for Gmail API
        dateString = `${parts[2]}/${parts[0]}/${parts[1]}`;
      }
    }

    // Default to 7 days ago if no valid date provided
    if (!dateString) {
      const date = new Date();
      date.setDate(date.getDate() - 7);
      dateString = date.toISOString().split('T')[0].replace(/-/g, '/');
    }
    
    console.log(`Scanning emails after ${dateString}...`);

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: `category:primary label:INBOX after:${dateString}`,
      maxResults: MAX_EMAILS_TO_SCAN    });

    const messages = response.data.messages || [];
    const emails = [];

    // Fetch details for each message
    for (const msg of messages) {
      const details = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'full' // Get headers and snippet
      });
      
      const payload = details.data.payload;
      const headers = payload.headers;
      const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
      const from = headers.find(h => h.name === 'From')?.value || '(Unknown)';
      const dateHeader = headers.find(h => h.name === 'Date')?.value;
      
      emails.push({
        id: msg.id,
        subject,
        from,
        date: dateHeader,
        snippet: details.data.snippet
      });
    }

    res.json({ count: emails.length, emails });

  } catch (error) {
    console.error('Gmail API Error:', error);
    // If token is expired, we might get a 401 here.
    if (error.code === 401) {
       return res.status(401).json({ error: 'Token expired or invalid', details: error.message });
    }
    res.status(500).json({ error: 'Failed to fetch emails', details: error.message });
  }
});

// SPA catchall must come last: serve React index for non-API/non-auth routes
app.get(/^(?!\/(api|auth)).*/, (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// Default dev port set to 5000 to avoid conflict with CRA (which uses 3000)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});