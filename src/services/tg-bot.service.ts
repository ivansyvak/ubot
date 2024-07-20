import { readFileSync } from 'fs';

import TelegramBot from "node-telegram-bot-api";
import openaiService from './openai.service';
import logService from './log.service';
import { GameEvent } from '../models/game-event';
import gameEventController from '../controllers/game-event.controller';
import moment from 'moment';
import { Organization } from '../models/organization';

const quizChannels: { [key: string]: Organization } = {
  '-1001344826818': { id: 'art42', name: '42' },
  '-1001717726506': { id: 'graj', name: 'ГРАЙ!' }
};

class TGBotService {
  private bot: TelegramBot;

  private static hasInstance = false;

  constructor(botToken: string) {
    if (TGBotService.hasInstance) {
      throw new Error('Cannot create multiple instances of TGBotService');
    }

    TGBotService.hasInstance = true;

    this.bot = new TelegramBot(botToken, { polling: true });

    this.bot.onText(/\/menu/, this.onMenu.bind(this));

    this.bot.on('callback_query', this.onCallbackQuery.bind(this));
    this.bot.on('photo', this.onPhoto.bind(this));
    this.bot.on('message', this.onMessage.bind(this));

  }

  private onMenu(msg: TelegramBot.Message) {
    this.bot.sendMessage(msg.chat.id, 'Шо хочєш?', {
      reply_markup: {
        inline_keyboard: this.getInlineKeyboardForMenu()
      }
    });
  }

  private async onCallbackQuery(query: TelegramBot.CallbackQuery) {
    switch (query.data) {
      case 'upcoming_game_events': {
        this.upcomingGameEventsCallback(query);
        break;
      }

      case 'standup': {
        this.standupCallback(query);
        break;
      }

      case 'chinazes': {
        this.bot.answerCallbackQuery(query.id, {
          callback_query_id: query.id
        });

        if (query.message) {
          this.bot.sendMessage(query.message.chat.id, 'Хуйня, нєту чіназес 😢😢😢');
        }
        break;
      }

    }
  }

  private async upcomingGameEventsCallback(query: TelegramBot.CallbackQuery) {
    this.bot.answerCallbackQuery(query.id, {
      callback_query_id: query.id
    });

    const gameEvents = await gameEventController.upcomingGameEvents();
    const gameEventsArray = Object.values(gameEvents);

    if (!gameEventsArray.length) {
      query.message && this.bot.sendMessage(query.message.chat.id, 'Квєзочков нєту 😢😢😢');
      
      return;
    }

    const options: TelegramBot.SendMessageOptions = {};
    const inline_keyboard: TelegramBot.InlineKeyboardButton[][] = [];

    for (let gameEvent of gameEventsArray) {
      const d = moment(new Date(gameEvent.date)).format('DD.MM');
      const text = `${d} ${gameEvent.time}: ${gameEvent.organization} ${gameEvent.topic}`;

      inline_keyboard.push([{
        text,
        url: gameEventController.getGoogleCalendarLink(gameEvent)
      }]);
    }

    if (inline_keyboard.length) {
      options.reply_markup = { inline_keyboard };
    }

    query.message && this.bot.sendMessage(query.message.chat.id, 'Добавляй сєбє в калємдарь ', options);

  }

  private async standupCallback(query: TelegramBot.CallbackQuery) {
    const joke = await openaiService.generateJoke();

    this.bot.answerCallbackQuery(query.id, {
      callback_query_id: query.id
    });

    if (query.message) {
      this.bot.sendMessage(query.message.chat.id, joke || 'Жартів нєту 😢😢😢');
    }
  }

  private onMessage(msg: TelegramBot.Message) {
    if (msg.forward_from_chat && quizChannels.hasOwnProperty(msg.forward_from_chat.id)) {
      this.handleQuizChannelMessage(msg);
      return;
    }
  }

  private onPhoto(msg: TelegramBot.Message) {
    if (msg.caption && msg.caption.includes('/quiz')) {
      this.handleQuizPhoto(msg);
    }
  }


  private validateQuizChannelMessage(msg: TelegramBot.Message) {
    const orgId = msg.forward_from_chat?.id;
    if (!orgId) {
      throw new Error('No orgId');
    }

    let text = '';

    switch (quizChannels[orgId].id) {
      case 'art42': {
        text = msg.text || '';
        break;
      }

      case 'graj': {
        text = msg.caption || '';
        break;
      }
    }

    if (!text) {
      throw new Error('No text');
    }

    return text;
  }

  private async handleQuizChannelMessage(msg: TelegramBot.Message) {
    const orgId = msg.forward_from_chat?.id || '';
    const text = this.validateQuizChannelMessage(msg);

    const res = await openaiService.quizAnouncementToGameEvent(text);

    if (!res) {
      return;
    }

    let gameEvent: GameEvent = JSON.parse(res);
    gameEvent.organization = quizChannels[orgId].name;
    gameEvent.organizationId = quizChannels[orgId].id;

    gameEventController.fixGameEventDate(gameEvent);

    const existingGameEvent = await gameEventController.getGameEvent(gameEventController.getKey(gameEvent));
    if (existingGameEvent) {
      this.bot.sendMessage(msg.chat.id, 'Іді нахуй, уже добавіл!', { reply_to_message_id: msg.message_id });
      return;
    }

    if (await gameEventController.updateGameEvent(gameEvent)) {
      const options: TelegramBot.SendMessageOptions = {
        reply_to_message_id: msg.message_id,
        reply_markup: {
          inline_keyboard: this.getInlineKeyboardForGameEvent(gameEvent)
        }
      };

      this.bot.sendMessage(msg.chat.id, 'Добавіл в локальний калємдарчік', options);
    }
  }

  private handleQuizPhoto(msg: TelegramBot.Message) {
    console.log('Quiz photo');
  }

  public init() {
    console.log('Драсті, с празнічком!');
  }

  private getInlineKeyboardForGameEvent(gameEvent: GameEvent): TelegramBot.InlineKeyboardButton[][] {
    return [
      [
        {
          text: '🗓️ Бліжайшиє квєзочкі',
          callback_data: 'upcoming_game_events'
        },
        {
          text: '📅 Добавіть в гугл калємдарь',
          url: gameEventController.getGoogleCalendarLink(gameEvent)
        }
      ]
    ];
  }

  private getInlineKeyboardForMenu(): TelegramBot.InlineKeyboardButton[][] {
    return [
      [{ text: '🗓️ Бліжайшиє квєзочкі', callback_data: 'upcoming_game_events' }],
      [
        { text: '🎤 Стендап', callback_data: 'standup' },
        { text: '🤙 Чіназес', callback_data: 'chinazes' }
      ]
    ];
  }

}


const tg_bot_token = readFileSync('tokens/tg_bot_token', 'utf-8');

export default new TGBotService(tg_bot_token);