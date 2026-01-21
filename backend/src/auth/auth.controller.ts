import { Controller, Request, Post, UseGuards, Body, Get, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() req) {
    // In a real app, use a LocalGuard to validate credentials before calling login
    // For simplicity/speed, we'll validate manually in the service or assume pre-validated if using LocalStrategy
    // But since we didn't implement LocalStrategy, let's do manual validation here for the MVP
    const user = await this.authService.validateUser(req.email, req.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() body) {
    // Map frontend specific payload to backend domain model
    // Frontend sends: { role: 'contractor' | 'supplier', companyName: '...', ... }
    
    // Determine Company Type
    let companyType: 'CONTRACTOR' | 'SUPPLIER' = 'CONTRACTOR';
    if (body.role === 'supplier') {
      companyType = 'SUPPLIER';
    }

    // Default the first user to ADMIN role for now
    const userRole = 'ADMIN';

    return this.authService.register({
      email: body.email,
      password: body.password,
      phone: body.phone,
      firstName: body.fullName,
      role: userRole,
      company: {
        name: body.companyName,
        type: companyType,
      }
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
