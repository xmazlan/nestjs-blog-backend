import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
// Tidak perlu import PrismaModule karena sudah global

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Ekspor UsersService agar bisa di-inject di module lain (misal: AuthModule)
})
export class UsersModule {}
