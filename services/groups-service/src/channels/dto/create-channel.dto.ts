import { IsString, MinLength, IsOptional } from 'class-validator';

export class CreateChannelDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
