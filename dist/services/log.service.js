"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class LogService {
    log(message) {
        console.log(message);
    }
    error(message, error) {
        console.error(message);
    }
}
exports.default = new LogService();
//# sourceMappingURL=log.service.js.map