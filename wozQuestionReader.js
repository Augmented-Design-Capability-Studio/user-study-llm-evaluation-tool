import fs from 'fs'
import csv from 'csv-parser'

export default async function readWOZQuestions(filePath) {
    const questions = {};
    
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath) // Create a read stream for the file
            .pipe(csv()) // Pipe the stream through the CSV parser
            .on('data', (row) => { // For each row in the CSV file
                const timestamp = row['video_time'].trim();
                const question = row['message'].trim();
                questions[timestamp] = question; // Store the question with its timestamp
            })
            .on('end', () => { // When the stream ends
                resolve(questions); // Resolve the promise with the questions
            })
            .on('error', reject); // Reject the promise if there's an error
    });
}