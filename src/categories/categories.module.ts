import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { PrismaModule } from '../prisma/prisma.module';
// import { AuthModule } from '../auth/auth.module'; // Jika menggunakan guard dari AuthModule secara langsung

@Module({
  imports: [
    PrismaModule,
    // AuthModule, // Uncomment jika controller/service menggunakan dependensi dari AuthModule
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService], // Ekspor service jika akan digunakan oleh modul lain (misalnya PostsModule)
})
export class CategoriesModule {}
