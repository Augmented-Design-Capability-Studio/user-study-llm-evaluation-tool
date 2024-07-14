import fs from 'fs';
import path from 'path';
import { OpenAI } from 'openai';
import {readTranscription, readWOZQuestions} from './transcriptReader.js';
import { config } from 'dotenv';
config();

const openai = new OpenAI({ apiKey: process.env.OPEN_AI_KEY });

// Helper function to convert time format (hh:mm:ss,ms or hh:mm:ss) to seconds
function timeToSeconds(time) {
    const [hours, minutes, seconds] = time.split(':');
    const [secs, ms] = seconds.split(',');
    return Number(hours) * 3600 + Number(minutes) * 60 + Number(secs) + (ms ? Number(ms) / 1000 : 0);
}

// Function to parse command-line arguments
function parseArguments() {
    const args = process.argv.slice(2);
    if (args.length !== 4) {
        console.error('Usage: node index.js [p-?] [pythia|socratais|hephaestus] [v-?] [4|4o]');
        process.exit(1);
    }
    const [dataFile, assistant, version, engine] = args;
    return { dataFile, assistant, version, engine };
}

// Function to read prompt instructions from a file
function readPromptInstructions(assistant, version) {
    const promptFilePath = path.join('system_prompts_openAI', `${assistant}_${version}.txt`);
    if (!fs.existsSync(promptFilePath)) {
        console.error(`Prompt file not found: ${promptFilePath}`);
        process.exit(1);
    }
    systemPrompt = fs.readFileSync(promptFilePath, 'utf-8');
    return systemPrompt.substring(0, systemPrompt.indexOf("Comments:")); // returns prompt up until comments

}

async function main() {
    const { dataFile, assistant, version, engine } = parseArguments();
    const transcriptFilePath = `data/${dataFile}/${dataFile}_DesignSession.srt`;
    const wozQuestionsFilePath = `data/${dataFile}/${dataFile}.csv`;

    const promptScript = readPromptInstructions(assistant, version);

    const transcript = readTranscription(transcriptFilePath);
    const wozQuestions = await readWOZQuestions(wozQuestionsFilePath);

    const generatedQuestions = [];
    const assistantUnderstanding = [];

    async function processTranscript() {
        let messages = [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'system', content: promptScript }
        ];

        const wozTimestamps = Object.keys(wozQuestions).map(timeToSeconds);
        let wozIndex = 0;

        for (let i = 0; i < transcript.length; i++) {
            const entry = transcript[i];
            const entryTimeInSeconds = timeToSeconds(entry.start);

            messages.push({ role: 'user', content: entry.content.trim() });

            if (wozIndex < wozTimestamps.length && entryTimeInSeconds >= wozTimestamps[wozIndex]) {
                const wozQuestion = wozQuestions[Object.keys(wozQuestions)[wozIndex]];

                // Ask the assistant to generate a question for the user
                const response = await openai.chat.completions.create({
                    model: `gpt-${engine}`,
                    messages: [
                        ...messages,
                        { role: 'user', content: 'What question would you ask the user here?' }
                    ],
                });

                const assistantMessage = response.choices[0].message.content;
                console.log('Generated Question:', assistantMessage);

                generatedQuestions.push({
                    timestamp: entry.start,
                    generatedQuestion: assistantMessage,
                    wozQuestion: wozQuestion
                });

                // Generate the assistant's understanding of the user's progress
                const understandingResponse = await openai.chat.completions.create({
                    model: `gpt-${engine}`,
                    messages: [
                        ...messages,
                        { role: 'user', content: 'Provide a short summary (1-2 sentences) of the user\'s progress and current state in the design task.' }
                    ],
                });

                const assistantUnderstandingMessage = understandingResponse.choices[0].message.content;
                console.log('Assistant Understanding:', assistantUnderstandingMessage);

                assistantUnderstanding.push({
                    timestamp: entry.start,
                    understanding: assistantUnderstandingMessage
                });

                messages.push({ role: 'assistant', content: assistantMessage });

                wozIndex++;
            }
        }
        const outputFileName = `${new Date().toISOString().replace(/[:-]/g, '').split('.')[0]}_${assistant}.csv`;
        const outputFilePath = path.join('data', dataFile, outputFileName);
        const metadata = `Agent;${assistant}\nVersion;${version}\nModel;${engine}\n`;
        const headers = 'Times;Generated Responses;Understanding of Agent\n';
        const rows = generatedQuestions.map((q, idx) => `${q.timestamp};"${q.generatedQuestion.replace(/"/g, '""')}";"${assistantUnderstanding[idx].understanding.replace(/"/g, '""')}"`).join('\n');
        
        fs.writeFileSync(outputFilePath, `${metadata}${headers}${rows}`);
    }

    processTranscript().catch(console.error);
}

main().catch(console.error);
