import cors from 'cors';
import { appConfig } from '../config';
import { HttpError } from './error.middleware';

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (appConfig.corsOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(
      new HttpError(403, 'cors_not_allowed', 'Origin not allowed', 'CORS_NOT_ALLOWED')
    );
  },
  credentials: true,
});
