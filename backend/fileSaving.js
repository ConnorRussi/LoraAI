import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


function addJob(job) {
    const jobsPath = path.join(__dirname, 'jobs.json');
    fs.readFile(jobsPath, 'utf8', (err, data) => {
        let jobs = [];
        if (!err && data) {
            try {
                jobs = JSON.parse(data);
            } catch (e) {
                // If file is not valid JSON, start fresh
                jobs = [];
            }
        }
        jobs.push(job);
        fs.writeFile(jobsPath, JSON.stringify(jobs, null, 2), (err) => {
            if (err) {
                console.error('Error saving job:', err);
            } else {
                console.log('Job saved:', job);
            }
        });
    });
}


function removeJob(index) {
    return new Promise((resolve, reject) => {
        const jobsPath = path.join(__dirname, 'jobs.json');
        fs.readFile(jobsPath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading jobs:', err);
                return reject('Error reading jobs');
            }
            let jobs = [];
            try {
                jobs = JSON.parse(data);
            } catch (e) {
                console.error('Invalid JSON:', e);
                return reject('Invalid JSON');
            }
            if (Array.isArray(jobs) && index >= 0 && index < jobs.length) {
                jobs.splice(index, 1); // Remove the item at the given index
                fs.writeFile(jobsPath, JSON.stringify(jobs, null, 2), (err) => {
                    if (err) {
                        console.error('Error saving jobs:', err);
                        return reject('Error saving jobs');
                    } else {
                        console.log(`Removed job at index ${index}`);
                        return resolve();
                    }
                });
            } else {
                console.warn('Index out of bounds or jobs is not an array.');
                return reject('Index out of bounds or jobs is not an array.');
            }
        });
    });
}
    

function readJobs() {
    console.log('Reading jobs from file...');
    const jobsPath = path.join(__dirname, 'jobs.json');
    try {
        const data = fs.readFileSync(jobsPath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading jobs:', err);
        return [];
    }
}
export { addJob, readJobs, removeJob };