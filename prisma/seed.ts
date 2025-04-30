// prisma/seed.ts

import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Inisialisasi Prisma Client
const prisma = new PrismaClient();

// Fungsi untuk hash password
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  const salt = await bcrypt.genSalt(saltRounds);
  return bcrypt.hash(password, salt);
}

async function main() {
  console.log(`Memulai proses seeding...`);

  // --- 1. Buat Roles ---
  console.log('Membuat roles...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin', guardName: 'api' },
  });
  const authorRole = await prisma.role.upsert({
    where: { name: 'author' },
    update: {},
    create: { name: 'author', guardName: 'api' },
  });
  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: { name: 'user', guardName: 'api' },
  });
  console.log('Roles dibuat:', adminRole, authorRole, userRole);

  // --- 2. Buat Permissions ---
  // Tambahkan izin sesuai kebutuhan aplikasi Anda
  console.log('Membuat permissions...');
  const permissionsData = [
    // User Permissions
    { name: 'manage-users', guardName: 'api' }, // CRUD users
    { name: 'manage-roles', guardName: 'api' }, // CRUD roles/permissions
    // Post Permissions
    { name: 'create-post', guardName: 'api' },
    { name: 'edit-own-post', guardName: 'api' },
    { name: 'edit-any-post', guardName: 'api' },
    { name: 'delete-own-post', guardName: 'api' },
    { name: 'delete-any-post', guardName: 'api' },
    { name: 'publish-post', guardName: 'api' },
    // Category & Tag Permissions
    { name: 'manage-categories', guardName: 'api' },
    { name: 'manage-tags', guardName: 'api' },
    // Comment Permissions
    { name: 'create-comment', guardName: 'api' },
    { name: 'moderate-comments', guardName: 'api' },
  ];

  const permissions = await Promise.all(
    permissionsData.map((perm) =>
      prisma.permission.upsert({
        where: { name: perm.name },
        update: {},
        create: perm,
      }),
    ),
  );
  console.log('Permissions dibuat:', permissions.map(p => p.name));

  // --- 3. Hubungkan Permissions ke Roles ---
  console.log('Menghubungkan permissions ke roles...');
  // Admin mendapatkan semua izin
  await Promise.all(
    permissions.map((permission) =>
      prisma.permissionRole.upsert({
        where: {
          permissionId_roleId: { // Menggunakan composite key
            permissionId: permission.id,
            roleId: adminRole.id,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      }),
    ),
  );
  console.log(`Semua (${permissions.length}) permissions ditambahkan ke role admin.`);

  // Author permissions (contoh)
  const authorPermissionNames = [
    'create-post',
    'edit-own-post',
    'delete-own-post',
    'create-comment',
  ];
  const authorPermissions = permissions.filter(p => authorPermissionNames.includes(p.name));
  await Promise.all(
    authorPermissions.map((permission) =>
      prisma.permissionRole.upsert({
        where: {
          permissionId_roleId: {
            permissionId: permission.id,
            roleId: authorRole.id,
          },
        },
        update: {},
        create: {
          roleId: authorRole.id,
          permissionId: permission.id,
        },
      }),
    ),
  );
  console.log(`${authorPermissions.length} permissions ditambahkan ke role author.`);

  // User permissions (contoh)
  const userPermissionNames = ['create-comment'];
  const userPermissions = permissions.filter(p => userPermissionNames.includes(p.name));
  await Promise.all(
    userPermissions.map((permission) =>
      prisma.permissionRole.upsert({
        where: {
          permissionId_roleId: {
            permissionId: permission.id,
            roleId: userRole.id,
          },
        },
        update: {},
        create: {
          roleId: userRole.id,
          permissionId: permission.id,
        },
      }),
    ),
  );
  console.log(`${userPermissions.length} permissions ditambahkan ke role user.`);


  // --- 4. Buat User Admin ---
  console.log('Membuat user admin...');
  const adminPassword = await hashPassword('password'); // Ganti 'password' dengan password default yang aman
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {}, // Jangan update jika sudah ada
    create: {
      username: 'admin',
      email: 'admin@example.com',
      name: 'Administrator',
      password: adminPassword,
      // Hubungkan dengan role admin
      roles: {
        create: [
          {
            roleId: adminRole.id,
          },
        ],
      },
    },
    include: { // Include roles untuk logging
      roles: { select: { role: true } }
    }
  });
  console.log('User admin dibuat/ditemukan:', { id: adminUser.id, username: adminUser.username, email: adminUser.email, roles: adminUser.roles });

  // --- 5. (Opsional) Buat Data Dummy Lain ---
  console.log('Membuat data dummy (opsional)...');
  // Contoh: Buat user author
  const authorPassword = await hashPassword('password123');
  const dummyAuthor = await prisma.user.upsert({
    where: { email: 'author@example.com' },
    update: {},
    create: {
      username: 'penulis_hebat',
      email: 'author@example.com',
      name: 'Penulis Hebat',
      password: authorPassword,
      roles: { create: [{ roleId: authorRole.id }] }
    }
  });
  console.log('Dummy author dibuat:', dummyAuthor.username);

  // Contoh: Buat kategori
  const dummyCategory = await prisma.category.upsert({
    where: { slug: 'berita-teknologi' },
    update: {},
    create: { name: 'Berita Teknologi', slug: 'berita-teknologi' }
  });
  console.log('Dummy category dibuat:', dummyCategory.name);

  // Contoh: Buat post oleh author
  const dummyPost = await prisma.post.upsert({
    where: { slug: 'postingan-pertama-penulis' },
    update: {},
    create: {
      title: 'Postingan Pertama Penulis',
      slug: 'postingan-pertama-penulis',
      content: 'Ini adalah isi dari postingan pertama oleh penulis hebat.',
      published: true,
      authorId: dummyAuthor.id,
      categoryId: dummyCategory.id
    }
  });
  console.log('Dummy post dibuat:', dummyPost.title);


  console.log(`Seeding selesai.`);
}

main()
  .catch((e) => {
    console.error('Error selama seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Tutup koneksi Prisma
    await prisma.$disconnect();
  });