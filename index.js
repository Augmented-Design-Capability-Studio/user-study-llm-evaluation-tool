import fs from 'fs';
import path from 'path';
import { estimateCostOpenAI, generateQuestionOpenAI, generateUnderstandingOpenAI } from './openai.js';
import { generateQuestionClaude, generateUnderstandingClaude, formatMessagesForClaude, estimateCostClaude } from './claude.js';
import { readTranscription, readWOZQuestions, injectWOZQuestions, removeWOZQuestions } from './transcriptReader.js';
// import { extract_keyframes } from './videoReader.js';
import { config } from 'dotenv';
config();

// Helper function to convert time format to seconds
function timeToSeconds(timeString) {
    const parts = timeString.split(':');
    const hours = parseInt(parts.length === 3 ? parts[0] : '0', 10);
    const minutes = parseInt(parts.length === 3 ? parts[1] : parts[0], 10);
    const seconds = parseInt(parts.length === 3 ? parts[2] : parts[1], 10);
    return hours * 3600 + minutes * 60 + seconds;
}

// Helper function to calculate cost of API calls
function estimateCostMain(totalTokens, engine){
    let tokenCost = 0;
    if (engine === 'openAI'){
        totalCost = estimateCostOpenAI(totalTokens);
    }
    else if (engine === 'claude'){
        totalCost = estimateCostClaude(totalTokens);
    }
    else {
        console.error('Engine must either be \'openAI\' or \'claude\'.');
    }

    return { tokenCost };
}


// Function to parse command-line arguments
export function parseArguments() {
    const args = process.argv.slice(2);
    if (args.length !== 5) {
        console.error('Usage: node index.js [P?] [wizard-y/n] [screenshot-y/n] [openAI|claude]  [pythia-v?|socratais-v?|hephaistus-v?]');
        process.exit(1);
    }
    // Sets variables
    const [dataFile, transcript_wizard, screenshot, engine, assistant_version] = args;

    // Separates assistant & version into two variables
    const assistant = assistant_version.substring(0, assistant_version.indexOf("-"));
    const version = assistant_version.substring(assistant_version.indexOf("-") + 1);

    // Returns variables
    return { dataFile, transcript_wizard, screenshot, engine, assistant, version };
}

// Function to read prompt instructions from a file
export function readPromptInstructions(assistant, version) {
    const promptFilePath = path.join('system_prompts', `${assistant}`, `${assistant}_${version}.txt`);
    if (!fs.existsSync(promptFilePath)) {
        console.error(`Prompt file not found: ${promptFilePath}`);
        process.exit(1);
    }
    const systemPrompt = fs.readFileSync(promptFilePath, 'utf-8');
    return systemPrompt.substring(0, systemPrompt.indexOf("Comments:")); // returns prompt up until comments
}

// Generates the assistant questions, understanding, and .cvs files
async function main() {
    
    const { dataFile, transcript_wizard, engine, assistant, version } = parseArguments();

    // Sets file paths
    const transcriptFilePath = `data/${dataFile}/${dataFile}_DesignSession.srt`;
    const wozQuestionsFilePath = `data/${dataFile}/${dataFile}.csv`;
    // TODO: const screenshotFilePath = `data/${dataFile}/${dataFile}_Screenshots.srt`;

    // Prompt
    const promptScript = readPromptInstructions(assistant, version);

    // Sets the transcripts (WOZ Questions or not)
    let transcript = readTranscription(transcriptFilePath);
    const wozQuestions = await readWOZQuestions(wozQuestionsFilePath);

    if (transcript_wizard === "wizard-y"){
        transcript = injectWOZQuestions(transcript, wozQuestions);
        console.log("transcript: ", transcript);
    }
    else if (transcript_wizard === "wizard-n"){
        transcript = removeWOZQuestions(transcript, wozQuestions);
    }
    else {
        console.error('Transcript must either be \'wizard-y\' or \'wizard-n\'.');
    }

    // Sets the screenshots
    // TODO: const screenshot = readScreenshots(screenshotFilePath);


    const generatedQuestions = [];
    const assistantUnderstanding = [];

    // Processes transcript
    async function processTranscript() {
        let messages = [
            { role: 'system', content: promptScript }
        ];

        const wozTimestamps = wozQuestions.map(question => timeToSeconds(question.time));
        
        let wozIndex = 0;
        let totalTokens = 0;

        // Maps the generated questions / WoZ questions to timestamps
        for (let i = 0; i < transcript.length; i++) {
            const entry = transcript[i];
            const entryTimeInSeconds = timeToSeconds(entry.start);

            messages.push({ role: 'user', content: entry.content.trim() });

            if (wozIndex < wozTimestamps.length && entryTimeInSeconds >= wozTimestamps[wozIndex]) {
                const wozQuestion = wozQuestions[Object.keys(wozQuestions)[wozIndex]];

                // Instructions if engine runs on OpenAI
                if (engine === "openAI"){

                    let response;
                    try {
                        const questionGenerated = await generateQuestionOpenAI(messages);
                        response = questionGenerated.response;
                        totalTokens += questionGenerated.tokensUsed; // Tokens generated (openAI)
                        console.log(response);
                    } catch (error) {
                        console.error('Error generating OpenAI question:', error);
                    }

                    // Check if response is defined (openAI)
                    let assistantMessage;
                    if (response) { 
                        assistantMessage = response.choices[0].message.content;
                        console.log('Generated Question:', assistantMessage);
                    } else {
                        console.error('Question is undefined.');
                    }

                    // Push messages to generatedQuestions (openAI)
                    generatedQuestions.push({
                        timestamp: entry.start,
                        generatedQuestion: assistantMessage,
                        wozQuestion: wozQuestion
                    });

                    // Generate the assistant's understanding of the user's progress (openAI)
                    let understandingResponse;
                    try {
                        const understandingGenerated = await generateUnderstandingOpenAI(messages);
                        understandingResponse = understandingGenerated.understandingResponse;
                        totalTokens += understandingGenerated.tokensUsed; // Tokens generated (openAI)
                        console.log(understandingResponse);
                    } catch (error) {
                        console.error('Error generating OpenAI understanding:', error);
                    }

                    let assistantUnderstandingMessage;
                    if (understandingResponse) { 
                        assistantUnderstandingMessage = understandingResponse.choices[0].message.content;
                        console.log('Assistant Understanding:', assistantUnderstandingMessage);
                    } else {
                        console.error('Response is undefined.');
                    }

                    // Push messages to assistantUnderstanding (openAI)
                    assistantUnderstanding.push({
                        timestamp: entry.start,
                        understanding: assistantUnderstandingMessage
                    });

                    messages.push({ role: 'assistant', content: assistantMessage });

                    wozIndex++;
                }

                // Instructions if engine runs on Claude
                else if (engine === "claude"){

                    let response;
                    
                    messages = formatMessagesForClaude(messages);

                    try {
                        const questionGenerated = await generateQuestionClaude(messages, promptScript);
                        response = questionGenerated.response; 
                        totalTokens += questionGenerated.tokensUsed; // Tokens generated (claude)
                        console.log(response);
                    } catch (error) {
                        console.error('Error generating Claude question:', error);
                    }

                    // Check if response is defined (claude)
                    let assistantMessage;
                    if (response) { 
                        assistantMessage = response.content[0].text;
                        console.log('Generated Question:', assistantMessage);
                    } else {
                        console.error('Question is undefined.');
                    }

                    // Push messages to generatedQuestions (claude)
                    generatedQuestions.push({
                        timestamp: entry.start,
                        generatedQuestion: assistantMessage,
                        wozQuestion: wozQuestion
                    });

                    // Generate the assistant's understanding of the user's progress (claude)
                    let understandingResponse;
                    try {
                        const understandingGenerated = await generateUnderstandingClaude(messages, promptScript);
                        understandingResponse = understandingGenerated.understandingResponse;
                        totalTokens += understandingGenerated.tokensUsed; // Tokens generated (claude)
                        console.log(understandingResponse);
                    } catch (error) {
                        console.error('Error generating Claude understanding:', error);
                    }

                    let assistantUnderstandingMessage;
                    if (understandingResponse) { 
                        assistantUnderstandingMessage = understandingResponse.content[0].text;
                        console.log('Assistant Understanding:', assistantUnderstandingMessage);
                    } else {
                        console.error('Response is undefined.');
                    }

                    // Push messages to assistantUnderstanding (claude)
                    assistantUnderstanding.push({
                        timestamp: entry.start,
                        understanding: assistantUnderstandingMessage
                    });

                    messages.push({ role: 'assistant', content: assistantMessage });

                    wozIndex++;

                }

                // Instructions if engine specified is not OpenAI or Claude
                else {
                    console.error('Engine must either be \'openAI\' or \'claude\'.');
                }

            }
        }

        // naming & metadata
        const outputFileName = `${new Date().toISOString().replace(/[:-]/g, '').split('.')[0]}_${engine}_${assistant}-${version}.csv`;
        const outputFilePath = path.join('data', dataFile, outputFileName);
        const tokenCost = estimateCostMain(totalTokens, engine);
        const metadata = `Agent;${assistant}\nVersion;${version}\nEngine;${engine}\nTranscript;${transcript_wizard}\nTokens;${totalTokens}\nEstimated Cost${tokenCost}\n`;
        const headers = 'Times;Generated Responses;Understanding of Agent\n'

        const rows = generatedQuestions.map((q, idx) => `${q.timestamp};"${q.generatedQuestion.replace(/"/g, '""')}";"${assistantUnderstanding[idx].understanding.replace(/"/g, '""')}"`).join('\n');
        
        fs.writeFileSync(outputFilePath, `${metadata}${headers}${rows}`);
    }

    processTranscript().catch(console.error);

}

main().catch(console.error);
