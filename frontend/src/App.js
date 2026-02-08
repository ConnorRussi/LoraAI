import React, { useState, useEffect, useRef } from 'react';
import './App.css'; // Common styles
import './AppShell.css';
import './Hero.css';
import './Card.css';
import './EmailList.css';
import './JobsTable.css';
import './Buttons.css';
import './Modal.css';
import './UserMeta.css';

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
  const [emailTotal, setEmailTotal] = useState(0);
  const [emailProcessed, setEmailProcessed] = useState(0);
  const jobsTableRef = useRef(); // <-- Add this line
  const [serverOnline, setServerOnline] = useState(true);

  


  //login logic
  function LoginHandler() {
    const params = new URLSearchParams(window.location.search);
    console.log('[Auth] LoginHandler params:', params.toString());
    if (params.get('login') !== 'success') {
      return;
    }
    // Fetch user info from the backend
    fetch( '/auth/me', {
      credentials: 'include' // include cookies
    })
      .then(response => {
        console.log('[Auth] /auth/me response status:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('[Auth] /auth/me response:', data);
        if (data.user) {
          setUser(data.user);
          setSuccessModalOpen(true);
        } else {
          console.error('[Auth] No user in response:', data);
        }
      })
      .catch(err => {
        console.error('Error fetching user info:', err);
      });
      // Clean up the URL
      const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      window.history.replaceState(null, '', newUrl);
  }
  useEffect(() => {
    // Check if redirected after login
    console.log('[Init] App mounted, running LoginHandler');
    LoginHandler();
  }, []);





  //job management logic
  async function addJob(job) {
    // Check if company name contains variations of "n/a"
    if (job && job.company && /^(n[./]?a\.?|not applicable|not available)$/i.test(job.company.trim())) {
      console.log('Skipping job as company is listed as N/A:', job);
      return;
    }

    const existingJobs = jobsTableRef.current?.getJobs?.() || [];
    //check if similar job exists already
    let similarJob = jobExists(existingJobs, job);
    console.log('Similar job check result:', similarJob);
    if (similarJob !== null) {
      console.log('Similar job already exists, evaluating which is farther between: ', similarJob, job);
      let fartherJob = getFartherJob(similarJob, job);
      console.log('Farther job is: ', fartherJob);
      //remove job if we are about to add a farther one
      if (fartherJob === job) {
        console.log("removing similar job as new job is farther");
        //new job is farther, so remove the existing one and add the new one
        let index = existingJobs.indexOf(similarJob);
        try {
          const response = await fetch('/api/removeJob', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ index: index })
          });
          const data = await response.json();
          console.log('Removed similar job at index ', index, ': ', data);
          await jobsTableRef.current?.updateTable?.();
        } catch (err) {
          console.error('Error removing similar job:', err);
        }
      }
      else {
        console.log("not adding job as existing one is farther or equal");
        return; //existing job is farther or equal, so do not add the new one
      }
    }
    // Add each answer to the CSV
    try {
      const response = await fetch('/api/addJob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job: job })
      });
      const data = await response.json();
      console.log('Add job response:', data);
      await jobsTableRef.current?.updateTable?.();
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
    // Check server status before submitting
    
    console.log('[AI] Submitting prompt:', promptText);
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
      console.log('[AI] Adding generated job:', job);
      await addJob(job);
    } catch (err) {
      setGenResult('Error: ' + err.message);
      console.error('[AI] Error generating job:', err);
    } finally {
      console.log('[AI] Done, clearing loading state');
      setAiLoading(false);
    }
  }

  async function pingServer() {
    let online = await checkServerOnline();
    if(online){
      alert('Server is online');
    } else {
      alert('Server is offline');
    }
  }

  // Example call to scan emails
  async function scanEmails() {
    
    
    const dateInput = window.prompt("Enter start date (MM/DD/YYYY):", "01/01/2026");
    if (!dateInput) return;

    console.log('[Scan] Scanning emails from date:', dateInput);
    setEmailStatus('Scanning...');
    setScanLoading(true);
    setEmails([]);
    setEmailTotal(0);
    setEmailProcessed(0);
    try {
      const response = await fetch(`/api/scan-emails?since=${encodeURIComponent(dateInput)}`);
      if (response.status === 401) {
        alert('Please sign in with Google first!');
        return;
      }

      const data = await response.json();
      if (data.error) {
        console.error('Scan error:', data.error);
        alert('Error: ' + data.error);
        setEmailStatus('');
        return;
      }

      const emailsToProcess = Array.isArray(data.emails) ? data.emails : [];
      console.log('[Scan] Emails found:', emailsToProcess);
      setEmailTotal(emailsToProcess.length);
      setEmailStatus(`Found ${emailsToProcess.length} email(s)`);
      setEmails(emailsToProcess);

      for (let i = 0; i < emailsToProcess.length; i += 1) {
        const email = emailsToProcess[i];
        const formattedPrompt = `From: ${email.from}\nSubject: ${email.subject}\nDate: ${email.date}\n\n${email.snippet}`;
        setEmailStatus(`Processing ${i + 1} of ${emailsToProcess.length}...`);
        await submitEmail(formattedPrompt);
        setEmailProcessed(i + 1);
      }

      if (emailsToProcess.length) {
        setEmailStatus(`Processed ${emailsToProcess.length} email(s)`);
      }
    } catch (err) {
      console.error('[Scan] Error scanning emails:', err);
      setEmailStatus('');
    } finally {
      console.log('[Scan] Done, clearing loading state');
      setScanLoading(false);
    }
      
  }

  const clearJobs = async () => {
    const currentJobs = jobsTableRef.current?.getJobs?.() || [];
    if (!currentJobs.length) {
      setEmailStatus('No jobs to clear');
      return;
    }
    console.log('[Jobs] Clearing all jobs, count:', currentJobs.length);
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
        console.error('[Jobs] Error clearing job at index', i, err);
      }
    }
    jobsTableRef.current?.updateTable();
    setEmailStatus('All jobs cleared');
    console.log('[Jobs] All jobs cleared');
  };


  // Checks if the server is online and updates state
  async function checkServerOnline() {
    try {
      const response = await fetch('/api/ping', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      let serverOn = response.message === 'pong';
      // serverOn = true; // Override to true if needed
      setServerOnline(serverOn);
      console.log('[Server] checkServerOnline response.ok:', serverOn);
      return serverOn;
    } catch (err) {
      setServerOnline(false);
      return false;
    }
  }

  

  useEffect(() => {
    // Check server status on mount/refresh
    checkServerOnline();
    // Optionally, check periodically
    const interval = setInterval(checkServerOnline, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-shell">
      {!serverOnline && (
        <div className="server-offline-banner">
          <p>Warning: The AI server appears to be offline. Some features may not work. Please reach out to the owner to get the server turned on</p>
        </div>
      )}
      {successModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setSuccessModalOpen(false)}>&times;</span>
            <h2>Login Successful</h2>
            {user && (
              <div className="user-meta">
                <img src={user.picture} alt="User Profile" className="avatar" onError={(e) => { console.warn('[Auth] Avatar failed to load, src=', user.picture); e.target.style.display = 'none'; }} />
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
            <button className="ghost" onClick={pingServer}>Check Server</button>
          </div>
        </div>
        <div className="panel">
          <h3>Scan Gmail</h3>
          <p>Pull recent emails and let the model turn them into job entries.</p>
          <div className="stack">
            <button className="primary" onClick={()=>{
              if(!serverOnline){
                alert('Server is offline. Please start the server before scanning emails.');
                return;
              }
              scanEmails();
            }} disabled={scanLoading}>{scanLoading ? 'Scanning...' : 'Scan Emails'}</button>
            {emailStatus && <p className="status-text">{emailStatus}</p>}
            {emailTotal > 0 && (
              <p className="status-text">Progress: {emailProcessed}/{emailTotal}</p>
            )}
            {scanLoading && <div className="inline-loader"><span className="spinner" /> Waiting for Gmail...</div>}
          </div>
        </div>
      </header>

      <section className="grid">
        <div className="card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Account</p>
              <h3>Signed in user</h3>
            </div>
          </div>
          {user ? (
            <div className="user-meta">
              <img src={user.picture} alt="User Profile" className="avatar" onError={(e) => { console.warn('[Auth] Avatar failed to load, src=', user.picture); e.target.style.display = 'none'; }} />
              <div>
                <p className="label">Name</p>
                <p>{user.name}</p>
                <p className="label">Email</p>
                <p>{user.email}</p>
              </div>
            </div>
          ) : (
            <p className="muted">Not signed in yet. Click "Sign in with Google" to continue.</p>
          )}
        </div>
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
            <button
              className="primary"
              onClick={() => {
                if (!serverOnline) {
                  alert('Server is not online. Please try again.');
                  return;
                }
                submitEmail(prompt);
              }}
              disabled={aiLoading}
            >
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
