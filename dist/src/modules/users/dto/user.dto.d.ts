import { EmploymentType } from '@prisma/client';
export declare class RegisterDto {
    name: string;
    email: string;
    password: string;
    employmentType?: EmploymentType;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class UpdateUserDto {
    name?: string;
    employmentType?: EmploymentType;
}
