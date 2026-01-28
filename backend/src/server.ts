import express from 'express';
import helmet from 'helmet';
import { appConfig } from './config';
import { corsMiddleware } from './middleware/cors.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import { configRoutes } from './routes/config.routes';
import { healthRoutes } from './routes/health.routes';
import { logger } from './utils/logger';

const app = express();

app.use(helmet());
app.use(express.json());
app.use(corsMiddleware);

app.use(healthRoutes);
app.use(configRoutes);

app.use(errorMiddleware);

app.listen(appConfig.port, () => {
  logger.info('server_started', {
    port: appConfig.port,
    env: appConfig.env,
  });
});
