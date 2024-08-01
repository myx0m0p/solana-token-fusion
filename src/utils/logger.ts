import { pino } from 'pino';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

export const logInfo = (msg: string, payload = {}) => {
  logger.info(payload, msg);
};

export const logError = (msg: string, payload = {}) => {
  logger.error(payload, msg);
};

export const AppLogger = {
  info: logInfo,
  error: logError,
};
