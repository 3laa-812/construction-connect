import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';
import { Prisma, UserStatus } from '@prisma/client';
import { CompaniesService } from '../companies/companies.service';
import { buildJwtPayload } from './jwt-payload.util';
import { OtpDeliveryService } from './otp-delivery.service';
import { assertOtplibAvailable } from './otplib-load';

/** Random 6-digit OTP; stored hashed with bcrypt (FR-A-01). otplib is installed for future TOTP/MFA. */
function generateSixDigitOtp(): string {
  return String(crypto.randomInt(100_000, 1_000_000));
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private companiesService: CompaniesService,
    private otpDelivery: OtpDeliveryService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user?.password_hash) {
      return null;
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(
        'Account not verified. Complete OTP verification first.',
      );
    }
    if (await bcrypt.compare(pass, user.password_hash)) {
      const { password_hash: _p, otp_hash: _o, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const full =
      user.company !== undefined
        ? user
        : await this.usersService.findOne(user.id);
    if (!full) {
      throw new UnauthorizedException('User not found');
    }
    if (full.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }
    const payload = buildJwtPayload(full);
    const { password_hash: _ph, otp_hash: _oh, ...safe } = full;
    return {
      access_token: this.jwtService.sign(payload),
      user: safe,
    };
  }

  async register(data: {
    email: string;
    password: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    role: 'ADMIN' | 'SITE_ENGINEER' | 'PROCUREMENT_MANAGER';
    company?: {
      name: string;
      type: 'CONTRACTOR' | 'SUPPLIER';
      commercial_reg_no?: string;
      tax_id?: string;
    };
  }): Promise<{ message: string; userId: string }> {
    assertOtplibAvailable();
    const existingUser = await this.usersService.findByEmail(data.email);
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    let companyId: string | null = null;
    if (data.company) {
      const company = await this.companiesService.create({
        name: data.company.name,
        type: data.company.type,
        commercial_reg_no: data.company.commercial_reg_no,
        tax_id: data.company.tax_id,
      });
      companyId = company.id;
    }

    const salt = await bcrypt.genSalt();
    const password_hash = await bcrypt.hash(data.password, salt);
    const plainOtp = generateSixDigitOtp();
    const otp_hash = await bcrypt.hash(plainOtp, salt);
    const otp_expires_at = new Date(Date.now() + 10 * 60 * 1000);

    let newUser;
    try {
      newUser = await this.usersService.create({
        email: data.email,
        phone: data.phone,
        password_hash,
        role: data.role,
        status: UserStatus.PENDING_VERIFICATION,
        otp_hash,
        otp_expires_at,
        company: companyId ? { connect: { id: companyId } } : undefined,
      });
    } catch (e) {
      if (companyId) {
        await this.companiesService.deleteCompanyHard(companyId);
      }
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new BadRequestException('Email or phone already registered');
      }
      throw e;
    }

    try {
      await this.otpDelivery.sendRegistrationOtp(
        data.email,
        data.phone,
        plainOtp,
      );
    } catch (e) {
      this.logger.error(`OTP delivery failed: ${e}`);
      await this.usersService.deleteUserHard(newUser.id);
      if (companyId) {
        await this.companiesService.deleteCompanyHard(companyId);
      }
      throw new InternalServerErrorException('Could not send verification code');
    }

    return { message: 'OTP sent', userId: newUser.id };
  }

  async verifyOtp(userId: string, otp: string) {
    if (!otp || !/^\d{6}$/.test(otp.trim())) {
      throw new BadRequestException('OTP must be a 6-digit code');
    }
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new BadRequestException('Invalid user');
    }
    if (user.status !== UserStatus.PENDING_VERIFICATION) {
      throw new BadRequestException('User is not awaiting verification');
    }
    if (!user.otp_hash || !user.otp_expires_at) {
      throw new BadRequestException('No verification code on file');
    }
    if (user.otp_expires_at.getTime() < Date.now()) {
      throw new BadRequestException('Verification code has expired');
    }
    const ok = await bcrypt.compare(otp.trim(), user.otp_hash);
    if (!ok) {
      throw new UnauthorizedException('Invalid verification code');
    }

    const updated = await this.usersService.setActiveClearOtp(userId);
    return this.login(updated);
  }
}
