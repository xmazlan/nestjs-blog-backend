// src/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard'; // Import JwtStrategy

export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'YOUR_SECRET_KEY_CHANGE_THIS', // Ganti dengan secret key yang kuat dari environment variable!
};

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1h' }, // Sesuaikan durasi token
    }),
  ],
  controllers: [AuthController],
  // Daftarkan AuthService DAN JwtStrategy sebagai provider
  providers: [AuthService, JwtStrategy, RolesGuard, PermissionsGuard],
  exports: [AuthService, JwtModule, PassportModule], // Tidak perlu ekspor JwtStrategy biasanya
})
export class AuthModule {}
