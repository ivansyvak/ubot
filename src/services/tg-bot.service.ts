import * as fs from 'fs';

import TelegramBot from "node-telegram-bot-api";
import openaiService from './openai.service';
import logService from './log.service';
import { GameEvent } from '../models/game-event';
import gameEventController from '../controllers/game-event.controller';
import moment from 'moment';
import { Organization } from '../models/organization';
import ubotConfig from '../ubot.config';
import axios from 'axios';
import * as mime from 'mime-types';
import * as path from 'path';
import fsService from './fs.service';

import FormData from 'form-data';

const quizChannels: { [key: string]: Organization } = {
  '-1001344826818': { id: 'art42', name: '42' },
  '-1001717726506': { id: 'graj', name: 'ГРАЙ!' },
  '-1002249805451': { id: 'guzya', name: 'GUZYA QUIZ' }
};

const mainChannel = '-1001672460536';

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
        this.chinazesCallback(query);
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
      const text = `[${d} ${gameEvent.time}] ${gameEvent.organization} ${gameEvent.topic}`;

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

  private async chinazesCallback(query: TelegramBot.CallbackQuery) {
    this.bot.answerCallbackQuery(query.id, {
      callback_query_id: query.id
    });

    const text = await openaiService.generateCompletion(
      `Ти експерт в сленгу`, `Поясни в жартівливій формі що таке чіназес і як використовується це слово.`);

    if (query.message && text) {
      this.bot.sendMessage(query.message.chat.id, text);
    }
  }

  private onMessage(msg: TelegramBot.Message) {

    console.log(msg.chat.id);

    try {
      if (msg.forward_from_chat && quizChannels.hasOwnProperty(msg.forward_from_chat.id)) {
        this.handleQuizChannelMessage(msg);
        return;
      }
    } catch (e) {
      logService.error('Error in onMessage', e);
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

      case 'graj':
      case 'guzya': {
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

  private async handleQuizPhoto(msg: TelegramBot.Message) {
    if (!msg.photo) {
      this.bot.sendMessage(msg.chat.id, 'Фотка нєту 😢😢😢', { reply_to_message_id: msg.message_id });
      return;
    }

    const maxFileSize = 1048576;

    let pSize = msg.photo[msg.photo.length - 1];
    if (pSize.file_size && pSize.file_size > maxFileSize) {
      [...msg.photo].reverse().find((photo) => {
        if (photo.file_size && photo.file_size <= maxFileSize) {
          pSize = photo;
          return true;
        }
      });
    }

    const fileLink = await this.bot.getFileLink(pSize.file_id);
    const imageResponse = await axios.get(fileLink, { responseType: 'arraybuffer' });
    const fileExtension = fileLink.split('.').pop() || 'jpg';
    const imageBuffer = Buffer.from(imageResponse.data, 'binary');

    if (imageBuffer.length > maxFileSize) {
      this.bot.sendMessage(
        msg.chat.id, 'Розмєр фоткі слішкам бальшой 😢😢😢. Треба не больше 1 Мб', { reply_to_message_id: msg.message_id });
      return;
    }

    const imagePath = path.join(`storage/temp_image.${fileExtension}`);
    await fsService.writeFile(imagePath, imageBuffer);

    const ocrBaseURL = `https://api.ocr.space/parse/image`;

    const form = new FormData();
    form.append('apikey', ubotConfig.ocrToken);
    form.append('language', 'rus');
    form.append('file', fs.createReadStream(imagePath));

    try {
      const ocrResponse = await axios.post(ocrBaseURL, form, {
        headers: form.getHeaders()
      });

      const ocrData = ocrResponse.data;
      if (ocrData && ocrData.ParsedResults && ocrData.ParsedResults.length) {
        const res = await openaiService.quizAnouncementToGameEvent(ocrData.ParsedResults[0].ParsedText);
        if (!res) {
          this.bot.sendMessage(msg.chat.id, 'Пока шо тут всьо сложно.', { reply_to_message_id: msg.message_id });
          return;
        }

        let gameEvent: GameEvent = JSON.parse(res);
        gameEventController.fixGameEventDate(gameEvent);

        this.bot.sendMessage(msg.chat.id, res || "Пока шо тут всьо сложно.\n" + JSON.stringify(gameEvent), { reply_to_message_id: msg.message_id });
      }

    } catch (e) {
      console.error(e);
      this.bot.sendMessage(msg.chat.id, 'Шось пішло не так 😢😢😢', { reply_to_message_id: msg.message_id });
    }

  }

  private async updateGameEvent(text: string, msg: TelegramBot.Message) {

  }

  private getFileExtension(mimeType: string): string {
    return mime.extension(mimeType) || 'jpg';
  }

  public async init() {
    this.bot.sendMessage(mainChannel, 'Я обновілся і пєрєзапустілся! Слава Україні! 🇺🇦');    

    setInterval(async () => {
      const upcoming = await gameEventController.upcomingGameEvents();
      const now = moment().format('YYYY-MM-DD');      

      for (let row of upcoming) {       
        if (row.kresNotified) {
          continue;
        }

        const currentTime = moment().format('HH:mm');

        if (currentTime < '11:00') {
          continue;
        }
        
        if (row.date == now) {
          row.kresNotified = true;
          await gameEventController.updateGameEvent(row);

          this.bot.sendMessage(mainChannel, `Сьогодні ${row.organization} ${row.topic} о ${row.time}. Єслі сєводня тєматічєская дрочь то, пані @chrszz, будєтє дєлать лого?`);          
        }
      }
    }, 1000 * 60 * 60);
  }

  private getInlineKeyboardForGameEvent(gameEvent: GameEvent): TelegramBot.InlineKeyboardButton[][] {
    return [
      [
        {
          text: '📅 Добавіть в гугл калємдарь',
          url: gameEventController.getGoogleCalendarLink(gameEvent)
        }
      ],
      [
        {
          text: '🗓️ Бліжайшиє квєзочкі',
          callback_data: 'upcoming_game_events'
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

export default new TGBotService(ubotConfig.tgBotToken);
