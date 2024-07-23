import { OpenAI } from 'openai';
import { config } from 'dotenv';

config(); 

const openAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY});
const model = 'gpt-4o';


// Ask the assistant to generate a question for the user (openAI)
export async function generateQuestionOpenAI(method_messages){
    const response = await openAI.chat.completions.create({
        model: model,
        messages: [
            ...method_messages,
            { role: 'user', content: 'What question would you ask the user here?' }
        ],
    });
    return { response };
}

// Generate the assistant's understanding of the user's progress
export async function generateUnderstandingOpenAI(method_messages){
    const understandingResponse = await openAI.chat.completions.create({
        model: model,
        messages: [
            ...method_messages,
            { role: 'user', content: 'Provide a short summary (1-2 sentences) of the user\'s progress and current state in the design task.' }
        ],
    });
    return { understandingResponse };
}
