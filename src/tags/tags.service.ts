// src/tags/tags.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { Tag, Prisma } from '@prisma/client';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Membuat slug yang unik dari nama tag.
   * Jika slug sudah ada, akan ditambahkan angka di belakangnya.
   * @param name Nama tag
   * @param currentId ID tag saat ini (opsional, untuk update guna mengabaikan slug tag itu sendiri)
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
      const existingTag = await this.prisma.tag.findUnique({
        where: { slug: uniqueSlug },
      });

      if (!existingTag || (currentId && existingTag.id === currentId)) {
        break;
      }

      count++;
      uniqueSlug = `${slug}-${count}`;
    }
    return uniqueSlug;
  }

  /**
   * Membuat tag baru.
   * @param createTagDto Data untuk membuat tag
   * @returns Tag yang baru dibuat
   */
  async create(createTagDto: CreateTagDto): Promise<Tag> {
    const { name } = createTagDto;

    const existingTagByName = await this.prisma.tag.findUnique({
      where: { name },
    });
    if (existingTagByName) {
      throw new ConflictException(`Tag dengan nama "${name}" sudah ada.`);
    }

    const slug = await this.generateUniqueSlug(name);

    try {
      return await this.prisma.tag.create({
        data: {
          name,
          slug,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.target as string[];
          if (target && target.includes('name')) {
            throw new ConflictException(`Tag dengan nama "${name}" sudah ada.`);
          }
          if (target && target.includes('slug')) {
            throw new ConflictException(
              `Slug "${slug}" sudah digunakan. Coba nama lain.`,
            );
          }
        }
      }
      console.error('Error creating tag:', error);
      throw new InternalServerErrorException('Gagal membuat tag.');
    }
  }

  /**
   * Mendapatkan semua tag.
   * @param params Objek parameter untuk filter dan paginasi
   * @returns Daftar tag dan metadata paginasi
   */
  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.TagWhereUniqueInput;
    where?: Prisma.TagWhereInput;
    orderBy?: Prisma.TagOrderByWithRelationInput;
  }): Promise<{ data: Tag[]; count: number }> {
    const { skip, take, cursor, where, orderBy } = params;

    const tags = await this.prisma.tag.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy: orderBy || { name: 'asc' }, // Default urutkan berdasarkan nama A-Z
      // include: { _count: { select: { posts: true } } } // Opsional: hitung jumlah post per tag (melalui PostsTags)
    });
    const count = await this.prisma.tag.count({ where });
    return { data: tags, count };
  }

  /**
   * Mendapatkan satu tag berdasarkan ID.
   * @param id ID tag
   * @returns Tag yang dicari
   * @throws NotFoundException jika tag tidak ditemukan
   */
  async findOneById(id: number): Promise<Tag | null> {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      // include: { posts: { include: { post: true } } } // Opsional: tampilkan post terkait
    });

    if (!tag) {
      throw new NotFoundException(`Tag dengan ID "${id}" tidak ditemukan.`);
    }
    return tag;
  }

  /**
   * Mendapatkan satu tag berdasarkan slug.
   * @param slug Slug tag
   * @returns Tag yang dicari
   * @throws NotFoundException jika tag tidak ditemukan
   */
  async findOneBySlug(slug: string): Promise<Tag | null> {
    const tag = await this.prisma.tag.findUnique({
      where: { slug },
      // include: { posts: { include: { post: true } } } // Opsional: tampilkan post terkait
    });

    if (!tag) {
      throw new NotFoundException(`Tag dengan slug "${slug}" tidak ditemukan.`);
    }
    return tag;
  }

  /**
   * Memperbarui tag.
   * @param id ID tag yang akan diperbarui
   * @param updateTagDto Data untuk memperbarui tag
   * @returns Tag yang telah diperbarui
   * @throws NotFoundException jika tag tidak ditemukan
   */
  async update(id: number, updateTagDto: UpdateTagDto): Promise<Tag> {
    const { name, slug: customSlug } = updateTagDto;

    const existingTag = await this.prisma.tag.findUnique({ where: { id } });
    if (!existingTag) {
      throw new NotFoundException(`Tag dengan ID "${id}" tidak ditemukan.`);
    }

    const tagUpdateData: Prisma.TagUpdateInput = {};

    if (name !== undefined) {
      if (name !== existingTag.name) {
        const tagWithNewName = await this.prisma.tag.findUnique({
          where: { name },
        });
        if (tagWithNewName && tagWithNewName.id !== id) {
          throw new ConflictException(`Tag dengan nama "${name}" sudah ada.`);
        }
      }
      tagUpdateData.name = name;
    }

    if (customSlug) {
      const newSlug = await this.generateUniqueSlug(customSlug, id);
      if (newSlug !== existingTag.slug) {
        const tagWithNewSlug = await this.prisma.tag.findUnique({
          where: { slug: newSlug },
        });
        if (tagWithNewSlug && tagWithNewSlug.id !== id) {
          throw new ConflictException(
            `Slug "${newSlug}" sudah digunakan oleh tag lain.`,
          );
        }
        tagUpdateData.slug = newSlug;
      }
    } else if (name && name !== existingTag.name) {
      tagUpdateData.slug = await this.generateUniqueSlug(name, id);
    }

    if (Object.keys(tagUpdateData).length === 0) {
      return existingTag;
    }

    try {
      return await this.prisma.tag.update({
        where: { id },
        data: tagUpdateData,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const target = error.meta?.target as string[];
          if (target && target.includes('name')) {
            throw new ConflictException(
              `Tag dengan nama "${tagUpdateData.name || existingTag.name}" sudah ada.`,
            );
          }
          if (target && target.includes('slug')) {
            throw new ConflictException(
              `Slug "${tagUpdateData.slug || existingTag.slug}" sudah digunakan.`,
            );
          }
        } else if (error.code === 'P2025') {
          throw new NotFoundException(
            `Tag dengan ID "${id}" tidak ditemukan saat mencoba update.`,
          );
        }
      }
      console.error('Error updating tag:', error);
      throw new InternalServerErrorException('Gagal memperbarui tag.');
    }
  }

  /**
   * Menghapus tag.
   * Jika tag dihapus, entri terkait di tabel pivot PostsTags juga akan dihapus (onDelete: Cascade).
   * @param id ID tag yang akan dihapus
   * @returns Tag yang telah dihapus
   * @throws NotFoundException jika tag tidak ditemukan
   */
  async remove(id: number): Promise<Tag> {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      // include: { _count: { select: { posts: true } } } // Untuk memeriksa apakah ada post terkait
    });

    if (!tag) {
      throw new NotFoundException(`Tag dengan ID "${id}" tidak ditemukan.`);
    }

    // Skema Prisma Anda memiliki onDelete: Cascade pada relasi PostsTags -> Tag.
    // Ini berarti menghapus tag akan secara otomatis menghapus entri terkait di PostsTags.
    // Jika Anda ingin mencegah penghapusan tag yang masih digunakan oleh post,
    // Anda perlu query ke tabel PostsTags terlebih dahulu.
    // const relatedPostsCount = await this.prisma.postsTags.count({ where: { tagId: id } });
    // if (relatedPostsCount > 0) {
    //   throw new BadRequestException(
    //     `Tag "${tag.name}" tidak dapat dihapus karena masih digunakan oleh ${relatedPostsCount} post.`,
    //   );
    // }

    try {
      return await this.prisma.tag.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            `Tag dengan ID "${id}" tidak ditemukan saat mencoba menghapus.`,
          );
        }
      }
      console.error('Error deleting tag:', error);
      throw new InternalServerErrorException('Gagal menghapus tag.');
    }
  }
}
