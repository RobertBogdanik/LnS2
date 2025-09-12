// src/interceptors/logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WinstonLogger } from '../config/winston.logger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly winstonLogger: WinstonLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    
    const requestId = request['requestId'] || 'unknown';
    const { method, url, body, query, params, headers } = request;
    
    this.winstonLogger.log(`Incoming Request: ${method} ${url}`, 'HTTP', {
      requestId,
      method,
      url,
      body: this.sanitizeBody(body),
      query,
      params,
      contentType: headers['content-type'],
    });

    const startTime = Date.now();
    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = httpContext.getResponse();
          const duration = Date.now() - startTime;
          
          this.winstonLogger.log(
            `Response: ${method} ${url} ${response.statusCode} - ${duration}ms`,
            'HTTP',
            { 
              requestId,
              statusCode: response.statusCode, 
              duration 
            }
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.winstonLogger.error(
            `Error: ${method} ${url} - ${error.message} - ${duration}ms`,
            error.stack,
            'HTTP',
            { 
              requestId,
              error: error.name, 
              statusCode: error.status 
            }
          );
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'creditCard', 'cvv'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });
    
    return sanitized;
  }
}