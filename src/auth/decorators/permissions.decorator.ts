// src/auth/decorators/permissions.decorator.ts

import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_KEY } from '../auth.constants'; // Import key metadata dari konstanta

/**
 * Custom Decorator @Permissions(...permissions: string[])
 * Menetapkan metadata izin (permissions) yang diperlukan untuk mengakses suatu route.
 * Digunakan bersama dengan PermissionsGuard.
 *
 * @param permissions Daftar nama izin (permission name) yang diperlukan.
 */
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

// Contoh penggunaan di controller:
// @Post()
// @Permissions('create-post') // Hanya user dengan izin 'create-post' yang bisa akses
// @UseGuards(JwtAuthGuard, PermissionsGuard) // Urutan guard penting
// createPost(...) { ... }
