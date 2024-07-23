import fs from 'fs';
import csv from 'csv-parser';

// Function to convert time string (HH:MM) to minutes since midnight
function timeToMinutes(time) {
    const parts = time.split(/[:.,]/).map(Number);  // Split by colon, period, or comma
    const [hours, minutes, seconds, milliseconds] = parts;

    // Convert hours and minutes to minutes
    let totalMinutes = hours * 60 + minutes;

    // If there are seconds, convert them to minutes and add
    if (seconds !== undefined) {
        totalMinutes += seconds / 60;
    }

    // If there are milliseconds, convert them to minutes and add
    if (milliseconds !== undefined) {
        totalMinutes += milliseconds / (60 * 1000);
    }

    return Math.floor(totalMinutes);
}

function timeToSeconds(time) {
    const parts = time.split(/[:.,]/).map(Number);  // Split by colon, period, or comma
    const [hours, minutes, seconds, milliseconds] = parts;
    let totalSeconds = hours * 1200 + minutes * 60 + seconds;
    return totalSeconds;
}

// Function to read video transcription from a CSV file
export function readTranscription(filePath) {
    const data = fs.readFileSync(filePath, 'utf8');
    
    const lines = data.split('\n');
    const transcript = [];
    
    let currentEntry = {};
    
    lines.forEach(line => {
        const timestampMatch = line.match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
        if (timestampMatch) {
            currentEntry = { start: timestampMatch[1], end: timestampMatch[2], content: '' };
        } else if (line.trim()) {
            currentEntry.content += line.trim() + ' ';
        } else {
            if (currentEntry.content) {
                transcript.push(currentEntry);
                currentEntry = {};
            }
        }
    });
    
    return transcript;
}

// Function to read the WOZ questions from a CSV file
export async function readWOZQuestions(filePath) {
    const questions = [];
    
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => {
                const timestamp = row['video_time'].trim();
                const question = row['message'].trim();
                questions.push({"time": timestamp, "question": question})
            })
            .on('end', () => {
                resolve(questions);
                console.log('Successfully read and parsed the CSV file!');
            })
            .on('error', (error) => {
                console.error('Error reading or parsing the CSV file:', error);
                reject(error);
            });
    });
}

// Function to inject WOZ questions into the transcription
export function injectWOZQuestions(transcript, questions) {
    let counter = 0
    let injectedTranscript = []

    for (let i = 0; i < transcript.length; i++) {
        let entry = transcript[i]
        let next_entry = transcript[i + 1]
        if (counter < questions.length && timeToSeconds(questions[counter].time) > timeToSeconds(entry.start) && timeToSeconds(questions[counter].time) < timeToSeconds(next_entry.start)) {
            let new_entry = {}
            new_entry["start"] = questions[counter].time
            new_entry["end"] = next_entry.start
            new_entry["content"] = questions[counter]['question']
            console.log(new_entry)
            injectedTranscript.push(new_entry)
            counter += 1
        }
        injectedTranscript.push(entry)
    }

    return injectedTranscript;
}

// Function to remove WOZ questions from the transcription
export function removeWOZQuestions(transcript, questions) {
    let removedTranscript = []
    const regex = /[\'.,\/#!$%\^?&\*;:{}=\-_`~()"\[\]\s]/g;
    let counter = 0

    transcript.forEach(entry => {
        let questionStart = timeToMinutes(questions[counter].time)
        let entryStart = timeToMinutes(entry.start)
        let line = entry.content.replace(regex, "").toLowerCase()
        let question = questions[counter].question.replace(regex,"").toLowerCase()

        if (questionStart == entryStart) {
            if (!question.includes(line)) {
                removedTranscript.push(entry)
            }
        } else if (entryStart > questionStart && counter < questions.length - 1) {
            counter += 1
            removedTranscript.push(entry)
        } else {
            removedTranscript.push(entry)
        }
    });
    return removedTranscript;
}

export function saveTranscriptToFile(filePath, transcript) {
    const data = transcript.map(entry => `${entry.start} --> ${entry.end}\n${entry.content.trim()}\n`).join('\n');
    fs.writeFileSync(filePath, data, 'utf8');
}
