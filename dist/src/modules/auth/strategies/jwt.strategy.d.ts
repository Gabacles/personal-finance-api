import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { UsersRepository } from '../../users/users.repository';
interface JwtPayload {
    sub: string;
    email: string;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly usersRepository;
    constructor(configService: ConfigService, usersRepository: UsersRepository);
    validate(payload: JwtPayload): Promise<{
        id: string;
        email: string;
    }>;
}
export {};
