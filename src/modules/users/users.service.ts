import { Injectable } from '@nestjs/common';
import { EmploymentType, User } from '@prisma/client';
import { EntityNotFoundException } from '../../shared/exceptions/domain.exceptions';
import { UsersRepository } from './users.repository';
import { UpdateUserDto } from './dto/user.dto';

export type SafeUser = Omit<User, 'passwordHash'>;

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findById(id: string): Promise<SafeUser> {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new EntityNotFoundException('User', id);
    const { passwordHash: _, ...safe } = user;
    return safe;
  }

  async create(data: {
    name: string;
    email: string;
    passwordHash: string;
    employmentType?: EmploymentType;
  }): Promise<SafeUser> {
    const user = await this.usersRepository.create({
      name: data.name,
      email: data.email,
      passwordHash: data.passwordHash,
      employmentType: data.employmentType ?? EmploymentType.CLT,
    });
    const { passwordHash: _, ...safe } = user;
    return safe;
  }

  async update(id: string, dto: UpdateUserDto): Promise<SafeUser> {
    const user = await this.usersRepository.update(id, {
      name: dto.name,
      employmentType: dto.employmentType,
    });
    const { passwordHash: _, ...safe } = user;
    return safe;
  }
}
