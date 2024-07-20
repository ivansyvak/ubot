"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const storage_service_1 = __importDefault(require("../services/storage.service"));
class GameEventController {
    storage;
    constructor() {
        this.storage = new storage_service_1.default('game-events');
    }
    getKey(value) {
        return `${value.organizationId}_${value.date}`;
    }
    async getGameEvent(key) {
        return this.storage.get(key);
    }
    setGameEvent(value) {
        const key = this.getKey(value);
        return this.storage.set(key, value);
    }
    async updateGameEvent(value) {
        if (!value.date || !value.time || !value.organization) {
            return false;
        }
        return this.setGameEvent(value);
    }
    listGameEvents() {
        return this.storage.list();
    }
    async upcomingGameEvents() {
        const gameEvents = await this.listGameEvents();
        return Object.values(gameEvents).filter((gameEvent) => {
            const eventDate = new Date(gameEvent.date + 'T' + gameEvent.time);
            const now = new Date();
            return eventDate > now;
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