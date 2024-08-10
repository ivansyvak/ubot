"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class LogService {
    log(message) {
        console.log(message);
    }
    error(message, error) {
        console.error(message);
        if (error) {
            console.error(error);
        }
    }
}
exports.default = new LogService();
//# sourceMappingURL=log.service.js.map