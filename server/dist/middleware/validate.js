"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validate = (schema) => {
    return (req, res, next) => {
        const data = {
            body: req.body,
            query: req.query,
            params: req.params,
        };
        const result = schema.safeParse(data);
        if (!result.success) {
            const zodError = result.error;
            const errors = zodError.issues || [];
            const errorMessage = errors.length > 0
                ? errors.map(e => e.message).join(', ')
                : 'Validation failed';
            res.status(400).json({ error: errorMessage });
            return;
        }
        next();
    };
};
exports.default = validate;
//# sourceMappingURL=validate.js.map