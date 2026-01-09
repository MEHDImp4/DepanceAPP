const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
    });

    if (!result.success) {
        const errors = result.error.issues || result.error.errors || [];
        const errorMessage = errors.length > 0
            ? errors.map(e => e.message).join(', ')
            : 'Validation failed';

        return res.status(400).json({ error: errorMessage });
    }

    next();
};

module.exports = validate;
