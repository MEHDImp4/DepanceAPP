const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    // Log error using Winston
    logger.error(`${req.method} ${req.url} - ${err.message}`, { stack: err.stack });

    res.status(statusCode).json({
        error: process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : err.message,
        stack: process.env.NODE_ENV === 'production'
            ? null
            : err.stack
    });
};

module.exports = errorHandler;
