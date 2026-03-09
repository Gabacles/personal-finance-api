import { JwtService } from '@nestjs/jwt';
import { LoginDto, RegisterDto } from '../users/dto/user.dto';
import { UsersService } from '../users/users.service';
import { UsersRepository } from '../users/users.repository';
export interface AuthTokenResponse {
    accessToken: string;
    tokenType: 'Bearer';
    expiresIn: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
}
export declare class AuthService {
    private readonly usersService;
    private readonly usersRepository;
    private readonly jwtService;
    constructor(usersService: UsersService, usersRepository: UsersRepository, jwtService: JwtService);
    register(dto: RegisterDto): Promise<AuthTokenResponse>;
    login(dto: LoginDto): Promise<AuthTokenResponse>;
    private buildTokenResponse;
}
