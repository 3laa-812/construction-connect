import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secret-key',
    });
  }

  async validate(payload: JwtPayload) {
    return {
      sub: payload.sub,
      id: payload.sub,
      email: payload.email,
      companyId: payload.companyId,
      company_id: payload.companyId,
      role: payload.role,
    };
  }
}
