/**
 * Structured logging utility for consistent logging across the application
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  [key: string]: any;
}

class Logger {
  private level: LogLevel = LogLevel.INFO;
  private context: LogContext = {};

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  clearContext(): void {
    this.context = {};
  }

  debug(message: string, meta?: LogContext): void {
    if (this.level <= LogLevel.DEBUG) {
      this.log('DEBUG', message, meta);
    }
  }

  info(message: string, meta?: LogContext): void {
    if (this.level <= LogLevel.INFO) {
      this.log('INFO', message, meta);
    }
  }

  warn(message: string, meta?: LogContext): void {
    if (this.level <= LogLevel.WARN) {
      this.log('WARN', message, meta);
    }
  }

  error(message: string, error?: Error | LogContext, meta?: LogContext): void {
    if (this.level <= LogLevel.ERROR) {
      const errorMeta = error instanceof Error
        ? { error: { message: error.message, stack: error.stack }, ...meta }
        : { ...error, ...meta };
      this.log('ERROR', message, errorMeta);
    }
  }

  private log(level: string, message: string, meta?: LogContext): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...this.context,
      ...meta,
    };

    // In production, you'd send this to a logging service
    // For now, we format it nicely for console
    const formatted = this.format(logEntry);

    switch (level) {
      case 'ERROR':
        console.error(formatted);
        break;
      case 'WARN':
        console.warn(formatted);
        break;
      case 'DEBUG':
        console.debug(formatted);
        break;
      default:
        console.log(formatted);
    }
  }

  private format(entry: any): string {
    const { timestamp, level, message, ...rest } = entry;
    const prefix = `[${timestamp}] ${level.padEnd(5)} ${message}`;

    if (Object.keys(rest).length > 0) {
      return `${prefix} ${JSON.stringify(rest)}`;
    }

    return prefix;
  }
}

/**
 * Global logger instance
 */
export const logger = new Logger();

/**
 * Create a child logger with additional context
 */
export function createLogger(context: LogContext): Logger {
  const childLogger = new Logger();
  childLogger.setContext(context);
  return childLogger;
}
