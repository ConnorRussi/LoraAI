import { pool } from './db.js';

async function testDBConnection() {
    try {
        // Test basic connection
        const result = await pool.query('SELECT NOW()');
        console.log('Database connected successfully:', result.rows[0]);
        
        // Test user table
        const users = await pool.query('SELECT * FROM jobtrackerusers');
        console.log('Users in database:', users.rows);
        
        // Test jobs table
        const jobs = await pool.query('SELECT * FROM trackedjobs');
        console.log('Jobs in database:', jobs.rows);
        
    } catch (err) {
        console.error('Database connection error:', err);
    } finally {
        await pool.end();
    }
}

testDBConnection();