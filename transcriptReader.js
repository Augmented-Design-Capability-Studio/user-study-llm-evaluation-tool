import fs from 'fs'
import path from 'path'

export default function readTranscription(filePath) {
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
