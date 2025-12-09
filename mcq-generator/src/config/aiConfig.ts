export const aiConfig = {
    apiKey: process.env.AI_API_KEY || 'your-default-api-key',
    model: 'gpt-3.5-turbo',
    maxTokens: 150,
    temperature: 0.7,
    topP: 1.0,
    frequencyPenalty: 0,
    presencePenalty: 0,
};