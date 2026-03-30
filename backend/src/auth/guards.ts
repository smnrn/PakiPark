import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    if (req.user?.role === 'admin') return true;
    throw new ForbiddenException('Access denied. Admin privileges required.');
  }
}

@Injectable()
export class AdminOrTellerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const allowed = ['admin', 'teller', 'business_partner'];
    if (allowed.includes(req.user?.role)) return true;
    throw new ForbiddenException('Access denied. Admin or Teller privileges required.');
  }
}
