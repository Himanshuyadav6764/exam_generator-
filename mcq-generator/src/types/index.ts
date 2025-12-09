export type Mcq = {
    questionText: string;
    options: string[];
    correctAnswer: string;
};

export type Topic = {
    name: string;
    relatedMcqs: Mcq[];
};

export type AiConfig = {
    apiKey: string;
    model: string;
    parameters: Record<string, any>;
};

export type PromptTemplate = {
    templateName: string;
    template: string;
};

export type ValidationResult = {
    isValid: boolean;
    errors: string[];
};