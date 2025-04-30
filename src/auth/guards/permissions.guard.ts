// src/auth/guards/permissions.guard.ts

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException, // Import untuk error yang lebih spesifik
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSIONS_KEY,
  SUPER_ROLES, // Import daftar Super Roles
} from '../auth.constants';
import { UserWithRoles } from '../../users/users.service'; // Import tipe user dengan roles

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {} // Inject Reflector

  canActivate(context: ExecutionContext): boolean {
    // 1. Dapatkan objek user dari request (disisipkan oleh JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user as UserWithRoles;

    // Jika tidak ada user (pengaman tambahan, JwtAuthGuard seharusnya sudah menangani)
    if (!user) {
      console.warn('PermissionsGuard: No user found in request. Ensure JwtAuthGuard runs first.');
      return false;
    }

    // 2. --- Pemeriksaan Super Role ---
    if (user.roles) {
      const userRoleNames = user.roles.map((ur) => ur.role.name);
      const hasSuperRole = SUPER_ROLES.some((superRole) =>
        userRoleNames.includes(superRole),
      );
      if (hasSuperRole) {
        // Jika user memiliki Super Role, langsung izinkan akses
        console.log(
          `PermissionsGuard: Access granted for Super Role user (${user.username}). Bypassing specific permission check.`,
        );
        return true;
      }
    }
    // --- Akhir Pemeriksaan Super Role ---

    // 3. Dapatkan izin yang diperlukan dari metadata (@Permissions decorator)
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 4. Logika untuk Non-Super Role
    // Jika TIDAK ada decorator @Permissions, guard ini tidak relevan, izinkan akses
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Jika ADA decorator @Permissions DAN user BUKAN Super Role,
    // maka tolak akses (karena kita belum implementasi cek izin spesifik)
    console.log(
      `PermissionsGuard: Access denied for non-Super Role user (${user.username}). Specific permission check required but not fully implemented yet for permissions: [${requiredPermissions.join(', ')}]`,
    );
    // Melempar ForbiddenException agar NestJS mengembalikan status 403
    throw new ForbiddenException(
      'Anda tidak memiliki izin yang cukup untuk mengakses sumber daya ini (Non-Super Role).',
    );

    // Baris ini tidak akan pernah tercapai dengan logika di atas, tapi untuk kelengkapan:
    // return false;
  }

  // Fungsi getUserPermissions tidak diperlukan lagi untuk logika sementara ini
  // private async getUserPermissions(user: UserWithRoles): Promise<string[]> { ... }
}
