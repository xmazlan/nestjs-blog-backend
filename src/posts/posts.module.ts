import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
// Impor PrismaModule jika PrismaService disediakan olehnya dan diekspor
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule], // Jika PrismaService di-provide oleh PrismaModule
  controllers: [PostsController],
  providers: [PostsService], // PrismaService akan otomatis di-inject ke PostsService jika sudah global atau diimpor di sini
})
export class PostsModule {}
