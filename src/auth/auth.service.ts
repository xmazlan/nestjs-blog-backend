// src/auth/auth.service.ts

import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService, UserWithRoles, FullUserWithRoles, SecureUser } from '../users/users.service'; // Import tipe user, termasuk SecureUser
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Prisma, User } from '@prisma/client';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './strategies/jwt.strategy'; // Import JwtPayload

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    try {
      const salt = await bcrypt.genSalt(saltRounds);
      const hash = await bcrypt.hash(password, salt);
      return hash;
    } catch (error) {
      console.error('Error hashing password:', error);
      throw new InternalServerErrorException('Gagal memproses permintaan.');
    }
  }

  /**
   * Membuat payload JWT untuk pengguna.
   * @param user Objek pengguna (minimal memiliki id dan username).
   * @returns Payload JWT.
   */
  private _createJwtPayload(user: { id: number; username: string }): JwtPayload {
    return {
      sub: user.id,
      username: user.username,
    };
  }

  /**
   * Menghasilkan access token JWT.
   * @param payload Payload JWT.
   * @returns String access token.
   */
  private async _generateAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload);
  }


  /**
   * Mendaftarkan pengguna baru dan langsung menghasilkan token login serta data pengguna.
   * @param registerAuthDto Data registrasi pengguna.
   * @returns Object berisi data pengguna baru (tanpa password) dan access token.
   * @throws ConflictException, InternalServerErrorException
   */
  async register(registerAuthDto: RegisterAuthDto): Promise<{ user: SecureUser; accessToken: string }> { // Ubah return type
    const { username, email, name, password } = registerAuthDto;
    const hashedPassword = await this.hashPassword(password);

    let createdUser: User; // Simpan user yang baru dibuat

    try {
      // Buat pengguna baru di database
      createdUser = await this.prisma.user.create({
        data: {
          username,
          email,
          name,
          password: hashedPassword,
          // roles: { create: [{ roleId: ID_ROLE_USER }] } // Assign role default jika perlu
        },
        // Tidak perlu select spesifik di sini karena kita akan proses manual
      });

    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = (error.meta?.target as string[]) || [];
          if (target.includes('email')) {
            throw new ConflictException('Email sudah terdaftar.');
          }
          if (target.includes('username')) {
            throw new ConflictException('Username sudah terdaftar.');
          }
          throw new ConflictException('Email atau username sudah terdaftar.');
        }
      }
      console.error('Error registering user:', error);
      throw new InternalServerErrorException('Gagal mendaftarkan pengguna.');
    }

    // Buat token untuk user baru
    const payload = this._createJwtPayload(createdUser);
    const accessToken = await this._generateAccessToken(payload);

    // Hapus password dari objek user sebelum dikembalikan
    const { password: removedPassword, ...secureUser } = createdUser;

    // Kembalikan data user (tanpa password) dan token
    return {
      user: secureUser, // Kembalikan data user yang aman
      accessToken: accessToken,
    };
  }

  /**
   * Memvalidasi kredensial pengguna (via username atau email) dan menghasilkan JWT.
   * @param loginAuthDto Data login (identifier dan password).
   * @returns Object berisi access token.
   * @throws UnauthorizedException jika kredensial tidak valid.
   */
  async login(loginAuthDto: LoginAuthDto): Promise<{ accessToken: string }> {
    const { identifier, password } = loginAuthDto;
    let user: FullUserWithRoles | null = null;

    const isEmail = identifier.includes('@');

    if (isEmail) {
      console.log(`Attempting login with email: ${identifier}`);
      user = await this.usersService.findOneByEmail(identifier);
    } else {
      console.log(`Attempting login with username: ${identifier}`);
      user = await this.usersService.findOneByUsername(identifier);
    }

    if (!user) {
      console.log(`Login attempt failed: Identifier '${identifier}' not found.`);
      throw new UnauthorizedException('Kredensial tidak valid.');
    }

    const isPasswordMatching = await bcrypt.compare(password, user.password);
    if (!isPasswordMatching) {
      console.log(`Login attempt failed: Incorrect password for identifier '${identifier}'.`);
      throw new UnauthorizedException('Kredensial tidak valid.');
    }

    const payload = this._createJwtPayload(user);
    const accessToken = await this._generateAccessToken(payload);

    return {
      accessToken: accessToken,
    };
  }

  // ... (validate tetap sama) ...
  async validate(payload: JwtPayload): Promise<UserWithRoles> { // Kembalikan tipe UserWithRoles
    console.log(`Validating JWT payload for user ID: ${payload.sub}`);
    const user = await this.usersService.findOneById(payload.sub); // findOneById sudah tidak return password by default
    if (!user) {
      console.error(`JWT validation failed: User with ID ${payload.sub} not found.`);
      throw new UnauthorizedException('Token tidak valid atau pengguna tidak ditemukan.');
    }
    return user as UserWithRoles; // Pastikan tipenya sesuai
  }

}
