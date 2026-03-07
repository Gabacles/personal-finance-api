import { AuthenticatedUser } from '../../shared/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/user.dto';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMe(user: AuthenticatedUser): Promise<import("./users.service").SafeUser>;
    updateMe(user: AuthenticatedUser, dto: UpdateUserDto): Promise<import("./users.service").SafeUser>;
}
