import { McqGeneratorAgent } from '../../src/agents/mcqGeneratorAgent';
import { QuestionValidatorAgent } from '../../src/agents/questionValidatorAgent';

describe('McqGeneratorAgent', () => {
    let mcqGeneratorAgent: McqGeneratorAgent;

    beforeEach(() => {
        mcqGeneratorAgent = new McqGeneratorAgent();
    });

    it('should generate MCQs based on provided topics', () => {
        const topics = ['JavaScript', 'TypeScript'];
        const prompts = 'Generate MCQs for the following topics:';
        const mcqs = mcqGeneratorAgent.generateMCQs(topics, prompts);
        
        expect(mcqs).toBeDefined();
        expect(mcqs.length).toBeGreaterThan(0);
        mcqs.forEach(mcq => {
            expect(mcq.question).toBeDefined();
            expect(mcq.options).toBeDefined();
            expect(mcq.correctAnswer).toBeDefined();
        });
    });
});

describe('QuestionValidatorAgent', () => {
    let questionValidatorAgent: QuestionValidatorAgent;

    beforeEach(() => {
        questionValidatorAgent = new QuestionValidatorAgent();
    });

    it('should validate generated MCQs', () => {
        const mcq = {
            question: 'What is TypeScript?',
            options: ['A programming language', 'A type of coffee', 'A framework', 'None of the above'],
            correctAnswer: 'A programming language'
        };
        const isValid = questionValidatorAgent.validate(mcq);
        
        expect(isValid).toBe(true);
    });

    it('should invalidate MCQs with missing properties', () => {
        const mcq = {
            options: ['A programming language', 'A type of coffee'],
            correctAnswer: 'A programming language'
        };
        const isValid = questionValidatorAgent.validate(mcq);
        
        expect(isValid).toBe(false);
    });
});