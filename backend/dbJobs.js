import { pool } from './db.js';

export async function findOrCreateUser(googleid, name, email) {
    // Check if user exists
    const selectQuery = 'SELECT * FROM jobtrackerusers WHERE googleid = $1';
    const selectResult = await pool.query(selectQuery, [googleid]);
    if (selectResult.rows.length > 0) {
        return selectResult.rows[0];
    }
    // Insert new user
    const insertQuery = `INSERT INTO jobtrackerusers (googleid, name, email) VALUES ($1, $2, $3) RETURNING *`;
    const insertResult = await pool.query(insertQuery, [googleid, name, email]);
    return insertResult.rows[0];
}

export async function getJobsForUser(googleid) {
    const query = 'SELECT * FROM trackedjobs WHERE googleid = $1';
    const result = await pool.query(query, [googleid]);
    return result.rows;
}

export async function saveJobForUser(job) {
    const { googleid, job_title, company, status, application_date, job_url, notes } = job;
    const query = `INSERT INTO trackedjobs (googleid, job_title, company, status, application_date, job_url, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
    const result = await pool.query(query, [googleid, job_title, company, status, application_date, job_url, notes]);
    return result.rows[0];
}

export async function updateJobForUser(jobid, job) {
    const { job_title, company, status, application_date, job_url, notes } = job;
    const query = `UPDATE trackedjobs SET job_title = $1, company = $2, status = $3, application_date = $4, job_url = $5, notes = $6, updated_at = NOW() WHERE jobid = $7 RETURNING *`;
    const result = await pool.query(query, [job_title, company, status, application_date, job_url, notes, jobid]);
    return result.rows[0];
}

export async function removeJobForUser(googleid, index) {
    // Get all jobs for the user
    const selectQuery = 'SELECT jobid FROM trackedjobs WHERE googleid = $1 ORDER BY created_at';
    const selectResult = await pool.query(selectQuery, [googleid]);
    
    if (index >= 0 && index < selectResult.rows.length) {
        const jobid = selectResult.rows[index].jobid;
        const deleteQuery = 'DELETE FROM trackedjobs WHERE jobid = $1';
        await pool.query(deleteQuery, [jobid]);
        return true;
    }
    return false;
}