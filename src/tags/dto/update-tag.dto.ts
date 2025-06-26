import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateTagDto } from './create-tag.dto';
import { IsString, IsOptional } from 'class-validator';

export class UpdateTagDto extends PartialType(CreateTagDto) {
  // name bersifat opsional karena PartialType

  @ApiPropertyOptional({
    description: 'Slug kustom (jika ingin override slug otomatis). Harus unik.',
    example: 'nestjs-framework',
  })
  @IsOptional()
  @IsString({ message: 'Slug harus berupa string' })
  slug?: string;
}
