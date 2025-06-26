import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({
    description: 'Nama tag. Minimal 2 karakter.',
    example: 'NestJS',
  })
  @IsString({ message: 'Nama tag harus berupa string' })
  @IsNotEmpty({ message: 'Nama tag tidak boleh kosong' })
  @MinLength(2, { message: 'Nama tag minimal harus 2 karakter' })
  name: string;

  // Slug akan digenerate otomatis di service
}
