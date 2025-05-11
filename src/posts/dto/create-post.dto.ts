import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsInt,
  MinLength,
  IsBoolean,
  ValidateIf, // Untuk validasi kondisional
} from 'class-validator';

export class CreatePostDto {
  @ApiProperty({
    description: 'Judul post. Minimal 5 karakter.',
    example: 'Panduan Lengkap Belajar NestJS untuk Pemula',
  })
  @IsString({ message: 'Judul harus berupa string' })
  @IsNotEmpty({ message: 'Judul tidak boleh kosong' })
  @MinLength(5, { message: 'Judul minimal harus 5 karakter' })
  title: string;

  @ApiProperty({
    description: 'Konten utama dari post.',
    example: 'Ini adalah konten post yang menjelaskan berbagai aspek NestJS...',
  })
  @IsString({ message: 'Konten harus berupa string' })
  @IsNotEmpty({ message: 'Konten tidak boleh kosong' })
  content: string;

  @ApiPropertyOptional({
    description: 'Path ke gambar unggulan (featured image) untuk post ini.',
    example: '/uploads/images/nestjs-banner.jpg',
  })
  @IsOptional()
  @IsString({ message: 'Path gambar harus berupa string' })
  imagePath?: string;

  @ApiPropertyOptional({
    description:
      'ID kategori yang akan diasosiasikan dengan post ini (opsional).',
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: 'ID Kategori harus berupa angka integer' })
  categoryId?: number;

  @ApiPropertyOptional({
    description: 'Array ID tag yang akan diasosiasikan dengan post ini.',
    type: [Number],
    example: [3, 4, 5],
  })
  @IsOptional()
  @IsArray({ message: 'ID Tag harus berupa array' })
  @IsInt({ each: true, message: 'Setiap ID tag harus berupa angka integer' })
  tagIds?: number[];

  @ApiPropertyOptional({
    description:
      'Status publikasi post. Jika true, post akan dipublikasikan. Default false (draft).',
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Status publikasi harus berupa boolean' })
  published?: boolean = false;
}
