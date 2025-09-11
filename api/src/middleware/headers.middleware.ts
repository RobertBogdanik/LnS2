// src/middleware/headers.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface UserHeadersType {
  printer?: string;
  workstation?: string;
  jwt?: string;
}

@Injectable()
export class HeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const printer = req.headers['printer'] as string;
    const workstation = req.headers['workstation'] as string;
    const jwt = req.headers['authorization']?.replace('Bearer ', '') || 
                req.headers['jwt'] as string;

    req['userHeaders'] = {
      printer,
      workstation,
      jwt
    };

    next();
  }
}