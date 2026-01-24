import dotenv from 'dotenv';
dotenv.config();
// require('dotenv').config(); // load .env into process.env (must run before using process.env)
// const express = require('express');
import express from 'express';
// const path = require('path');
import path from 'path';
// const cors = require('cors');
import cors from 'cors';

//const { OAuth2Client } = require('google-auth-library');
// const session = require('express-session');
import session from 'express-session';
// const oAuth = require('./oAuth.js');
import * as oAuth from './oAuth.js';

// Check for required env vars
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
  console.error('Missing required Google OAuth env vars. Ensure backend/.env contains GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI');
  process.exit(1);
}

const app = express();
app.use(cors({
  origin: 'http://localhost:3000', // React dev server
  credentials: true
}));
app.use(express.json());


// session middleware (development: in-memory store; use redis store in prod)
app.use(session({
  name: 'sid',
  secret: process.env.SESSION_SECRET || 'change_this_in_prod',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // true when using https in prod
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));


// Home route
app.get("/", (req, res) => {
  res.send("Google OAuth demo running");
});

app.get("/auth/google", (req, res) => {
 oAuth.redirectToAppWithLoginSuccess(res);
});

app.get("/auth/google/callback", async (req, res) => {
  oAuth.googleAuthCallbackHandler(req, res);
});


app.get('/auth/me', (req, res) => {
 oAuth.authMeHandler(req, res);
});


//**************TODO AI interaction LINK with microservice
app.get('/api/ping', async (req, res) => {
  try {
    const response = await fetch('https://colony-intl-kyle-diameter.trycloudflare.com/health');
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
    const response = await fetch('https://colony-intl-kyle-diameter.trycloudflare.com/generate', {
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

app.post('/api/addJob', (req, res) => {

  const { job } = req.body || {};
  if (!job || typeof job !== 'object') {
    return res.status(400).json({ error: 'Missing or invalid job object' });
  }

  try {
    addJob(job);
    return res.json({ message: 'Job added successfully' });
  } catch (error) {
    console.error('Error adding job:', error?.message || error);
    return res.status(500).json({ error: 'Error adding job' });
  }
});

app.get('/api/jobs', (req, res) => {
  console.log('Received request for jobs');
  try {
    const jobs = readJobs();
    return res.json({ jobs });
  } catch (error) {
    console.error('Error reading jobs:', error?.message || error);
    return res.status(500).json({ error: 'Error reading jobs' });
  }
});

app.post('/api/removeJob', async (req, res) => {
  const { index } = req.body || {};
  if (typeof index !== 'number' || index < 0) {
    return res.status(400).json({ error: 'Missing or invalid index' });
  }
  try {
    await removeJob(index);
    return res.json({ message: `Job at index ${index} removed successfully` });
  } catch (error) {
    console.error('Error removing job:', error?.message || error);
    return res.status(500).json({ error: 'Error removing job' });
  }
});

// Default dev port set to 5000 to avoid conflict with CRA (which uses 3000)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});