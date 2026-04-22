import { IsString, MinLength, IsOptional } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
