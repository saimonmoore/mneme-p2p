type Level = 'debug' | 'info' | 'log' | 'warn' | 'error';

const levels: Record<Level, number> = {
  debug: 0,
  info: 1,
  log: 1,
  warn: 2,
  error: 3,
};

type Logger = Console & { level: Level };

const getLogger = (level: Level) => {
  const logger = new Proxy(console, {
    get(target: Logger, prop: Level, receiver) {
      if (levels[prop] < levels[target.level]) {
        return () => {};
      }

      return Reflect.get(target, prop, receiver);
    },
    set(target: Logger, prop, value) {
      if (prop === 'level') {
        target.level = value;
      }

      return true;
    },
  }) as Logger;

  logger.level = level;

  return logger;
};

const logger = getLogger(process.env.NODE_ENV === 'test' ? 'error' : 'debug');

export { logger, getLogger };
