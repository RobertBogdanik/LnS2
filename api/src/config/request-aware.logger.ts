import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { WinstonLogger } from './winston.logger';

@Injectable({ scope: Scope.REQUEST })
export class RequestAwareLogger {
  constructor(
    private readonly winstonLogger: WinstonLogger,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  private getRequestId(): string {
    return this.request?.['requestId'] || 'unknown';
  }

  private getMeta(additionalMeta?: any): any {
    return {
      requestId: this.getRequestId(),
      ip: this.request?.ip,
      method: this.request?.method,
      url: this.request?.originalUrl,
      userAgent: this.request?.get('user-agent'),
      ...additionalMeta,
    };
  }

  log(message: string, context?: string, meta?: any) {
    this.winstonLogger.log(message, context, this.getMeta(meta));
  }

  error(message: string, trace?: string, context?: string, meta?: any) {
    this.winstonLogger.error(message, trace, context, this.getMeta(meta));
  }

  warn(message: string, context?: string, meta?: any) {
    this.winstonLogger.warn(message, context, this.getMeta(meta));
  }

  debug(message: string, context?: string, meta?: any) {
    this.winstonLogger.debug(message, context, this.getMeta(meta));
  }

  verbose(message: string, context?: string, meta?: any) {
    this.winstonLogger.verbose(message, context, this.getMeta(meta));
  }
}