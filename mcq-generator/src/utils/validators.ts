export function validateQuestionText(questionText: string): boolean {
    return typeof questionText === 'string' && questionText.trim().length > 0;
}

export function validateOptions(options: string[]): boolean {
    return Array.isArray(options) && options.length >= 2 && options.every(option => typeof option === 'string' && option.trim().length > 0);
}

export function validateCorrectAnswer(correctAnswer: string, options: string[]): boolean {
    return options.includes(correctAnswer);
}

export function validateMcq(mcq: { questionText: string; options: string[]; correctAnswer: string }): boolean {
    return validateQuestionText(mcq.questionText) &&
           validateOptions(mcq.options) &&
           validateCorrectAnswer(mcq.correctAnswer, mcq.options);
}