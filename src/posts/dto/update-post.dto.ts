import { PartialType, OmitType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, ValidateIf } from 'class-validator';
import { CreatePostDto } from './create-post.dto';
// OmitType digunakan untuk mengambil semua properti dari CreatePostDto KECUALI categoryId
// Kemudian kita definisikan categoryId secara manual di UpdatePostDto

export class UpdatePostDto extends PartialType(
  OmitType(CreatePostDto, ['categoryId'] as const), // Keluarkan categoryId dari CreatePostDto
) {
  // Properti lain dari CreatePostDto (title, content, imagePath, tagIds, published)
  // akan diwarisi sebagai opsional oleh PartialType.

  @ApiPropertyOptional({
    description:
      'ID kategori yang akan diasosiasikan dengan post ini. Kirim null untuk menghapus asosiasi kategori, atau biarkan undefined untuk tidak mengubah.',
    example: 1,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((object, value) => value !== null) // Hanya validasi jika value bukan null
  @IsInt({
    message:
      'ID Kategori harus berupa angka integer jika diberikan dan bukan null',
  })
  categoryId?: number | null; // Sekarang bisa number, null, atau undefined

  @ApiPropertyOptional({
    description: 'Slug kustom (jika ingin override slug otomatis). Harus unik.',
    example: 'panduan-nestjs-pemula-v2',
  })
  @IsOptional()
  @IsString({ message: 'Slug harus berupa string' })
  slug?: string;
}
