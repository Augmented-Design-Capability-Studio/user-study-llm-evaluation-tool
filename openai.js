import { OpenAI } from 'openai';
import { config } from 'dotenv';

config(); 

const openAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY});
const model = 'gpt-4o';

let inputTokens;
let outputTokens;
let totalTokens;
const inputTokensPrice = 5/1000000; // for gpt 4o
const outputTokensPrice = 15/1000000; // for gpt 4o


// Ask the assistant to generate a question for the user (openAI)
export async function generateQuestionOpenAI(method_messages){
    const response = await openAI.chat.completions.create({
        model: model,
        messages: [
            ...method_messages,
            { role: 'user', content: 'What question would you ask the user here?' }
        ],
    });

    // Extract tokens used
    const tokensUsed = response.data.usage.total_tokens;
    inputTokens += response.data.usage.prompt_tokens;
    outputTokens += response.data.usage.completion_tokens;
    totalTokens += tokensUsed;

    return { response, tokensUsed };
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

    // Extract tokens used
    const tokensUsed = understandingResponse.data.usage.total_tokens;
    inputTokens += understandingResponse.data.usage.prompt_tokens;
    outputTokens += understandingResponse.data.usage.completion_tokens;
    totalTokens += tokensUsed;

    return { understandingResponse, tokensUsed };
}

// Helper function to calculate cost of API calls (openAI)
export function estimateCostOpenAI(totalTokens){
    let tokenCost;

    if (totalTokens != this.totalTokens){ // check if token count is correct
        console.error('Total token count does not match (openAI).');
    }
    else {
        tokenCost = (inputTokens * inputTokensPrice) + (outputTokens * outputTokensPrice);
    }

    return tokenCost;
}
