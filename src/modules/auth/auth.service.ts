import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import {
  BusinessRuleException,
  EntityNotFoundException,
} from '../../shared/exceptions/domain.exceptions';
import { CategoriesService } from '../categories/categories.service';
import { LoginDto, RegisterDto } from '../users/dto/user.dto';
import { UsersService } from '../users/users.service';
import { UsersRepository } from '../users/users.repository';

export interface AuthTokenResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: { id: string; name: string; email: string };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly categoriesService: CategoriesService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokenResponse> {
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new BusinessRuleException(
        'EMAIL_ALREADY_REGISTERED',
        'A user with this email already exists',
      );
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
      employmentType: dto.employmentType,
    });

    await this.categoriesService.seedSystemCategories(user.id);

    return this.buildTokenResponse(user.id, user.name, user.email);
  }

  async login(dto: LoginDto): Promise<AuthTokenResponse> {
    const user = await this.usersRepository.findByEmail(dto.email);

    if (!user) {
      throw new EntityNotFoundException('User');
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      throw new BusinessRuleException(
        'INVALID_CREDENTIALS',
        'Invalid email or password',
      );
    }

    return this.buildTokenResponse(user.id, user.name, user.email);
  }

  private buildTokenResponse(
    id: string,
    name: string,
    email: string,
  ): AuthTokenResponse {
    const payload = { sub: id, email };
    const expiresIn = process.env.JWT_EXPIRES_IN ?? '7d';

    return {
      accessToken: this.jwtService.sign(payload),
      tokenType: 'Bearer',
      expiresIn,
      user: { id, name, email },
    };
  }
}
