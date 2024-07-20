"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const openai_service_1 = __importDefault(require("./openai.service"));
const game_event_controller_1 = __importDefault(require("../controllers/game-event.controller"));
const moment_1 = __importDefault(require("moment"));
const quizChannels = {
    '-1001344826818': { id: 'art42', name: '42' },
    '-1001717726506': { id: 'graj', name: 'ГРАЙ!' }
};
class TGBotService {
    bot;
    static hasInstance = false;
    constructor(botToken) {
        if (TGBotService.hasInstance) {
            throw new Error('Cannot create multiple instances of TGBotService');
        }
        TGBotService.hasInstance = true;
        this.bot = new node_telegram_bot_api_1.default(botToken, { polling: true });
        this.bot.onText(/\/menu/, this.onMenu.bind(this));
        this.bot.on('callback_query', this.onCallbackQuery.bind(this));
        this.bot.on('photo', this.onPhoto.bind(this));
        this.bot.on('message', this.onMessage.bind(this));
    }
    onMenu(msg) {
        this.bot.sendMessage(msg.chat.id, 'Шо хочєш?', {
            reply_markup: {
                inline_keyboard: this.getInlineKeyboardForMenu()
            }
        });
    }
    async onCallbackQuery(query) {
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
    async upcomingGameEventsCallback(query) {
        this.bot.answerCallbackQuery(query.id, {
            callback_query_id: query.id
        });
        const gameEvents = await game_event_controller_1.default.upcomingGameEvents();
        const gameEventsArray = Object.values(gameEvents);
        if (!gameEventsArray.length) {
            query.message && this.bot.sendMessage(query.message.chat.id, 'Квєзочков нєту 😢😢😢');
            return;
        }
        const options = {};
        const inline_keyboard = [];
        for (let gameEvent of gameEventsArray) {
            const d = (0, moment_1.default)(new Date(gameEvent.date)).format('DD.MM');
            const text = `${d} ${gameEvent.time}: ${gameEvent.organization} ${gameEvent.topic}`;
            inline_keyboard.push([{
                    text,
                    url: game_event_controller_1.default.getGoogleCalendarLink(gameEvent)
                }]);
        }
        if (inline_keyboard.length) {
            options.reply_markup = { inline_keyboard };
        }
        query.message && this.bot.sendMessage(query.message.chat.id, 'Добавляй сєбє в калємдарь ', options);
    }
    async standupCallback(query) {
        const joke = await openai_service_1.default.generateJoke();
        this.bot.answerCallbackQuery(query.id, {
            callback_query_id: query.id
        });
        if (query.message) {
            this.bot.sendMessage(query.message.chat.id, joke || 'Жартів нєту 😢😢😢');
        }
    }
    async chinazesCallback(query) {
        this.bot.answerCallbackQuery(query.id, {
            callback_query_id: query.id
        });
        const text = await openai_service_1.default.generateCompletion(`Ти експерт в молодіжному сленгу, і ти любиш жартівливо пояснювати значення слів.`, `Поясни в жартівливій формі що таке чіназес і як використовується це слово.`);
        if (query.message && text) {
            this.bot.sendMessage(query.message.chat.id, text);
        }
    }
    onMessage(msg) {
        if (msg.forward_from_chat && quizChannels.hasOwnProperty(msg.forward_from_chat.id)) {
            this.handleQuizChannelMessage(msg);
            return;
        }
    }
    onPhoto(msg) {
        if (msg.caption && msg.caption.includes('/quiz')) {
            this.handleQuizPhoto(msg);
        }
    }
    validateQuizChannelMessage(msg) {
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
    async handleQuizChannelMessage(msg) {
        const orgId = msg.forward_from_chat?.id || '';
        const text = this.validateQuizChannelMessage(msg);
        const res = await openai_service_1.default.quizAnouncementToGameEvent(text);
        if (!res) {
            return;
        }
        let gameEvent = JSON.parse(res);
        gameEvent.organization = quizChannels[orgId].name;
        gameEvent.organizationId = quizChannels[orgId].id;
        game_event_controller_1.default.fixGameEventDate(gameEvent);
        const existingGameEvent = await game_event_controller_1.default.getGameEvent(game_event_controller_1.default.getKey(gameEvent));
        if (existingGameEvent) {
            this.bot.sendMessage(msg.chat.id, 'Іді нахуй, уже добавіл!', { reply_to_message_id: msg.message_id });
            return;
        }
        if (await game_event_controller_1.default.updateGameEvent(gameEvent)) {
            const options = {
                reply_to_message_id: msg.message_id,
                reply_markup: {
                    inline_keyboard: this.getInlineKeyboardForGameEvent(gameEvent)
                }
            };
            this.bot.sendMessage(msg.chat.id, 'Добавіл в локальний калємдарчік', options);
        }
    }
    handleQuizPhoto(msg) {
        console.log('Quiz photo');
    }
    init() {
        console.log('Драсті, с празнічком!');
    }
    getInlineKeyboardForGameEvent(gameEvent) {
        return [
            [
                {
                    text: '🗓️ Бліжайшиє квєзочкі',
                    callback_data: 'upcoming_game_events'
                },
                {
                    text: '📅 Добавіть в гугл калємдарь',
                    url: game_event_controller_1.default.getGoogleCalendarLink(gameEvent)
                }
            ]
        ];
    }
    getInlineKeyboardForMenu() {
        return [
            [{ text: '🗓️ Бліжайшиє квєзочкі', callback_data: 'upcoming_game_events' }],
            [
                { text: '🎤 Стендап', callback_data: 'standup' },
                { text: '🤙 Чіназес', callback_data: 'chinazes' }
            ]
        ];
    }
}
const tg_bot_token = (0, fs_1.readFileSync)('tokens/tg_bot_token', 'utf-8');
exports.default = new TGBotService(tg_bot_token);
//# sourceMappingURL=tg-bot.service.js.map