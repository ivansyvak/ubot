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
const storage_service_1 = __importDefault(require("../services/storage.service"));
class GameEventController {
    constructor() {
        this.storage = new storage_service_1.default('game-events');
    }
    getKey(value) {
        return `${value.organizationId}_${value.date}`;
    }
    getGameEvent(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.storage.get(key);
        });
    }
    setGameEvent(value) {
        const key = this.getKey(value);
        return this.storage.set(key, value);
    }
    updateGameEvent(value) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!value.date || !value.time || !value.organization) {
                return false;
            }
            return this.setGameEvent(value);
        });
    }
    listGameEvents() {
        return this.storage.list();
    }
    upcomingGameEvents() {
        return __awaiter(this, void 0, void 0, function* () {
            const gameEvents = yield this.listGameEvents();
            return Object.values(gameEvents)
                .filter((gameEvent) => {
                const eventDate = new Date(gameEvent.date + 'T' + gameEvent.time);
                const now = new Date();
                return eventDate > now;
            })
                .sort((a, b) => {
                return (a.date + a.time) > (b.date + b.time) ? 1 : -1;
            });
        });
    }
    getGoogleCalendarLink(gameEvent) {
        const base = 'https://calendar.google.com/calendar/r/eventedit';
        const date = gameEvent.date.replace(/-/g, '');
        const time = gameEvent.time.replace(/:/g, '');
        const params = new URLSearchParams({
            text: gameEvent.organization + ' ' + gameEvent.topic,
            dates: `${date}T${time}/${date}T${time}`,
            details: gameEvent.organization + ' ' + gameEvent.topic
        });
        return `${base}?${params.toString()}`;
    }
    fixGameEventDate(gameEvent) {
        gameEvent.date = gameEvent.date.replace(/(\d{4})-(\d{2})-(\d{2})/, (_, year, month, day) => {
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;
            const currentDay = now.getDate();
            if (parseInt(year) < currentYear) {
                return `${currentYear}-${month}-${day}`;
            }
            return `${year}-${month}-${day}`;
        });
    }
}
exports.default = new GameEventController();
//# sourceMappingURL=game-event.controller.js.map