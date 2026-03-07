import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthenticatedUser } from '../../shared/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/user.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth('jwt')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get authenticated user profile' })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update authenticated user profile' })
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(user.id, dto);
  }
}
