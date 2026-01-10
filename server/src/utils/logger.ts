import winston from 'winston';

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    format: winston.format.combine(
        winston.format.timestamp(),
        process.env.NODE_ENV === 'production' ? winston.format.json() : winston.format.simple()
    ),
    transports: [
        new winston.transports.Console()
    ],
});

export default logger;
