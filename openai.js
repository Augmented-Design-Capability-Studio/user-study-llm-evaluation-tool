import { OpenAI } from 'openai';
import { config } from 'dotenv';

config(); 

const openAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY});
const model = 'gpt-4o';

let inputTokens = 0;
let outputTokens = 0;
let totalTokens = 0;
const inputTokensPrice = 5/1000000; // for gpt 4o
const outputTokensPrice = 15/1000000; // for gpt 4o


// Ask the assistant to generate text for the user (openAI)
export async function generateTextOpenAI(method_messages, messageAim){
    let chatMessages = [];
    // Ask the assistant to generate a question for the user
    if (messageAim === "question") {
        chatMessages = [
            ...method_messages,
            { role: 'user', content: 'What question would you ask the user here?' }
        ]
    }
    // Generate the assistant's understanding of the user's progress
    else if (messageAim === "understanding"){
        chatMessages = [
            ...method_messages,
            { role: 'user', content: 'Provide a short summary (1-2 sentences) of the user\'s progress and current state in the design task.' }
        ]
    }
    else {
        console.error('Error: messageAim is undefined.')
    }

    const response = await openAI.chat.completions.create({
        model: model,
        messages: chatMessages,
    });

    return response;
}

export function countTokensOpenAI(chatCompletion){
    const tokensUsed = chatCompletion.usage.total_tokens;
    inputTokens += chatCompletion.usage.prompt_tokens;
    outputTokens += chatCompletion.usage.completion_tokens;
    totalTokens += tokensUsed;
}

export function returnTokensOpenAI(){
    return totalTokens;
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


