"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const openai_1 = __importDefault(require("openai"));
class OpenAIService {
    constructor(token) {
        this.token = token;
        if (OpenAIService.hasInstance) {
            throw new Error('Cannot create multiple instances of OpenAIService');
        }
        OpenAIService.hasInstance = true;
    }
    async generateCompletion(systemPrompt, userPrompt) {
        const openai = new openai_1.default({ apiKey: this.token });
        const chatCompletion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: userPrompt
                }
            ]
        });
        return chatCompletion.choices[0].message.content;
    }
    async quizAnouncementToGameEvent(quizAnouncement) {
        const systemPrompt = `
      Тобі потрібно проаналізувати текс, визначити чи є це анонсом квізу, і якщо так - визначити назву організації (якщо не вдалося то назву гри), дату та час проведення, тему гри.
      Рік визначати не треба, він має відповідати поточному року.
      Якщо рік гри менше поточного, то замінити його на поточний.
      Дата та час обов'язково мають бути в форматі "YYYY-MM-DD" та "HH:MM" відповідно.
      Формат відповіді має бути в форматі JSON, наприклад: {"organization": "Art42", "date": "2024-02-22", "time": "22:22", "topic": "Тема гри"}
    `;
        return this.generateCompletion(systemPrompt, quizAnouncement);
    }
    async generateJoke() {
        const systemPrompt = `
      Ти комік який жартує в стилі Dad Jokes.
    `;
        const userPrompt = 'Придумай коротенький жарт';
        return this.generateCompletion(systemPrompt, userPrompt);
    }
    init() {
        console.log('Hello, OpenAI!');
    }
}
OpenAIService.hasInstance = false;
const openai_token = (0, fs_1.readFileSync)('tokens/openai_token', 'utf-8').trim();
exports.default = new OpenAIService(openai_token);
//# sourceMappingURL=openai.service.js.map