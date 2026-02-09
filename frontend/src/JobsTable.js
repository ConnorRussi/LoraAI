import React, { useState, useImperativeHandle, forwardRef, useEffect } from "react";

const JobsTable = forwardRef(({ onRowRemove }, ref) => {
    const [jobs, setJobs] = useState([]);
    const [selectedJobIndex, setSelectedJobIndex] = useState(null);

    function updateTable() {
        console.log("Updating jobs table...");
        fetch('/api/jobs', {
            credentials: 'include'
        })
            .then(response => response.json())
            .then(data => {
                // Ensure jobs is always an array
                if (Array.isArray(data)) {
                    setJobs(data);
                } else if (Array.isArray(data.jobs)) {
                    setJobs(data.jobs);
                } else {
                    setJobs([]);
                }
                console.log("fetched jobs: ", jobs);
            })
            .catch(err => {
                console.error('Error fetching jobs:', err);
                setJobs([]);
            });
    }

    function getSelectedJob() {
        if (selectedJobIndex !== null && jobs[selectedJobIndex]) {
            let index = selectedJobIndex;
            setSelectedJobIndex(null); // Clear selection after retrieval
            return index;
        }
        return null;
    }
    useImperativeHandle(ref, () => ({
        updateTable,
        getSelectedJob,
        getJobs: () => jobs
    }));

    useEffect(() => {
        updateTable();
    }, []);

    function selectAJob(index) {
        setSelectedJobIndex(index);
        console.log("Selected job index:", index);
    }

    const handleRowClick = (index) => {
        selectAJob(index);
        if (typeof onRowRemove === 'function') {
            onRowRemove(index);
        }
    };

    return (
        <table className="jobs-table">
            <thead>
                <tr>
                    <th>Job</th>
                    <th>Company</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                {(Array.isArray(jobs) ? jobs : []).map((job, index) => (
                    <tr
                        key={index}
                        onClick={() => handleRowClick(index)}
                        className={selectedJobIndex === index ? 'selected' : ''}
                    >
                        <td>{job.job || job.job_title}</td>
                        <td>{job.company}</td>
                        <td>{job.status}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
});

export { JobsTable };