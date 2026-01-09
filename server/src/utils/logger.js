const winston = require('winston');



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

// Optional: Add file transport only in dev if really needed, but generally avoid in Docker
if (process.env.NODE_ENV !== 'production') {
    // logger.add(new winston.transports.File({ filename: 'logs/combined.log' }));
}

module.exports = logger;
