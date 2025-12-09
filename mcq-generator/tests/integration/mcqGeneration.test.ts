import { McqGeneratorAgent } from '../../src/agents/mcqGeneratorAgent';
import { QuestionValidatorAgent } from '../../src/agents/questionValidatorAgent';
import { AiModelService } from '../../src/services/aiModelService';
import { McqService } from '../../src/services/mcqService';
import { EvaluationService } from '../../src/services/evaluationService';

describe('MCQ Generation Integration Tests', () => {
    let mcqGeneratorAgent: McqGeneratorAgent;
    let questionValidatorAgent: QuestionValidatorAgent;
    let aiModelService: AiModelService;
    let mcqService: McqService;
    let evaluationService: EvaluationService;

    beforeAll(() => {
        mcqGeneratorAgent = new McqGeneratorAgent();
        questionValidatorAgent = new QuestionValidatorAgent();
        aiModelService = new AiModelService();
        mcqService = new McqService();
        evaluationService = new EvaluationService();
    });

    test('should generate valid MCQs for a given topic', async () => {
        const topic = 'Artificial Intelligence';
        const mcqs = await mcqGeneratorAgent.generateMCQs(topic);
        expect(mcqs).toBeDefined();
        expect(mcqs.length).toBeGreaterThan(0);
        
        mcqs.forEach(mcq => {
            const isValid = questionValidatorAgent.validate(mcq);
            expect(isValid).toBe(true);
        });
    });

    test('should evaluate the generated MCQs', async () => {
        const topic = 'Machine Learning';
        const mcqs = await mcqGeneratorAgent.generateMCQs(topic);
        const evaluationResults = await evaluationService.evaluate(mcqs);
        
        expect(evaluationResults).toBeDefined();
        expect(evaluationResults.length).toBe(mcqs.length);
        evaluationResults.forEach(result => {
            expect(result.score).toBeGreaterThan(0);
        });
    });

    test('should store generated MCQs', async () => {
        const topic = 'Data Science';
        const mcqs = await mcqGeneratorAgent.generateMCQs(topic);
        await mcqService.storeMCQs(mcqs);
        
        const storedMCQs = await mcqService.getMCQsByTopic(topic);
        expect(storedMCQs).toEqual(mcqs);
    });
});