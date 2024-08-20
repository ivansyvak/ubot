"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const openai_service_1 = __importDefault(require("./openai.service"));
const log_service_1 = __importDefault(require("./log.service"));
const game_event_controller_1 = __importDefault(require("../controllers/game-event.controller"));
const moment_1 = __importDefault(require("moment"));
const ubot_config_1 = __importDefault(require("../ubot.config"));
const axios_1 = __importDefault(require("axios"));
const mime = __importStar(require("mime-types"));
const path = __importStar(require("path"));
const fs_service_1 = __importDefault(require("./fs.service"));
const form_data_1 = __importDefault(require("form-data"));
const storage_service_1 = __importDefault(require("./storage.service"));
const quizChannels = {
    '-1001344826818': { id: 'art42', name: '42' },
    '-1001717726506': { id: 'graj', name: 'ГРАЙ!' },
    '-1002249805451': { id: 'guzya', name: 'GUZYA QUIZ' }
};
const mainChannel = '-1001672460536';
class TGBotService {
    bot;
    static hasInstance = false;
    msgStorage;
    constructor(botToken) {
        if (TGBotService.hasInstance) {
            throw new Error('Cannot create multiple instances of TGBotService');
        }
        this.msgStorage = new storage_service_1.default('chat-messages');
        TGBotService.hasInstance = true;
        this.bot = new node_telegram_bot_api_1.default(botToken, { polling: true });
        this.bot.onText(/\/menu/, this.onMenu.bind(this));
        this.bot.on('callback_query', this.onCallbackQuery.bind(this));
        this.bot.on('photo', this.onPhoto.bind(this));
        this.bot.on('message', this.onMessage.bind(this));
    }
    async init() {
        // this.bot.sendMessage(mainChannel, 'Я обновілся і пєрєзапустілся! Слава Україні! 🇺🇦');    
        setInterval(async () => {
            const upcoming = await game_event_controller_1.default.upcomingGameEvents();
            const now = (0, moment_1.default)().format('YYYY-MM-DD');
            for (let row of upcoming) {
                if (row.kresNotified) {
                    continue;
                }
                const currentTime = (0, moment_1.default)().format('HH:mm');
                if (currentTime < '11:00') {
                    continue;
                }
                if (row.date == now) {
                    row.kresNotified = true;
                    await game_event_controller_1.default.updateGameEvent(row);
                    this.bot.sendMessage(mainChannel, `Сьогодні ${row.organization} ${row.topic} о ${row.time}. Єслі сєводня тєматічєская дрочь то, пані @chrszz, будєтє дєлать лого?`);
                }
            }
        }, 1000 * 60 * 60);
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
            const text = `[${d} ${gameEvent.time}] ${gameEvent.organization} ${gameEvent.topic}`;
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
        const text = await openai_service_1.default.generateCompletion(`Ти експерт в сленгу`, `Поясни в жартівливій формі що таке чіназес і як використовується це слово.`);
        if (query.message && text) {
            this.bot.sendMessage(query.message.chat.id, text);
        }
    }
    async onMessage(msg) {
        try {
            if (msg.text && msg.text.includes('@bookwa_bot ')) {
                await this.handleMention(msg);
                return;
            }
            if (msg.chat.id.toString() == mainChannel) {
                await this.updateMessageHistory(msg);
            }
            if (msg.forward_from_chat && quizChannels.hasOwnProperty(msg.forward_from_chat.id)) {
                await this.handleQuizChannelMessage(msg);
                return;
            }
        }
        catch (e) {
            log_service_1.default.error('Error in onMessage', e);
        }
    }
    async handleMention(msg) {
        const usrMessage = msg.text?.replace('@bookwa_bot', '').trim();
        let msgHistory = await this.msgStorage.list() || [];
        if (usrMessage == '') {
            return;
        }
        if (!Array.isArray(msgHistory)) {
            msgHistory = Object.values(msgHistory);
        }
        this.bot.sendMessage(msg.chat.id, 'Дайтє подумать', { reply_to_message_id: msg.message_id });
        this.bot.sendSticker(msg.chat.id, 'CAACAgIAAxkBAAICMWbDwa-xucSAEW_dS77xqLqLDPc_AALEMgACS_2JSN0h_UUCCS2eNQQ');
        const mentionResponse = await openai_service_1.default.generateChatCompletion(msgHistory, usrMessage || '');
        this.bot.sendMessage(msg.chat.id, mentionResponse, { reply_to_message_id: msg.message_id });
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
    async handleQuizPhoto(msg) {
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
        const imageResponse = await axios_1.default.get(fileLink, { responseType: 'arraybuffer' });
        const fileExtension = fileLink.split('.').pop() || 'jpg';
        const imageBuffer = Buffer.from(imageResponse.data, 'binary');
        if (imageBuffer.length > maxFileSize) {
            this.bot.sendMessage(msg.chat.id, 'Розмєр фоткі слішкам бальшой 😢😢😢. Треба не больше 1 Мб', { reply_to_message_id: msg.message_id });
            return;
        }
        const imagePath = path.join(`storage/temp_image.${fileExtension}`);
        await fs_service_1.default.writeFile(imagePath, imageBuffer);
        const ocrBaseURL = `https://api.ocr.space/parse/image`;
        const form = new form_data_1.default();
        form.append('apikey', ubot_config_1.default.ocrToken);
        form.append('language', 'rus');
        form.append('file', fs.createReadStream(imagePath));
        try {
            const ocrResponse = await axios_1.default.post(ocrBaseURL, form, {
                headers: form.getHeaders()
            });
            const ocrData = ocrResponse.data;
            if (ocrData && ocrData.ParsedResults && ocrData.ParsedResults.length) {
                const res = await openai_service_1.default.quizAnouncementToGameEvent(ocrData.ParsedResults[0].ParsedText);
                if (!res) {
                    this.bot.sendMessage(msg.chat.id, 'Пока шо тут всьо сложно.', { reply_to_message_id: msg.message_id });
                    return;
                }
                let gameEvent = JSON.parse(res);
                game_event_controller_1.default.fixGameEventDate(gameEvent);
                this.bot.sendMessage(msg.chat.id, res || "Пока шо тут всьо сложно.\n" + JSON.stringify(gameEvent), { reply_to_message_id: msg.message_id });
            }
        }
        catch (e) {
            console.error(e);
            this.bot.sendMessage(msg.chat.id, 'Шось пішло не так 😢😢😢', { reply_to_message_id: msg.message_id });
        }
    }
    async updateGameEvent(text, msg) {
    }
    getFileExtension(mimeType) {
        return mime.extension(mimeType) || 'jpg';
    }
    getInlineKeyboardForGameEvent(gameEvent) {
        return [
            [
                {
                    text: '📅 Добавіть в гугл калємдарь',
                    url: game_event_controller_1.default.getGoogleCalendarLink(gameEvent)
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
    getInlineKeyboardForMenu() {
        return [
            [{ text: '🗓️ Бліжайшиє квєзочкі', callback_data: 'upcoming_game_events' }],
            [
                { text: '🎤 Стендап', callback_data: 'standup' },
                { text: '🤙 Чіназес', callback_data: 'chinazes' }
            ]
        ];
    }
    async updateMessageHistory(msg) {
        const lastMessagaes = await this.msgStorage.list();
        let msgArray = Object.values(lastMessagaes);
        if (msgArray.length == 1000) {
            msgArray = msgArray.slice(1);
        }
        msgArray.push({ id: msg.message_id.toString(), message: msg.text || '', sender: msg.from });
        await this.msgStorage.updateStorage(msgArray);
    }
}
exports.default = new TGBotService(ubot_config_1.default.tgBotToken);
//# sourceMappingURL=tg-bot.service.js.map