// src/auth/auth.controller.ts

import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Endpoint registrasi yang sekarang mengembalikan token akses.
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerAuthDto: RegisterAuthDto) {
    // Panggil service register, yang sekarang mengembalikan token
    const result = await this.authService.register(registerAuthDto);

    // Kembalikan token akses
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Registrasi berhasil, Anda otomatis login.', // Ubah pesan
      data: result, // Berisi { accessToken: '...' }
    };
  }

  /**
   * Endpoint login.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginAuthDto: LoginAuthDto) {
    const result = await this.authService.login(loginAuthDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Login berhasil',
      data: result, // Berisi { accessToken: '...' }
    };
  }
}
