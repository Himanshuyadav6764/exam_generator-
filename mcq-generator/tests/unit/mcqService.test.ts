import { McqService } from '../../src/services/mcqService';
import { Mcq } from '../../src/models/mcq.model';

describe('McqService', () => {
    let mcqService: McqService;

    beforeEach(() => {
        mcqService = new McqService();
    });

    describe('createMcq', () => {
        it('should create a new MCQ', () => {
            const mcqData = {
                question: 'What is the capital of France?',
                options: ['Berlin', 'Madrid', 'Paris', 'Rome'],
                correctAnswer: 'Paris'
            };
            const mcq = mcqService.createMcq(mcqData);
            expect(mcq).toBeInstanceOf(Mcq);
            expect(mcq.question).toBe(mcqData.question);
            expect(mcq.options).toEqual(mcqData.options);
            expect(mcq.correctAnswer).toBe(mcqData.correctAnswer);
        });
    });

    describe('getMcq', () => {
        it('should retrieve an MCQ by ID', () => {
            const mcqData = {
                question: 'What is the capital of France?',
                options: ['Berlin', 'Madrid', 'Paris', 'Rome'],
                correctAnswer: 'Paris'
            };
            const mcq = mcqService.createMcq(mcqData);
            mcqService.addMcq(mcq); // Assuming there's a method to add MCQs

            const retrievedMcq = mcqService.getMcq(mcq.id);
            expect(retrievedMcq).toEqual(mcq);
        });
    });

    describe('getAllMcqs', () => {
        it('should return all MCQs', () => {
            const mcqData1 = {
                question: 'What is the capital of France?',
                options: ['Berlin', 'Madrid', 'Paris', 'Rome'],
                correctAnswer: 'Paris'
            };
            const mcqData2 = {
                question: 'What is 2 + 2?',
                options: ['3', '4', '5', '6'],
                correctAnswer: '4'
            };
            mcqService.createMcq(mcqData1);
            mcqService.createMcq(mcqData2);

            const allMcqs = mcqService.getAllMcqs();
            expect(allMcqs.length).toBe(2);
        });
    });

    describe('validateMcq', () => {
        it('should validate an MCQ', () => {
            const mcqData = {
                question: 'What is the capital of France?',
                options: ['Berlin', 'Madrid', 'Paris', 'Rome'],
                correctAnswer: 'Paris'
            };
            const mcq = mcqService.createMcq(mcqData);
            const isValid = mcqService.validateMcq(mcq);
            expect(isValid).toBe(true);
        });
    });
});