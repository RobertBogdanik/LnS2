import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const UserHeaders = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return {
      printer: request.headers['printer'],
      workstation: request.headers['workstation'],
      jwt: request.headers['authorization']?.replace('Bearer ', '') || 
           request.headers['jwt']
    };
  },
);