export class McqService {
    private mcqs: Array<any>;

    constructor() {
        this.mcqs = [];
    }

    createMcq(question: string, options: Array<string>, correctAnswer: string): void {
        const mcq = {
            question,
            options,
            correctAnswer
        };
        this.mcqs.push(mcq);
    }

    getAllMcqs(): Array<any> {
        return this.mcqs;
    }

    getMcqByIndex(index: number): any {
        return this.mcqs[index] || null;
    }

    validateMcq(index: number): boolean {
        const mcq = this.getMcqByIndex(index);
        if (!mcq) return false;

        const { question, options, correctAnswer } = mcq;
        return question.length > 0 && options.length > 1 && options.includes(correctAnswer);
    }

    deleteMcq(index: number): boolean {
        if (index < 0 || index >= this.mcqs.length) return false;
        this.mcqs.splice(index, 1);
        return true;
    }
}