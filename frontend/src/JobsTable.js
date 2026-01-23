import React, { useState, useImperativeHandle, forwardRef, useEffect } from "react";

const JobsTable = forwardRef((props, ref) => {
    const [jobs, setJobs] = useState([]);
    const [selectedJobIndex, setSelectedJobIndex] = useState(null);

    function updateTable() {
        console.log("Updating jobs table...");
        fetch('/api/jobs')
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
        getSelectedJob
    }));

    useEffect(() => {
        updateTable();
    }, []);

    function selectAJob(index) {
        setSelectedJobIndex(index);
        console.log("Selected job index:", index);
    }

    return (
        <table>
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
                        onClick={() => selectAJob(index)}
                        style={{ cursor: 'pointer' }}
                    >
                        <td>{job.job}</td>
                        <td>{job.company}</td>
                        <td>{job.status}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
});

export { JobsTable };