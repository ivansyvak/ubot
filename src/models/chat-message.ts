import TelegramBot from "node-telegram-bot-api";

export interface ChatMessage {
  id: string;
  message: string;
  sender: TelegramBot.User | undefined;
}
