// src/guards/jwt.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['authorization']?.replace('Bearer ', '') || 
                 request.headers['jwt'];

    if (!token) {
      throw new UnauthorizedException('Token JWT wymagany');
    }

    try {
      const decoded = this.jwtService.verify(token);
      request.user = decoded; // Dodanie decoded payload do request
      return true;
    } catch (error) {
      throw new UnauthorizedException('Nieprawidłowy token JWT');
    }
  }
}