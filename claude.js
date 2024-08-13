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

// Ask the assistant to generate text for the user (claude)
export async function generateTextClaude(method_messages, messageAim, promptScript){
    let systemScript = '';
    // Ask the assistant to generate a question for the user
    if (messageAim === "question") {
        systemScript = promptScript + '\\n What question would you ask the user here?';
    }
    // Generate the assistant's understanding of the user's progress
    else if (messageAim === "understanding"){
        systemScript = promptScript + '\\n Provide a short summary (1-2 sentences) of the user\'s progress and current state in the design task.';
    }
    else {
        console.error('Error: messageAim is undefined.')
    }

    const response = await claude.messages.create({
        model: model,
        max_tokens: max_tokens,
        system: systemScript,
        messages: [
            ...method_messages
        ],
    });

    return response;
}

export function countTokensClaude(chatCompletion){
    const tokensUsed = chatCompletion.usage.total_tokens;
    inputTokens += chatCompletion.usage.prompt_tokens;
    outputTokens += chatCompletion.usage.completion_tokens;
    totalTokens += tokensUsed;
}

export function returnTokensClaude(){
    return totalTokens;
}

// Helper function to calculate cost of API calls (claude)
export function estimateCostClaude(totalTokens){
    let tokenCost;

    if (totalTokens != this.totalTokens){ // check if token count is correct
        console.error('Total token count does not match (openAI).');
    }
    else {
        tokenCost = (inputTokens * inputTokensPrice) + (outputTokens * outputTokensPrice);
    }

    return tokenCost;
}