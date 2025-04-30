// src/users/users.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User, Role } from '@prisma/client'; // Import Role

// Definisikan tipe User tanpa password dan ekspor
export type SecureUser = Omit<User, 'password'>;

// Definisikan tipe User dengan Roles (tanpa password)
export type UserWithRoles = SecureUser & { // Gunakan SecureUser sebagai basis
  roles: { role: Pick<Role, 'name'> }[]; // Ambil hanya nama role
};
// Definisikan tipe User lengkap dengan Roles (termasuk password, untuk internal service)
export type FullUserWithRoles = User & {
  roles: { role: Pick<Role, 'name'> }[];
};


@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // ... (create tetap sama) ...
  async create(data: Prisma.UserCreateInput): Promise<SecureUser> { // Return SecureUser
    // Fungsi ini mungkin lebih cocok dipanggil dari AuthService setelah password di-hash
    // Atau bisa juga menerima DTO dan melakukan hashing di sini jika diperlukan
    return this.prisma.user.create({
      data,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        // Jangan sertakan password
        // Jangan sertakan relasi secara default kecuali diminta
      },
    });
  }


  // ... (findAll tetap sama, bisa juga ditambahkan include roles jika perlu) ...
  async findAll(): Promise<SecureUser[]> { // Return array of SecureUser
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        // roles: { select: { role: { select: { name: true } } } }, // Contoh jika ingin menampilkan role di list
      },
    });
  }


  /**
   * Menemukan satu pengguna berdasarkan ID, termasuk relasi roles.
   * @param id ID pengguna.
   * @param includePassword Apakah menyertakan password hash (default: false).
   * @returns Pengguna yang ditemukan atau null.
   */
  async findOneById(id: number, includePassword = false): Promise<UserWithRoles | FullUserWithRoles | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      // Include relasi roles -> user_roles -> role (ambil nama role)
      include: {
        roles: { // Nama relasi di model User
          select: {
            role: { // Nama relasi di model UserRole
              select: {
                name: true, // Ambil hanya field 'name' dari model Role
              },
            },
          },
        },
        // Anda bisa include permissions di sini juga jika diperlukan nanti
        // permissions: { select: { permission: { select: { name: true } } } },
      },
    });

    if (!user) {
      // Jangan lempar error di sini agar bisa ditangani di service pemanggil (misal: JwtStrategy)
      return null;
    }

    // Hapus password jika tidak diminta
    if (!includePassword) {
      const { password, ...result } = user;
      return result as UserWithRoles; // Tipe sudah termasuk roles
    }

    return user as FullUserWithRoles; // Tipe sudah termasuk roles
  }

  /**
   * Menemukan satu pengguna berdasarkan username (case-insensitive).
   * Mengembalikan user LENGKAP termasuk password hash dan roles.
   * @param username Username pengguna.
   * @returns Pengguna lengkap atau null.
   */
  async findOneByUsername(username: string): Promise<FullUserWithRoles | null> {
    return this.prisma.user.findUnique({
      where: { username },
      include: { // Sertakan roles saat mencari by username (untuk login)
        roles: { select: { role: { select: { name: true } } } },
      },
    });
  }

  /**
   * Menemukan satu pengguna berdasarkan email (case-insensitive).
   * Mengembalikan user LENGKAP termasuk password hash dan roles.
   * @param email Email pengguna.
   * @returns Pengguna lengkap atau null.
   */
  async findOneByEmail(email: string): Promise<FullUserWithRoles | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: { // Sertakan roles saat mencari by email (untuk login)
        roles: { select: { role: { select: { name: true } } } },
      },
    });
  }

  // --- Metode Update dan Delete bisa ditambahkan nanti ---
}
