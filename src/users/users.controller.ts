// src/users/users.controller.ts

import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  NotFoundException,
  UseGuards,
  // Req sudah tidak diperlukan untuk getMyProfile
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator'; // Import decorator GetUser
import { User } from '@prisma/client'; // Import tipe User

// Definisikan tipe User tanpa password untuk digunakan di decorator/return type
type SecureUser = Omit<User, 'password'>;

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ... (findAll tetap sama) ...
  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return {
      statusCode: 200,
      message: 'Daftar pengguna berhasil diambil',
      data: users,
    };
  }


  /**
   * Endpoint untuk mendapatkan profil pengguna yang sedang login.
   * Menggunakan @GetUser() untuk cara yang lebih bersih.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  // Gunakan @GetUser() di sini, Anda bisa memberi tipe SecureUser
  async getMyProfile(@GetUser() user: SecureUser) {
    // Objek 'user' sekarang langsung tersedia sebagai parameter
    // dan sudah dijamin ada (jika guard lolos) serta tanpa password.

    console.log('User data from @GetUser decorator:', user);

    if (!user) {
      // Pengaman tambahan, meskipun guard seharusnya sudah menangani
      throw new NotFoundException('Pengguna tidak ditemukan dari token.');
    }

    return {
      statusCode: 200,
      message: 'Profil berhasil diambil',
      data: user, // Langsung kembalikan user dari decorator
    };
  }

  /**
   * Contoh penggunaan @GetUser() untuk mendapatkan properti spesifik.
   * Misalnya, jika Anda hanya butuh ID pengguna.
   */
  @Get('my-id')
  @UseGuards(JwtAuthGuard)
  async getMyId(@GetUser('id') userId: number) {
    console.log('User ID from @GetUser(\'id\'):', userId);
    return {
      statusCode: 200,
      message: 'ID Pengguna berhasil diambil',
      data: { id: userId },
    };
  }


  // ... (findOne tetap sama) ...
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      const user = await this.usersService.findOneById(id);
      return {
        statusCode: 200,
        message: `Detail pengguna ${id} berhasil diambil`,
        data: user,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

}
