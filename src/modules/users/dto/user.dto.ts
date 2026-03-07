import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmploymentType } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  name: string = '';

  @ApiProperty({ example: 'joao@email.com' })
  @IsEmail()
  email: string = '';

  @ApiProperty({ example: 'secret123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string = '';

  @ApiPropertyOptional({ enum: EmploymentType, default: EmploymentType.CLT })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;
}

export class LoginDto {
  @ApiProperty({ example: 'joao@email.com' })
  @IsEmail()
  email: string = '';

  @ApiProperty({ example: 'secret123' })
  @IsString()
  password: string = '';
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'João Santos' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: EmploymentType })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;
}
