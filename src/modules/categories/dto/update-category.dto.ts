import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCategoryDto {
  @ApiProperty({ example: 'Updated name', description: 'New category name (type cannot be changed)' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string = '';
}
