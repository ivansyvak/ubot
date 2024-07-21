"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = __importDefault(require("openai"));
const ubot_config_1 = __importDefault(require("../ubot.config"));
class OpenAIService {
    constructor(token) {
        this.token = token;
        if (OpenAIService.hasInstance) {
            throw new Error('Cannot create multiple instances of OpenAIService');
        }
        OpenAIService.hasInstance = true;
    }
    generateCompletion(systemPrompt, userPrompt) {
        return __awaiter(this, void 0, void 0, function* () {
            const openai = new openai_1.default({ apiKey: this.token });
            const chatCompletion = yield openai.chat.completions.create({
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
        });
    }
    quizAnouncementToGameEvent(quizAnouncement) {
        return __awaiter(this, void 0, void 0, function* () {
            const systemPrompt = `
      Тобі потрібно проаналізувати текс, визначити чи є це анонсом квізу, і якщо так - визначити назву організації (якщо не вдалося то назву гри), дату та час проведення, тему гри.
      Рік визначати не треба, він має відповідати поточному року.
      Якщо рік гри менше поточного, то замінити його на поточний.
      Дата та час обов'язково мають бути в форматі "YYYY-MM-DD" та "HH:MM" відповідно.
      Формат відповіді має бути в форматі JSON, наприклад: {"organization": "Art42", "date": "2024-02-22", "time": "22:22", "topic": "Тема гри"}
    `;
            return this.generateCompletion(systemPrompt, quizAnouncement);
        });
    }
    generateJoke() {
        return __awaiter(this, void 0, void 0, function* () {
            const systemPrompt = `
      Ти комік який жартує в стилі Dad Jokes.
    `;
            const userPrompt = 'Придумай коротенький жарт';
            return this.generateCompletion(systemPrompt, userPrompt);
        });
    }
    init() {
        console.log('Hello, OpenAI!');
    }
}
OpenAIService.hasInstance = false;
exports.default = new OpenAIService(ubot_config_1.default.openaiToken);
//# sourceMappingURL=openai.service.js.map