import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Membuat PrismaService tersedia di semua module tanpa perlu import PrismaModule
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Ekspor agar bisa di-inject
})
export class PrismaModule {}