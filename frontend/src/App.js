import React, { useState, useEffect, useRef } from 'react';
import './App.css';

import { JobsTable } from './JobsTable';
import { stringSimilarity, jobSimilarity, getFartherJob, jobExists } from './jobUtils.js';

function App() {
  const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
  const [user, setUser] = useState(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [genResult, setGenResult] = useState(null);
  const jobsTableRef = useRef(); // <-- Add this line

  

  //login logic
  function LoginHandler() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('login') != 'success') {
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
      params.delete('login');
      const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      window.history.replaceState(null, '', newUrl);
  }
  useEffect(() => {
    // Check if redirected after login
    LoginHandler();
  }, []);





  //job management logic
  function addJob(job) {
    //check if similar job exists already
    let similarJob = jobExists(jobsTableRef.current.getJobs(), job);
    console.log('Similar job check result:', similarJob);
    if (similarJob != null) {
      console.log('Similar job already exists, evaluating which is farther between: ', similarJob, job);
      let fartherJob = getFartherJob(similarJob, job);
      console.log('Farther job is: ', fartherJob);
      //remove job if we are about to add a farther one
      if (fartherJob == job) {
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

  async function removeJob() {
    const index = jobsTableRef.current.getSelectedJob();
    if (index === null) {
      alert('No job selected for removal.');
      return;
    }
    try {
      fetch('/api/removeJob', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index: index })
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


  return (
    <div className="App">
      {successModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setSuccessModalOpen(false)}>&times;</span>
            <h2>Login Successful</h2>
            {user && (
              <div>
                <img src={user.picture} alt="User Profile" />
                <p>Name: {user.name}</p>
                <p>Email: {user.email}</p>
              </div>
            )}
          </div>
        </div>
      )}
      {/* //model text box and buttons */}
        <div style={{marginTop:20}}>
          <h3>Ask the model</h3>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Enter a prompt for the model"
            rows={4}
            style={{width: '100%', maxWidth: 600}}
          />
          <div style={{marginTop:8}}>
            <button onClick={() => {
              // Example fetch call (uncomment and adapt endpoint/headers to use):
             submitEmail(prompt);

              // For now we just show the prompt as a placeholder result
              //setGenResult('Would send prompt: ' + prompt);
            }}>
              Submit Prompt
            </button>
          </div>
          {genResult && (
            <div style={{marginTop:12, whiteSpace:'pre-wrap'}}>
              <strong>Result:</strong>
              <div>{genResult}</div>
            </div>
          )}
        </div>
        <br />
        <br />
        {/* google login stuff */}
          <div>
          <button onClick={() => {
            window.location.href =  '/auth/google';
          }}>
            Sign in with Google
          </button>
        </div>
        <br />
        <br />
        <button onClick={() => {
          pingServer();
        }}>
          Ping Server
        </button>
        <br />
        <br />
      {/* job management buttons and table */}
        <div>
          <button onClick={() => {
            removeJob();
          }}>
            Remove Selected Job
          </button>
        </div>

      
        
       
        <div>
          <button onClick={() => {
            if (jobsTableRef.current) {
              jobsTableRef.current.updateTable();
            }
          }}>
            Update Jobs Table
          </button>
        </div>
        <div>
          <h2>Tracked Jobs</h2>
          <JobsTable ref={jobsTableRef} />
        </div>
    </div>
  );
}

export default App;
