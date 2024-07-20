import { GameEvent } from "../models/game-event";
import StorageService from "../services/storage.service";

class GameEventController {

  private storage: StorageService<GameEvent>;

  constructor() {
    this.storage = new StorageService('game-events');
  }

  public getKey(value: GameEvent) {
    return `${value.organizationId}_${value.date}`;
  }

  public async getGameEvent(key: string) {
    return this.storage.get(key);
  }

  public setGameEvent(value: GameEvent) {
    const key = this.getKey(value);
    
    return this.storage.set(key, value);
  }

  public async updateGameEvent(value: GameEvent) {
    if (!value.date || !value.time || !value.organization) {
      return false;
    }

    return this.setGameEvent(value);
  }

  public listGameEvents() {
    return this.storage.list();
  }

  public async upcomingGameEvents() {
    const gameEvents = await this.listGameEvents();

    return Object.values(gameEvents).filter((gameEvent) => {
      const eventDate = new Date(gameEvent.date + 'T' + gameEvent.time);
      const now = new Date();

      return eventDate > now;
    });
  }

  public getGoogleCalendarLink(gameEvent: GameEvent) {
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

  public fixGameEventDate(gameEvent: GameEvent) {
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

export default new GameEventController();
