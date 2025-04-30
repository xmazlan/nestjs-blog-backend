import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client'; // Import tipe User jika perlu type safety

// Definisikan tipe untuk pengguna yang diekstrak (tanpa password)
// Anda bisa membuatnya lebih spesifik jika perlu
type UserPayload = Omit<User, 'password'>;

/**
 * Custom Decorator @GetUser()
 * Mengambil objek 'user' yang telah divalidasi dan disisipkan
 * oleh AuthGuard (misal: JwtAuthGuard via JwtStrategy) ke dalam objek request.
 *
 * @param data - Opsional: Properti spesifik dari objek user yang ingin diambil (misal: 'id', 'username').
 * @param ctx - ExecutionContext yang berisi detail request.
 * @returns Objek user lengkap (tanpa password) atau properti spesifik jika diminta.
 */
export const GetUser = createParamDecorator(
  (data: keyof UserPayload | undefined, ctx: ExecutionContext): UserPayload | UserPayload[keyof UserPayload] | null => {
    // Dapatkan objek request dari ExecutionContext
    const request = ctx.switchToHttp().getRequest();

    // Ambil objek user yang sudah disisipkan oleh guard/strategy
    const user = request.user as UserPayload; // Lakukan type assertion

    // Jika tidak ada objek user (seharusnya tidak terjadi jika guard aktif)
    if (!user) {
      console.error("GetUser decorator used without a valid user found in request. Ensure AuthGuard is active.");
      return null; // Atau throw error jika lebih sesuai
    }

    // Jika parameter 'data' diberikan (misal @GetUser('id')),
    // kembalikan hanya properti tersebut.
    // Jika 'data' tidak diberikan (hanya @GetUser()), kembalikan seluruh objek user.
    return data ? user?.[data] : user;
  },
);