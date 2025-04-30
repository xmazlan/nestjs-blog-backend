// src/auth/decorators/roles.decorator.ts

import { SetMetadata } from '@nestjs/common';

// Definisikan nama kunci untuk menyimpan metadata roles
export const ROLES_KEY = 'roles';

/**
 * Custom Decorator @Roles(...roles: string[])
 * Menetapkan metadata peran (roles) yang diperlukan untuk mengakses suatu route.
 * Digunakan bersama dengan RolesGuard.
 *
 * @param roles Daftar nama peran yang diizinkan.
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// Contoh penggunaan di controller:
// @Post()
// @Roles('admin', 'editor') // Hanya admin atau editor yang bisa akses
// @UseGuards(JwtAuthGuard, RolesGuard)
// createPost(...) { ... }
