export class Topic {
    name: string;
    relatedMCQs: string[];

    constructor(name: string, relatedMCQs: string[] = []) {
        this.name = name;
        this.relatedMCQs = relatedMCQs;
    }
}