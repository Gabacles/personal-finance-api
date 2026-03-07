import { EmploymentType, User } from '@prisma/client';
import { UsersRepository } from './users.repository';
import { UpdateUserDto } from './dto/user.dto';
export type SafeUser = Omit<User, 'passwordHash'>;
export declare class UsersService {
    private readonly usersRepository;
    constructor(usersRepository: UsersRepository);
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<SafeUser>;
    create(data: {
        name: string;
        email: string;
        passwordHash: string;
        employmentType?: EmploymentType;
    }): Promise<SafeUser>;
    update(id: string, dto: UpdateUserDto): Promise<SafeUser>;
}
