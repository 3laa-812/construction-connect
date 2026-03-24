import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Prisma } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() data: Prisma.UserCreateInput) {
    return this.usersService.create(data);
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.usersService.findAll(user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const u = await this.usersService.findOne(id, user);
    if (!u) {
      throw new NotFoundException('User not found');
    }
    return u;
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: Prisma.UserUpdateInput,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usersService.update(id, data, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.usersService.remove(id, user);
  }
}
