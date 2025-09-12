import { Injectable } from '@nestjs/common';
import { createLogger, format, transports, Logger } from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import * as path from 'path';

@Injectable()
export class WinstonLogger {
  private logger: Logger;

  constructor() {
    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.json(),
      ),
      defaultMeta: { service: 'nestjs-app' },
      transports: [
        // Dzienne pliki logów
        new DailyRotateFile({
          filename: path.join('logs', 'application-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '30d',
          format: format.combine(
            format.timestamp(),
            format.json(),
          ),
        }),
        // Logi błędów
        new DailyRotateFile({
          filename: path.join('logs', 'error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '30d',
          format: format.combine(
            format.timestamp(),
            format.json(),
          ),
        }),
        // Konsola (development)
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.timestamp(),
            format.printf(({ timestamp, level, message, context, requestId, ...meta }) => {
              return `[${timestamp}] [${level}] [${context || 'App'}]${requestId ? ` [${requestId}]` : ''}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
            }),
          ),
        }),
      ],
    });
  }

  log(message: string, context?: string, meta?: any) {
    this.logger.info(message, { context, ...meta });
  }

  error(message: string, trace?: string, context?: string, meta?: any) {
    this.logger.error(message, { trace, context, ...meta });
  }

  warn(message: string, context?: string, meta?: any) {
    this.logger.warn(message, { context, ...meta });
  }

  debug(message: string, context?: string, meta?: any) {
    this.logger.debug(message, { context, ...meta });
  }

  verbose(message: string, context?: string, meta?: any) {
    this.logger.verbose(message, { context, ...meta });
  }

  getLogger(): Logger {
    return this.logger;
  }
}