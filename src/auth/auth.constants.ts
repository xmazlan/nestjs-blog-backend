// src/auth/auth.constants.ts

// Daftar NAMA ROLE yang dianggap sebagai Super Role (bypass permission checks)
// PENTING: Gunakan dengan hati-hati.
export const SUPER_ROLES = ['Super Admin', 'Administrator']; // Ganti/sesuaikan nama peran ini

// Daftar username yang dianggap sebagai Super Admin (bypass role checks di RolesGuard)
export const SUPER_ADMIN_USERNAMES = ['admin'];

// Kunci metadata untuk decorators
export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions'; // Kunci untuk decorator @Permissions nanti

// Konstanta JWT
export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'INI_HARUS_DIGANTI_DENGAN_SECRET_KEY_YANG_SANGAT_KUAT_DAN_RAHASIA',
};