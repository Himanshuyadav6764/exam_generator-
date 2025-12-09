class QuestionValidatorAgent {
    validateQuestion(question) {
        // Check if the question text is not empty
        if (!question.text || question.text.trim() === '') {
            return { valid: false, error: 'Question text cannot be empty.' };
        }

        // Check if there are options provided
        if (!question.options || question.options.length < 2) {
            return { valid: false, error: 'At least two options are required.' };
        }

        // Check if the correct answer is provided
        if (question.correctAnswer === undefined || !question.options.includes(question.correctAnswer)) {
            return { valid: false, error: 'Correct answer must be one of the provided options.' };
        }

        // Additional validation rules can be added here

        return { valid: true, error: null };
    }
}

export default QuestionValidatorAgent;