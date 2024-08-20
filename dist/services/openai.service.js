"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = __importDefault(require("openai"));
const ubot_config_1 = __importDefault(require("../ubot.config"));
class OpenAIService {
    token;
    static hasInstance = false;
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
      Ти комік який жартує в стилі чорного гумору.
    `;
        const userPrompt = 'Придумай коротенький жарт';
        return this.generateCompletion(systemPrompt, userPrompt);
    }
    async generateChatCompletion(chatHistory, userPrompt) {
        const prompt = `
      Проаналізуй історію повідомлень яку надано в наступному повідомленні, і дай відповідь.        
      Якщо питання не стосується історії повідомлень, то відповідь має бути відповідно до контексту.`;
        const openai = new openai_1.default({ apiKey: this.token });
        const chatHistoryStr = chatHistory
            .map((chatMessage) => {
            if (chatMessage.sender) {
                return `Користувач: ${chatMessage.sender.username}; Повідомлення: ${chatMessage.message}`;
            }
            else {
                return `Повідомлення: ${chatMessage.message}`;
            }
        })
            .join('\n');
        const chatCompletion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: prompt
                },
                {
                    role: 'system',
                    content: chatHistoryStr
                },
                {
                    role: 'user',
                    content: userPrompt
                }
            ]
        });
        return chatCompletion.choices[0].message.content;
    }
    init() {
        console.log('Hello, OpenAI!');
    }
}
exports.default = new OpenAIService(ubot_config_1.default.openaiToken);
//# sourceMappingURL=openai.service.js.map