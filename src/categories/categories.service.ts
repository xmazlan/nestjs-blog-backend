// src/categories/categories.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category, Prisma } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Membuat slug yang unik dari nama kategori.
   * Jika slug sudah ada, akan ditambahkan angka di belakangnya.
   * @param name Nama kategori
   * @param currentId ID kategori saat ini (opsional, untuk update guna mengabaikan slug kategori itu sendiri)
   * @returns Slug yang unik
   */
  private async generateUniqueSlug(
    name: string,
    currentId?: number,
  ): Promise<string> {
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '-') // Ganti spasi dengan strip
      .replace(/[^\w-]+/g, ''); // Hapus karakter non-alfanumerik kecuali strip

    let count = 0;
    let uniqueSlug = slug;

    while (true) {
      const existingCategory = await this.prisma.category.findUnique({
        where: { slug: uniqueSlug },
      });

      // Jika tidak ada kategori dengan slug ini, ATAU kategori yang ditemukan adalah kategori yang sedang kita update
      if (
        !existingCategory ||
        (currentId && existingCategory.id === currentId)
      ) {
        break;
      }

      count++;
      uniqueSlug = `${slug}-${count}`;
    }
    return uniqueSlug;
  }

  /**
   * Membuat kategori baru.
   * @param createCategoryDto Data untuk membuat kategori
   * @returns Kategori yang baru dibuat
   */
  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const { name } = createCategoryDto;

    // Periksa apakah nama kategori sudah ada
    const existingCategoryByName = await this.prisma.category.findUnique({
      where: { name },
    });
    if (existingCategoryByName) {
      throw new ConflictException(`Kategori dengan nama "${name}" sudah ada.`);
    }

    const slug = await this.generateUniqueSlug(name);

    try {
      return await this.prisma.category.create({
        data: {
          name,
          slug,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // P2002 adalah kode error untuk unique constraint violation
        if (error.code === 'P2002') {
          // Cek field mana yang menyebabkan error (bisa name atau slug, meskipun slug sudah dihandle)
          const target = error.meta?.target as string[];
          if (target && target.includes('name')) {
            throw new ConflictException(
              `Kategori dengan nama "${name}" sudah ada.`,
            );
          }
          if (target && target.includes('slug')) {
            // Seharusnya ini tidak terjadi karena generateUniqueSlug, tapi sebagai fallback
            throw new ConflictException(
              `Slug "${slug}" sudah digunakan. Coba nama lain.`,
            );
          }
        }
      }
      console.error('Error creating category:', error);
      throw new InternalServerErrorException('Gagal membuat kategori.');
    }
  }

  /**
   * Mendapatkan semua kategori.
   * @param params Objek parameter untuk filter dan paginasi
   * @returns Daftar kategori dan metadata paginasi
   */
  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.CategoryWhereUniqueInput;
    where?: Prisma.CategoryWhereInput;
    orderBy?: Prisma.CategoryOrderByWithRelationInput;
  }): Promise<{ data: Category[]; count: number }> {
    const { skip, take, cursor, where, orderBy } = params;

    const categories = await this.prisma.category.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy: orderBy || { name: 'asc' }, // Default urutkan berdasarkan nama A-Z
      include: { _count: { select: { posts: true } } }, // Opsional: hitung jumlah post per kategori
    });
    const count = await this.prisma.category.count({ where });
    return { data: categories, count };
  }

  /**
   * Mendapatkan satu kategori berdasarkan ID.
   * @param id ID kategori
   * @returns Kategori yang dicari
   * @throws NotFoundException jika kategori tidak ditemukan
   */
  async findOneById(id: number): Promise<Category | null> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      // include: { posts: { select: { id: true, title: true, slug: true } } } // Opsional: tampilkan beberapa field post
    });

    if (!category) {
      throw new NotFoundException(
        `Kategori dengan ID "${id}" tidak ditemukan.`,
      );
    }
    return category;
  }

  /**
   * Mendapatkan satu kategori berdasarkan slug.
   * @param slug Slug kategori
   * @returns Kategori yang dicari
   * @throws NotFoundException jika kategori tidak ditemukan
   */
  async findOneBySlug(slug: string): Promise<Category | null> {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      // include: { posts: true }, // Opsional: tampilkan semua post dalam kategori ini
    });

    if (!category) {
      throw new NotFoundException(
        `Kategori dengan slug "${slug}" tidak ditemukan.`,
      );
    }
    return category;
  }

  /**
   * Memperbarui kategori.
   * @param id ID kategori yang akan diperbarui
   * @param updateCategoryDto Data untuk memperbarui kategori
   * @returns Kategori yang telah diperbarui
   * @throws NotFoundException jika kategori tidak ditemukan
   */
  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const { name, slug: customSlug } = updateCategoryDto;

    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!existingCategory) {
      throw new NotFoundException(
        `Kategori dengan ID "${id}" tidak ditemukan.`,
      );
    }

    const categoryUpdateData: Prisma.CategoryUpdateInput = {};

    if (name !== undefined) {
      // Jika nama diubah, periksa apakah nama baru sudah digunakan oleh kategori lain
      if (name !== existingCategory.name) {
        const categoryWithNewName = await this.prisma.category.findUnique({
          where: { name },
        });
        if (categoryWithNewName && categoryWithNewName.id !== id) {
          throw new ConflictException(
            `Kategori dengan nama "${name}" sudah ada.`,
          );
        }
      }
      categoryUpdateData.name = name;
    }

    // Handle slug: generate baru jika nama berubah dan tidak ada customSlug, atau gunakan customSlug jika ada
    if (customSlug) {
      const newSlug = await this.generateUniqueSlug(customSlug, id);
      if (newSlug !== existingCategory.slug) {
        // Hanya update jika slugnya berbeda
        const categoryWithNewSlug = await this.prisma.category.findUnique({
          where: { slug: newSlug },
        });
        if (categoryWithNewSlug && categoryWithNewSlug.id !== id) {
          throw new ConflictException(
            `Slug "${newSlug}" sudah digunakan oleh kategori lain.`,
          );
        }
        categoryUpdateData.slug = newSlug;
      }
    } else if (name && name !== existingCategory.name) {
      // Jika nama diubah dan tidak ada custom slug, generate slug baru dari nama baru
      categoryUpdateData.slug = await this.generateUniqueSlug(name, id);
    }

    // Hanya lakukan update jika ada data yang berubah
    if (Object.keys(categoryUpdateData).length === 0) {
      return existingCategory; // Tidak ada yang diubah, kembalikan data yang ada
    }

    try {
      return await this.prisma.category.update({
        where: { id },
        data: categoryUpdateData,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.target as string[];
          if (target && target.includes('name')) {
            throw new ConflictException(
              `Kategori dengan nama "${categoryUpdateData.name || existingCategory.name}" sudah ada.`,
            );
          }
          if (target && target.includes('slug')) {
            throw new ConflictException(
              `Slug "${categoryUpdateData.slug || existingCategory.slug}" sudah digunakan.`,
            );
          }
        } else if (error.code === 'P2025') {
          // Record to update not found
          throw new NotFoundException(
            `Kategori dengan ID "${id}" tidak ditemukan saat mencoba update.`,
          );
        }
      }
      console.error('Error updating category:', error);
      throw new InternalServerErrorException('Gagal memperbarui kategori.');
    }
  }

  /**
   * Menghapus kategori.
   * @param id ID kategori yang akan dihapus
   * @returns Kategori yang telah dihapus
   * @throws NotFoundException jika kategori tidak ditemukan
   * @throws BadRequestException jika kategori masih memiliki post terkait (karena onDelete: SetNull pada Post.categoryId)
   */
  async remove(id: number): Promise<Category> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { posts: true } } }, // Hitung jumlah post terkait
    });

    if (!category) {
      throw new NotFoundException(
        `Kategori dengan ID "${id}" tidak ditemukan.`,
      );
    }

    // Berdasarkan skema Prisma Anda: `Post.categoryId onDelete: SetNull`
    // Ini berarti jika kategori dihapus, `categoryId` pada post terkait akan menjadi NULL.
    // Jika Anda ingin mencegah penghapusan kategori yang masih memiliki post, Anda bisa menambahkan logika ini:
    // if (category._count.posts > 0) {
    //   throw new BadRequestException(
    //     `Kategori "${category.name}" tidak dapat dihapus karena masih memiliki ${category._count.posts} post terkait. Harap pindahkan atau hapus post terlebih dahulu.`,
    //   );
    // }
    // Namun, karena onDelete: SetNull, Prisma akan menangani ini.
    // Jika Anda ingin perilaku yang berbeda (misalnya, melarang penghapusan), Anda perlu mengubah skema atau menambahkan validasi seperti di atas.

    try {
      return await this.prisma.category.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          // An operation failed because it depends on one or more records that were required but not found.
          throw new NotFoundException(
            `Kategori dengan ID "${id}" tidak ditemukan saat mencoba menghapus.`,
          );
        }
      }
      console.error('Error deleting category:', error);
      throw new InternalServerErrorException('Gagal menghapus kategori.');
    }
  }
}
