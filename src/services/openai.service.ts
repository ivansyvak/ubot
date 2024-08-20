import { readFileSync } from 'fs';

import OpenAI from 'openai';
import ubotConfig from '../ubot.config';
import { ChatMessage } from '../models/chat-message';

class OpenAIService {
  private static hasInstance = false;


  constructor(private token: string) {
    if (OpenAIService.hasInstance) {
      throw new Error('Cannot create multiple instances of OpenAIService');
    }

    OpenAIService.hasInstance = true;
  }

  public async generateCompletion(systemPrompt: string, userPrompt: string) {
    const openai = new OpenAI({ apiKey: this.token });

    const chatCompletion: OpenAI.Chat.ChatCompletion = await openai.chat.completions.create({
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

  public async quizAnouncementToGameEvent(quizAnouncement: string) {
    const systemPrompt = `
      Тобі потрібно проаналізувати текс, визначити чи є це анонсом квізу, і якщо так - визначити назву організації (якщо не вдалося то назву гри), дату та час проведення, тему гри.
      Рік визначати не треба, він має відповідати поточному року.
      Якщо рік гри менше поточного, то замінити його на поточний.
      Дата та час обов'язково мають бути в форматі "YYYY-MM-DD" та "HH:MM" відповідно.
      Формат відповіді має бути в форматі JSON, наприклад: {"organization": "Art42", "date": "2024-02-22", "time": "22:22", "topic": "Тема гри"}
    `;

    return this.generateCompletion(systemPrompt, quizAnouncement);
  }

  public async generateJoke() {
    const systemPrompt = `
      Ти комік який жартує в стилі чорного гумору.
    `;

    const userPrompt = 'Придумай коротенький жарт';

    return this.generateCompletion(systemPrompt, userPrompt);
  }

  public async generateChatCompletion(chatHistory: Array<ChatMessage>, userPrompt: string) {
    const prompt = `
      Проаналізуй історію повідомлень яку надано в наступному повідомленні, і дай відповідь.        
      Якщо питання не стосується історії повідомлень, то відповідь має бути відповідно до контексту.`;

    const openai = new OpenAI({ apiKey: this.token });

    const chatHistoryStr = chatHistory
      .map((chatMessage) => {
        if (chatMessage.sender) {
          return `Користувач: ${chatMessage.sender.username}; Повідомлення: ${chatMessage.message}`;
        } else {
          return `Повідомлення: ${chatMessage.message}`;
        }
      })
      .join('\n');

      const chatCompletion: OpenAI.Chat.ChatCompletion = await openai.chat.completions.create({
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

  public init() {
    console.log('Hello, OpenAI!');
  }
}

export default new OpenAIService(ubotConfig.openaiToken);
