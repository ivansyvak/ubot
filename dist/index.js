"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tg_bot_service_1 = __importDefault(require("./services/tg-bot.service"));
main();
async function main() {
    await tg_bot_service_1.default.init();
}
//# sourceMappingURL=index.js.map