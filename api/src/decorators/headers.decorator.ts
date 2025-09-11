import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserHeadersType } from '../middleware/headers.middleware';

export const UserHeaders = createParamDecorator(
  (data: keyof UserHeadersType | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const userHeaders: UserHeadersType = request['userHeaders'] || {};

    if (data) {
      return userHeaders[data];
    }

    return userHeaders;
  },
);