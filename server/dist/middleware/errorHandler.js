"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const errorHandler = (err, req, res, _next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    // Log error using Winston
    logger_1.default.error(`${req.method} ${req.url} - ${err.message}`, { stack: err.stack });
    res.status(statusCode).json({
        error: process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : err.message,
        stack: process.env.NODE_ENV === 'production'
            ? undefined
            : err.stack
    });
};
exports.default = errorHandler;
//# sourceMappingURL=errorHandler.js.map