// src/auth/guards/roles.guard.ts

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator'; // Import key metadata
import { UserWithRoles } from '../../users/users.service'; // Import tipe user dengan roles

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {} // Inject Reflector untuk membaca metadata

  canActivate(context: ExecutionContext): boolean {
    // 1. Dapatkan roles yang diperlukan dari metadata (@Roles decorator)
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(), // Cek metadata di level method handler
      context.getClass(),   // Cek metadata di level class controller
    ]);

    // Jika tidak ada @Roles decorator, izinkan akses (guard ini hanya aktif jika ada @Roles)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 2. Dapatkan objek user dari request (yang sudah disisipkan oleh JwtAuthGuard/JwtStrategy)
    const request = context.switchToHttp().getRequest();
    const user = request.user as UserWithRoles; // Asumsikan user bertipe UserWithRoles

    // Jika tidak ada user (seharusnya tidak terjadi jika JwtAuthGuard berjalan sebelumnya)
    if (!user || !user.roles) {
      console.warn("RolesGuard: User object or user.roles not found in request. Ensure JwtAuthGuard runs first and JwtStrategy returns user with roles.");
      return false; // Tolak akses jika tidak ada data user/roles
    }

    // 3. Cek apakah user memiliki setidaknya satu role yang diperlukan
    const userRoleNames = user.roles.map(userRole => userRole.role.name); // Ekstrak nama peran pengguna

    console.log('Required Roles:', requiredRoles);
    console.log('User Roles:', userRoleNames);

    const hasRequiredRole = requiredRoles.some((role) => userRoleNames.includes(role));

    if (!hasRequiredRole) {
      console.log(`RolesGuard: Access denied. User roles [${userRoleNames.join(', ')}] do not include required roles [${requiredRoles.join(', ')}]`);
    }

    return hasRequiredRole; // Izinkan jika ada kecocokan, tolak jika tidak
  }
}
