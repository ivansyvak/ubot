import tgBotService from './services/tg-bot.service';

main();

async function main() {
  await tgBotService.init();
}