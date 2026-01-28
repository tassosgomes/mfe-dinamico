type LogMeta = Record<string, unknown>;

const baseLog = (level: string, message: string, meta?: LogMeta) => ({
  level,
  message,
  timestamp: new Date().toISOString(),
  ...(meta || {}),
});

export const logger = {
  info: (message: string, meta?: LogMeta) => {
    console.log(JSON.stringify(baseLog('info', message, meta)));
  },
  warn: (message: string, meta?: LogMeta) => {
    console.warn(JSON.stringify(baseLog('warn', message, meta)));
  },
  error: (message: string, error?: Error) => {
    console.error(
      JSON.stringify(
        baseLog('error', message, {
          error: error?.stack || error?.message,
        })
      )
    );
  },
};
