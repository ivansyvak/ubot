import { readFileSync } from 'fs';

class UBotConfig {
  isProduction = false;
  tgBotToken = '';
  openaiToken = '';

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';

    if (this.isProduction) {
      this.openaiToken = readFileSync('/opt/ubot/tokens/openai_token', 'utf-8');
      this.tgBotToken = readFileSync('/opt/ubot/tokens/tg_bot_token', 'utf-8');
    } else {
      this.openaiToken = readFileSync('tokens/openai_token', 'utf-8');
      this.tgBotToken = readFileSync('tokens/tg_bot_token', 'utf-8');
    }
  }
}

export default new UBotConfig();