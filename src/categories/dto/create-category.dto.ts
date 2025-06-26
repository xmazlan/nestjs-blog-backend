import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Nama kategori. Minimal 3 karakter.',
    example: 'Berita Teknologi',
  })
  @IsString({ message: 'Nama kategori harus berupa string' })
  @IsNotEmpty({ message: 'Nama kategori tidak boleh kosong' })
  @MinLength(3, { message: 'Nama kategori minimal harus 3 karakter' })
  name: string;

  // Slug akan digenerate otomatis di service
}
