import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';
import { IsString, IsOptional } from 'class-validator';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  // name bersifat opsional karena PartialType

  @ApiPropertyOptional({
    description: 'Slug kustom (jika ingin override slug otomatis). Harus unik.',
    example: 'berita-teknologi-terbaru',
  })
  @IsOptional()
  @IsString({ message: 'Slug harus berupa string' })
  slug?: string;
}
