// src/auth/guards/jwt-auth.guard.ts

import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') { // Menggunakan strategi 'jwt' yang kita daftarkan
  canActivate(context: ExecutionContext) {
    // Panggil canActivate dari parent class (AuthGuard) untuk menjalankan logika validasi Passport/JWT
    // Ini akan memanggil JwtStrategy.validate jika token valid
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    // Metode ini dipanggil setelah canActivate (dan JwtStrategy.validate) selesai.
    // Anda bisa menambahkan logika custom di sini jika perlu.
    // 'user' akan berisi data yang dikembalikan oleh JwtStrategy.validate jika sukses.
    // 'info' akan berisi detail error jika validasi token gagal (misal: TokenExpiredError, JsonWebTokenError).

    if (err || !user) {
      // Jika ada error dari Passport atau user tidak ditemukan (misal: validate gagal),
      // lempar UnauthorizedException.
      console.error('JWT Authentication Error:', err || info?.message || 'No user returned from strategy');
      throw err || new UnauthorizedException('Akses ditolak: Token tidak valid atau tidak ada.');
    }

    // Jika user ada (validasi sukses), kembalikan user.
    // User ini akan tersedia sebagai request.user di handler route.
    return user;
  }
}
