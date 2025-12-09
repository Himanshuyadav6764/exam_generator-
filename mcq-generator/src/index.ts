import express from 'express';
import { json } from 'body-parser';
import { McqGeneratorAgent } from './agents/mcqGeneratorAgent';
import { QuestionValidatorAgent } from './agents/questionValidatorAgent';
import { AiModelService } from './services/aiModelService';
import { McqService } from './services/mcqService';
import { EvaluationService } from './services/evaluationService';
import { aiConfig } from './config/aiConfig';

const app = express();
const port = process.env.PORT || 3000;

app.use(json());

const mcqGeneratorAgent = new McqGeneratorAgent(new AiModelService());
const questionValidatorAgent = new QuestionValidatorAgent();

app.post('/generate-mcq', async (req, res) => {
    try {
        const { topic, prompt } = req.body;
        const mcq = await mcqGeneratorAgent.generateMCQ(topic, prompt);
        res.status(200).json(mcq);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/validate-question', async (req, res) => {
    try {
        const { question } = req.body;
        const isValid = await questionValidatorAgent.validate(question);
        res.status(200).json({ isValid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`MCQ Generator app listening at http://localhost:${port}`);
});