// src/tags/tags.module.ts
import { Module } from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { PrismaModule } from '../prisma/prisma.module';
// import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    // AuthModule, // Uncomment jika controller/service menggunakan dependensi dari AuthModule
  ],
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService], // Ekspor service jika akan digunakan oleh modul lain
})
export class TagsModule {}
