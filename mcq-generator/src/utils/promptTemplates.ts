export const mcqGenerationPrompt = `
Generate a multiple-choice question based on the following topic: {topic}. 
Ensure that the question is clear, concise, and has one correct answer among the options provided.
`;

export const questionValidationPrompt = `
Validate the following multiple-choice question: {question}. 
Check if it has one correct answer and if the options are relevant and distinct.
`;

export const topicPrompt = `
Provide a list of potential topics for generating multiple-choice questions. 
The topics should be diverse and cover various subjects.
`;

export const answerOptionsPrompt = `
Given the question: {question}, generate four distinct answer options, 
including one correct answer and three plausible distractors.
`;