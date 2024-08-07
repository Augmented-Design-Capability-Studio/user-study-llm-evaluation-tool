import Anthropic from "@anthropic-ai/sdk";
import { config } from 'dotenv';

config(); 

const claude = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
const model = 'claude-3-5-sonnet-20240620';
const max_tokens = 4096;

let inputTokens;
let outputTokens;
let totalTokens;
const inputTokensPrice = 3/1000000; // for claude 3.5 sonnet 
const outputTokensPrice = 15/1000000; // for claude 3.5 sonnet

export function formatMessagesForClaude(messages){
    // Filter for only 'user' messages 
      const userMessages = messages.filter(msg => msg.role === 'user');
    // Combine all user message contents with a newline separator
    const condensedContent = userMessages.map(msg => msg.content).join('\\n');

    // Create the new condensed message
    const claudeMessage = {
        role: 'user',
        content: condensedContent
    };

    return [claudeMessage];
}


// Ask the assistant to generate a question for the user (openAI)
export async function generateQuestionClaude(method_messages, promptScript){
    const response = await claude.messages.create({
        model: model,
        max_tokens: max_tokens,
        system: promptScript + '\\n What question would you ask the user here?',
        messages: [
            ...method_messages
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
export async function generateUnderstandingClaude(method_messages, promptScript){
    const understandingResponse = await claude.messages.create({
        model: model,
        max_tokens: max_tokens,
        system: promptScript + 'Provide a short summary (1-2 sentences) of the user\'s progress and current state in the design task.',
        messages: [
            ...method_messages
        ],
    });

    // Extract tokens used
    const tokensUsed = understandingResponse.data.usage.total_tokens;
    inputTokens += understandingResponse.data.usage.prompt_tokens;
    outputTokens += understandingResponse.data.usage.completion_tokens;
    totalTokens += tokensUsed;

    return { understandingResponse, tokensUsed };
}

// Helper function to calculate cost of API calls
export function estimateCostClaude(totalTokens){
    let tokenCost;

    if (totalTokens != this.totalTokens){ // check if token count is correct
        console.error('Total token count does not match (claude).');
    }
    else {
        tokenCost = (inputTokens * inputTokensPrice) + (outputTokens * outputTokensPrice);
    }

    return tokenCost;
}

