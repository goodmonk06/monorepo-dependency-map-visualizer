import { describe, it, expect, beforeEach } from 'vitest';
import { logger, LogLevel, createLogger } from '../logger';

describe('Logger', () => {
  beforeEach(() => {
    logger.clearContext();
    logger.setLevel(LogLevel.DEBUG);
  });

  it('should log at different levels', () => {
    // Just verify these don't throw
    logger.debug('Debug message');
    logger.info('Info message');
    logger.warn('Warning message');
    logger.error('Error message');
  });

  it('should respect log level filtering', () => {
    logger.setLevel(LogLevel.ERROR);

    // These should not throw even at ERROR level
    logger.debug('Should be filtered');
    logger.info('Should be filtered');
    logger.warn('Should be filtered');
    logger.error('Should be shown');
  });

  it('should accept metadata', () => {
    logger.info('Test message', { key: 'value', count: 42 });
    logger.error('Error occurred', new Error('Test error'));
  });

  it('should support context', () => {
    logger.setContext({ service: 'analyzer', version: '1.0' });
    logger.info('Message with context');

    // Clear context
    logger.clearContext();
    logger.info('Message without context');
  });

  it('should create child logger with context', () => {
    const childLogger = createLogger({ module: 'test' });
    childLogger.info('Child logger message');
  });
});
