// src/middleware/headers.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';

export interface UserHeadersType {
  printer?: string;
  workstation?: string;
  jwt?: string;
  decodedJwt?: {
    usid: number;
    userName: string;
    isAdmin: boolean;
    iat: number;
    exp: number;
  };
  count?: number;
}

@Injectable()
export class HeadersMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}
  use(req: Request, res: Response, next: NextFunction) {
    const printer = req.headers['printer'] as string;
    const workstation = req.headers['workstation'] as string;
    const jwt = req.headers['authorization']?.replace('Bearer ', '') || 
                req.headers['jwt'] as string;
    const count = req.headers['selected-count'] as string;

    let decodedJwt = null;

    if (jwt) {
      try {
        decodedJwt = this.jwtService.decode(jwt);
      } catch (error) {
        console.warn('JWT decoding failed, but continuing without authentication');
      }
    }
    console.log('Headers Middleware - printer:', printer, 'jwt:', jwt, 'workstation:', workstation, 'count:', count, 'decodedJwt:', decodedJwt);

    req['userHeaders'] = {
      printer,
      workstation,
      jwt,
      decodedJwt,
      count
    };

    next();
  }
}