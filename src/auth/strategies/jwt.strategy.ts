// src/auth/strategies/jwt.strategy.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService, UserWithRoles } from '../../users/users.service'; // Import UsersService dan tipe UserWithRoles
import { jwtConstants } from '../auth.module';
// User type dari Prisma mungkin tidak perlu diimpor lagi jika kita pakai UserWithRoles

export interface JwtPayload {
  sub: number;
  username: string;
  // roles?: string[]; // Anda bisa tambahkan roles ke payload JWT saat login jika mau, tapi lebih aman fetch dari DB
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  /**
   * Validasi payload JWT dan fetch user beserta roles.
   * @param payload Payload dari JWT.
   * @returns Objek user dengan roles (tanpa password).
   */
  async validate(payload: JwtPayload): Promise<UserWithRoles> { // Kembalikan tipe UserWithRoles
    console.log(`Validating JWT payload for user ID: ${payload.sub}`);

    // Ambil user dari database berdasarkan ID di payload, pastikan roles di-include
    // findOneById sekarang defaultnya tidak include password
    const user = await this.usersService.findOneById(payload.sub);

    if (!user) {
      console.error(`JWT validation failed: User with ID ${payload.sub} not found.`);
      throw new UnauthorizedException('Token tidak valid atau pengguna tidak ditemukan.');
    }

    // User yang dikembalikan sudah bertipe UserWithRoles (tanpa password)
    return user;
  }
}