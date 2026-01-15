"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("./index"));
const logger_1 = __importDefault(require("./utils/logger"));
const PORT = process.env.PORT || 3001;
index_1.default.listen(PORT, () => {
    logger_1.default.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
//# sourceMappingURL=server.js.map