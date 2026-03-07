import { LoginDto, RegisterDto } from '../users/dto/user.dto';
import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<import("./auth.service").AuthTokenResponse>;
    login(dto: LoginDto): Promise<import("./auth.service").AuthTokenResponse>;
}
