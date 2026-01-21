import { Injectable, UnauthorizedException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { CompaniesService } from '../companies/companies.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private companiesService: CompaniesService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && user.password_hash && (await bcrypt.compare(pass, user.password_hash))) {
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role,
      company_id: user.company_id 
    };
    return {
      access_token: this.jwtService.sign(payload),
      user,
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
    };
  }) {
    try {
      console.log('Registering user:', data.email);
      // Check if user exists
      const existingUser = await this.usersService.findByEmail(data.email);
      if (existingUser) {
        throw new UnauthorizedException('User already exists');
      }

      // 1. Create Company if provided
      let companyId: string | null = null;
      if (data.company) {
        console.log('Creating company:', data.company.name);
        const company = await this.companiesService.create({
          name: data.company.name,
          type: data.company.type,
        });
        companyId = company.id;
      }

      // 2. Hash Password
      const salt = await bcrypt.genSalt();
      const password_hash = await bcrypt.hash(data.password, salt);

      // 3. Create User
      console.log('Creating user record...');
      const newUser = await this.usersService.create({
        email: data.email,
        phone: data.phone,
        password_hash,
        role: data.role,
        company: companyId ? { connect: { id: companyId } } : undefined,
      });

      const { password_hash: _, ...result } = newUser;
      return this.login(result);
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
           const target = error.meta?.target as string[];
           throw new BadRequestException(`User with this ${target ? target.join(', ') : 'field'} already exists`);
        }
      }
      throw new InternalServerErrorException(error.message || 'Registration failed');
    }
  }
}
