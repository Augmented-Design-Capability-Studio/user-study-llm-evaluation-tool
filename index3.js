import fs from 'fs'
import { OpenAI } from 'openai'
import readTranscription from './transcriptReader.js'
import readWOZQuestions from './wozQuestionReader.js'
import { config } from 'dotenv';
config(); 

const openai = new OpenAI({ apiKey: process.env.OPEN_AI_KEY })

const transcriptFilePath = 'data/P04/P04_DesignSession.srt';
const wozQuestionsFilePath = 'data/P04/P04.csv';

const assistantInstructions = `
This assistant is designed to help experienced engineers complete the task of designing a bracket for a ship engine using Fusion360's generative design feature. The assistant will ask guiding questions to help the user think through the design process, ensure thorough explanations, and consider new aspects without providing direct answers.

1. **Understanding the Design Brief:**
   - "Can you describe your understanding of the design task?"
   - "What are the space constraints for the bracket design?"
   - "How many connection points are required, and where are they located?"

3. **Defining Boundary Conditions:**
   - "How much weight must each bracket support?"
   - "What are the critical locations for maximizing strength?"

4. **Exploring Design Options:**
   - "Which materials are you considering for the bracket design?"
   - "What are the advantages and disadvantages of using stainless steel, cast iron, and the additional material you chose?"
   - "What manufacturing methods are you considering, and why?"

5. **Optimizing for DFMA:**
   - "How will you ensure that your design is optimized for machinability and cost?"
   - "What considerations are you taking for assembly operations, serviceability, and maintenance?"

6. **Using Fusion360:**
   - "Have you loaded the predefined elements from the Fusion360 project file?"
   - "How are you applying the generative design feature to explore different design options?"
   - "How are you defining structural loads in Fusion360?"

7. **Selecting and Exporting Final Designs:**
   - "How will you determine which three designs to select from the generated options?"
   - "What criteria will you use to evaluate and compare the designs?"
   - "Are you familiar with the 'Design from Outcome' option in the Explorer overlay for exporting your designs?"

8. **Additional Resources:**
   - "Are there any specific areas where you need more information or support from external resources?"
   - "Would drawing a freebody diagram help?"

9. **Final Checks:**
   - "Have you reviewed all the requirements and ensured your design meets them?"
   - "What are the next steps you will take to finalize and submit your designs?"

**Example Questions to Ask the User:**

**Response Guidelines:**
- Provide no more than a few sentences for each response. Preferably, only provide one sentence. 
- Focus on prompting the user to think critically and explain their thought process.
- Do not provide direct answers to the user's task-related questions.
`;

// Helper function to convert time format (hh:mm:ss,ms or hh:mm:ss) to seconds
function timeToSeconds(time) {
    const [hours, minutes, seconds] = time.split(':');
    const [secs, ms] = seconds.split(',');
    return Number(hours) * 3600 + Number(minutes) * 60 + Number(secs) + (ms ? Number(ms) / 1000 : 0);
}

async function main() {
    const transcript = readTranscription(transcriptFilePath);
    const wozQuestions = await readWOZQuestions(wozQuestionsFilePath);

    const generatedQuestions = [];
    const assistantUnderstanding = [];

    async function processTranscript() {
        let messages = [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'system', content: assistantInstructions }
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
                    model: 'gpt-4o',
                    messages: [
                        ...messages,
                        { role: 'user', content: 'What question would you ask the user here?' }
                    ],
                });

                // completion.choices[0]

                const assistantMessage = response.choices[0].message.content;
                console.log('Generated Question:', assistantMessage);

                generatedQuestions.push({
                    timestamp: entry.start,
                    generatedQuestion: assistantMessage,
                    wozQuestion: wozQuestion
                });

                // Generate the assistant's understanding of the user's progress
                const understandingResponse = await openai.chat.completions.create({
                    model: 'gpt-4o',
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

        // Save the generated questions and understanding to a file or log them
        fs.writeFileSync('data/P04/generatedQuestions.json', JSON.stringify(generatedQuestions, null, 2));
        fs.writeFileSync('data/P04/assistantUnderstanding.json', JSON.stringify(assistantUnderstanding, null, 2));
    }

    processTranscript().catch(console.error);
}

main().catch(console.error);