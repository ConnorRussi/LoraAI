import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { prompts, answers } from './Prompts';
import { JobsTable } from './JobsTable';

function App() {
  const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
  const [user, setUser] = useState(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [genResult, setGenResult] = useState(null);
  const jobsTableRef = useRef(); // <-- Add this line

  

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

  function handlePrompts() {
    // Process each prompt sequentially
    (async () => {
      for (let i = 0; i < prompts.length; i++) {
        const promptText = prompts[i];
        submitEmail(promptText);
      }
    })();
  }
  function addJob(job) {
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
        if (jobsTableRef.current) {
          jobsTableRef.current.updateTable();
        }

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

  async function submitEmail(promptText) {
    try {
      // Mocked response for testing: output is always an array of objects
      const data = {
        output: [
          {
            job: "Summer 2026 Internship – Digital Agent Development",
            company: "Vistra Corp",
            status: "applied"
          },
          {
            job: "Software Engineer, Intern - Summer 2026 Ashburn, VA",
            company: "Visa",
            status: "Technical assessment"
          }
        ]
      };

      // If output is a string, parse it; otherwise, use as is
      let jobsArray = data.output;
      if (typeof jobsArray === 'string') {
        jobsArray = JSON.parse(jobsArray);
      }

      setGenResult(JSON.stringify(jobsArray, null, 2)); // Show nicely formatted result

      // Add each job to the backend
      jobsArray.forEach(jobObj => addJob(jobObj));

    } catch (err) {
      setGenResult('Error: ' + err.message);
    }
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
        <div>
          <button onClick={() => {
            removeJob();
          }}>
            Remove Selected Job
          </button>
        </div>
        {/* <div>
          <button onClick={() => {
            window.location.href =  '/auth/google';
          }}>
            Sign in with Google
          </button>
        </div> */}
        {/* <div>
          <button onClick={async () => {
            handlePrompts();
          }}>
            Process Prompts
          </button>
        </div> */}
       
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
