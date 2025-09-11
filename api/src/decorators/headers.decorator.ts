// src/decorators/user-headers.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserHeadersType } from '../middleware/headers.middleware';

export const UserHeaders = createParamDecorator(
  (data: keyof UserHeadersType | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const userHeaders: UserHeadersType = request['userHeaders'] || {};

    // Jeśli podano konkretną właściwość, zwróć tylko ją
    if (data) {
      return userHeaders[data];
    }

    // W przeciwnym razie zwróć cały obiekt
    return userHeaders;
  },
);