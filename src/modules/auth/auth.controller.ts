import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Public } from '../../shared/decorators/public.decorator';
import { LoginDto, RegisterDto } from '../users/dto/user.dto';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user and get JWT token' })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({
    description: 'User created and authenticated successfully.',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        tokenType: { type: 'string', example: 'Bearer' },
        expiresIn: { type: 'string', example: '7d' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
          },
        },
      },
      example: {
        accessToken: '<JWT_TOKEN>',
        tokenType: 'Bearer',
        expiresIn: '7d',
        user: {
          id: 'd80f0ef5-73ad-4dd2-8127-fe6f59f6fc7a',
          name: 'Joao Silva',
          email: 'joao@email.com',
        },
      },
    },
  })
  @ApiUnprocessableEntityResponse({
    description: 'Business rule violation (for example, duplicated email).',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 422 },
        error: { type: 'string', example: 'Business Rule Violation' },
        message: { type: 'string', example: 'A user with this email already exists' },
        code: { type: 'string', example: 'EMAIL_ALREADY_REGISTERED' },
        timestamp: { type: 'string', format: 'date-time' },
        path: { type: 'string', example: '/api/v1/auth/register' },
      },
    },
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and get JWT token' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Authenticated successfully.',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        tokenType: { type: 'string', example: 'Bearer' },
        expiresIn: { type: 'string', example: '7d' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
          },
        },
      },
      example: {
        accessToken: '<JWT_TOKEN>',
        tokenType: 'Bearer',
        expiresIn: '7d',
        user: {
          id: 'd80f0ef5-73ad-4dd2-8127-fe6f59f6fc7a',
          name: 'Joao Silva',
          email: 'joao@email.com',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'User was not found for the provided email.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        error: { type: 'string', example: 'Not Found' },
        message: { type: 'string', example: 'User not found' },
        timestamp: { type: 'string', format: 'date-time' },
        path: { type: 'string', example: '/api/v1/auth/login' },
      },
    },
  })
  @ApiUnprocessableEntityResponse({
    description: 'Invalid credentials.',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 422 },
        error: { type: 'string', example: 'Business Rule Violation' },
        message: { type: 'string', example: 'Invalid email or password' },
        code: { type: 'string', example: 'INVALID_CREDENTIALS' },
        timestamp: { type: 'string', format: 'date-time' },
        path: { type: 'string', example: '/api/v1/auth/login' },
      },
    },
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
