const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    // Log error for server-side debugging
    console.error(`[Error] ${req.method} ${req.url}`, err.stack);

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
