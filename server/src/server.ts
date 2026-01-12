import app from './index';
import logger from './utils/logger';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
