"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), process.env.NODE_ENV === 'production' ? winston_1.default.format.json() : winston_1.default.format.simple()),
    transports: [
        new winston_1.default.transports.Console()
    ],
});
exports.default = logger;
//# sourceMappingURL=logger.js.map