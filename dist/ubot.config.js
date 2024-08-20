"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
class UBotConfig {
    isProduction = false;
    tgBotToken = '';
    openaiToken = '';
    ocrToken = '';
    constructor() {
        this.isProduction = process.env.NODE_ENV === 'production';
        if (this.isProduction) {
            this.openaiToken = (0, fs_1.readFileSync)('/opt/ubot/tokens/openai_token', 'utf-8');
            this.tgBotToken = (0, fs_1.readFileSync)('/opt/ubot/tokens/tg_bot_token', 'utf-8');
            this.ocrToken = (0, fs_1.readFileSync)('/opt/ubot/tokens/ocr_token', 'utf-8');
        }
        else {
            this.openaiToken = (0, fs_1.readFileSync)('tokens/openai_token', 'utf-8');
            this.tgBotToken = (0, fs_1.readFileSync)('tokens/tg_bot_token', 'utf-8');
            this.ocrToken = (0, fs_1.readFileSync)('tokens/ocr_token', 'utf-8');
        }
    }
}
exports.default = new UBotConfig();
//# sourceMappingURL=ubot.config.js.map