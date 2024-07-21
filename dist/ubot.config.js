"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
class UBotConfig {
    constructor() {
        this.isProduction = false;
        this.tgBotToken = '';
        this.openaiToken = '';
        this.isProduction = process.env.NODE_ENV === 'production';
        if (this.isProduction) {
            this.openaiToken = (0, fs_1.readFileSync)('/opt/ubot/tokens/openai_token', 'utf-8');
            this.tgBotToken = (0, fs_1.readFileSync)('/opt/ubot/tokens/tg_bot_token', 'utf-8');
        }
        else {
            this.openaiToken = (0, fs_1.readFileSync)('tokens/openai_token', 'utf-8');
            this.tgBotToken = (0, fs_1.readFileSync)('tokens/tg_bot_token', 'utf-8');
        }
    }
}
exports.default = new UBotConfig();
//# sourceMappingURL=ubot.config.js.map