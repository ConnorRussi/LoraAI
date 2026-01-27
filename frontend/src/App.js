import React, { useState, useEffect, useRef } from 'react';
import './App.css';

import { JobsTable } from './JobsTable';
import { getFartherJob, jobExists } from './jobUtils.js';

function App() {
  const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
  const [user, setUser] = useState(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [genResult, setGenResult] = useState(null);
  const [emails, setEmails] = useState([]);
  const [emailStatus, setEmailStatus] = useState('');
  const [scanLoading, setScanLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const jobsTableRef = useRef(); // <-- Add this line

  

  //login logic
  function LoginHandler() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('login') !== 'success') {
      return;
    }
    // Fetch user info from the backend
    fetch( '/auth/me', {
      credentials: 'include' // include cookies
    })
      .then(response => response.json())
      .then(data => {
        setUser(data.user);
        setSuccessModalOpen(true);
      })
      .catch(err => {
        console.error('Error fetching user info:', err);
      });
      // Clean up the URL
        setScanLoading(true);
      const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      window.history.replaceState(null, '', newUrl);
  }
  useEffect(() => {
    // Check if redirected after login
    LoginHandler();
  }, []);





  //job management logic
  function addJob(job) {
    // Check if company name contains variations of "n/a"
    if (job && job.company && /^(n[./]?a\.?|not applicable|not available)$/i.test(job.company.trim())) {
      console.log('Skipping job as company is listed as N/A:', job);
      return;
    }

    //check if similar job exists already
    let similarJob = jobExists(jobsTableRef.current.getJobs(), job);
    console.log('Similar job check result:', similarJob);
    if (similarJob !== null) {
      console.log('Similar job already exists, evaluating which is farther between: ', similarJob, job);
      let fartherJob = getFartherJob(similarJob, job);
      console.log('Farther job is: ', fartherJob);
      //remove job if we are about to add a farther one
      if (fartherJob === job) {
        console.log("removing similar job as new job is farther");
        //new job is farther, so remove the existing one and add the new one
        let index = jobsTableRef.current.getJobs().indexOf(similarJob);
        fetch('/api/removeJob', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ index: index })
        })
        .then(response => response.json())
        .then(data => {
          console.log('Removed similar job at index ', index, ': ', data);
          jobsTableRef.current.updateTable();
        })
        .catch(err => {
          console.error('Error removing similar job:', err);
        });
      }
      else {
        console.log("not adding job as existing one is farther or equal");
        return; //existing job is farther or equal, so do not add the new one
      }
    }
    // Add each answer to the CSV
    try {
      fetch('/api/addJob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job: job })
      })
      .then(response => response.json())
      .then(data => {
        console.log('Add job response:', data);
        jobsTableRef.current.updateTable();

      })
      .catch(err => {
        console.error('Error adding job:', err);
      });
    } catch (err) {
      console.error('Error in addJob function:', err);
    }
    
    
  }

  async function removeJob(index) {
    const jobIndex = typeof index === 'number' ? index : jobsTableRef.current?.getSelectedJob();
    if (jobIndex === null || jobIndex === undefined) {
      alert('No job selected for removal.');
      return;
    }
    try {
      fetch('/api/removeJob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index: jobIndex })
      })
      .then(response => response.json())
      .then(data => {
        console.log('Remove job response:', data);
        if (jobsTableRef.current) {
          jobsTableRef.current.updateTable();
        }
      })
      .catch(err => {
        console.error('Error removing job:', err);
      });
    } catch (err) {
      console.error('Error in removeJob function:', err);
    }
  }



  //SEND EMAIL TO API AND PROCESS RESPONSE
  async function submitEmail(promptText) {
    console.log("Submitting prompt:", promptText);
    setAiLoading(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText })
      });
      const data = await response.json();

      // Expecting a single job object in data.output
      let job = data.output;
      if (typeof job === 'string') {
        job = JSON.parse(job);
      }

      setGenResult(JSON.stringify(job, null, 2)); // Show nicely formatted single job
      // Optionally, addJob(job); if you want to save it
      console.log('Adding generated job:', job);
      addJob(job);
    } catch (err) {
      setGenResult('Error: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  }

  function pingServer() {
    fetch('/api/ping', { method: 'GET' })
      .then(response => response.json())
      .then(data => {
        alert('Server response: ' + data.message);
      })
      .catch(err => {
        console.error('Error pinging server:', err);
        alert('Error pinging server: ' + err.message);
      });
  }

  // Example call to scan emails
  function scanEmails() {
    const dateInput = window.prompt("Enter start date (MM/DD/YYYY):", "01/01/2026");
    if (!dateInput) return;

    console.log('Scanning emails form:', dateInput);
    setEmailStatus('Scanning...');
    setScanLoading(true);
    setEmails([]);
    fetch(`/api/scan-emails?since=${encodeURIComponent(dateInput)}`)
      .then(response => {
        if (response.status === 401) {
          alert('Please sign in with Google first!');
          return null;
        }
        return response.json();
      })
      .then(data => {
        if (!data) return;
        if (data.error) {
          console.error('Scan error:', data.error);
          alert('Error: ' + data.error);
          setEmailStatus('');
        } else {
          console.log('Emails found:', data.emails);
          setEmailStatus(`Found ${data.count} email(s)`);
          setEmails(Array.isArray(data.emails) ? data.emails : []);
          for(let i = 0; i < data.count; i++) {
            const email = data.emails[i];
            // Format the email data to give the model better context
            const formattedPrompt = `From: ${email.from}\nSubject: ${email.subject}\nDate: ${email.date}\n\n${email.snippet}`;
            submitEmail(formattedPrompt);
          }
        }
      })
      .catch(err => {
        console.error('Error scanning emails:', err);
        setEmailStatus('');
      })
      .finally(() => {
        setScanLoading(false);
      });
      
  }

  const clearJobs = async () => {
    const currentJobs = jobsTableRef.current?.getJobs?.() || [];
    if (!currentJobs.length) {
      setEmailStatus('No jobs to clear');
      return;
    }
    setEmailStatus('Clearing jobs...');
    // Remove from the end to keep indices valid
    for (let i = currentJobs.length - 1; i >= 0; i -= 1) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await fetch('/api/removeJob', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ index: i })
        });
      } catch (err) {
        console.error('Error clearing job at index', i, err);
      }
    }
    jobsTableRef.current?.updateTable();
    setEmailStatus('All jobs cleared');
  };


  return (
    <div className="app-shell">
      {successModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setSuccessModalOpen(false)}>&times;</span>
            <h2>Login Successful</h2>
            {user && (
              <div className="user-meta">
                <img src={user.picture} alt="User Profile" />
                <div>
                  <p className="label">Name</p>
                  <p>{user.name}</p>
                  <p className="label">Email</p>
                  <p>{user.email}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <header className="hero">
        <div>
          <p className="eyebrow">Job Tracker + Gmail Scanner</p>
          <h1>Track roles, scan Gmail, and generate clean job entries.</h1>
          <p className="lede">Connect with Google, pull recent emails, and keep a tidy list of job leads. Click any job row to remove it instantly.</p>
          <div className="cta-row">
            <button className="primary" onClick={() => window.location.href = `${serverUrl}/auth/google`}>Sign in with Google</button>
            <button className="ghost" onClick={pingServer}>Ping API</button>
          </div>
        </div>
        <div className="panel">
          <h3>Scan Gmail</h3>
          <p>Pull recent emails and let the model turn them into job entries.</p>
          <div className="stack">
            <button className="primary" onClick={scanEmails} disabled={scanLoading}>{scanLoading ? 'Scanning...' : 'Scan Emails'}</button>
            {emailStatus && <p className="status-text">{emailStatus}</p>}
            {scanLoading && <div className="inline-loader"><span className="spinner" /> Waiting for Gmail...</div>}
          </div>
        </div>
      </header>

      <section className="grid">
        <div className="card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Model Assist</p>
              <h3>Generate a job entry</h3>
            </div>
          </div>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Paste email text or write a prompt"
            rows={6}
          />
          <div className="card-actions">
            <button className="primary" onClick={() => submitEmail(prompt)} disabled={aiLoading}>
              {aiLoading ? 'Generating...' : 'Submit Prompt'}
            </button>
          </div>
          {aiLoading && <div className="inline-loader"><span className="spinner" /> Waiting for AI response...</div>}
          {genResult && (
            <div className="result">
              <p className="label">Model output</p>
              <pre>{genResult}</pre>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Emails</p>
              <h3>Recent scanned emails</h3>
            </div>
          </div>
          {emails.length === 0 ? (
            <p className="muted">No emails stored. Scan to import recent threads.</p>
          ) : (
            <ul className="email-list">
              {emails.map((email, idx) => (
                <li key={idx}>
                  <p className="label">{email.from}</p>
                  <p className="email-subject">{email.subject}</p>
                  <p className="muted">{email.date}</p>
                  <p className="snippet">{email.snippet}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="card jobs-card">
        <div className="card-header">
          <div>
            <p className="eyebrow">Tracked roles</p>
            <h3>Jobs table</h3>
          </div>
          <div className="card-actions inline">
            <button className="ghost" onClick={() => jobsTableRef.current?.updateTable()}>Refresh</button>
            <button className="ghost" onClick={clearJobs}>Clear jobs</button>
          </div>
        </div>
        <p className="muted">Click any row to remove that job.</p>
        <JobsTable ref={jobsTableRef} onRowRemove={removeJob} />
      </section>
    </div>
  );
}

export default App;
