// src/posts/posts.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post, Prisma } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Membuat slug yang unik dari judul.
   * Jika slug sudah ada, akan ditambahkan angka di belakangnya.
   * @param title Judul post
   * @param currentId ID post saat ini (opsional, untuk update guna mengabaikan slug post itu sendiri)
   * @returns Slug yang unik
   */
  private async generateUniqueSlug(
    title: string,
    currentId?: number,
  ): Promise<string> {
    let slug = title
      .toLowerCase()
      .replace(/\s+/g, '-') // Ganti spasi dengan strip
      .replace(/[^\w-]+/g, ''); // Hapus karakter non-alfanumerik kecuali strip

    let count = 0;
    let uniqueSlug = slug;

    // Looping untuk mencari slug unik
    while (true) {
      const existingPost = await this.prisma.post.findUnique({
        where: { slug: uniqueSlug },
      });

      // Jika tidak ada post dengan slug ini, ATAU post yang ditemukan adalah post yang sedang kita update
      if (!existingPost || (currentId && existingPost.id === currentId)) {
        break;
      }

      count++;
      uniqueSlug = `${slug}-${count}`;
    }
    return uniqueSlug;
  }

  /**
   * Membuat post baru.
   * @param createPostDto Data untuk membuat post
   * @param authorId ID pengguna yang membuat post
   * @returns Post yang baru dibuat
   */
  async create(createPostDto: CreatePostDto, authorId: number): Promise<Post> {
    const { title, content, imagePath, categoryId, tagIds, published } =
      createPostDto;

    if (!authorId) {
      throw new BadRequestException('Author ID tidak boleh kosong.');
    }

    const slug = await this.generateUniqueSlug(title);

    try {
      const postData: Prisma.PostCreateInput = {
        title,
        slug,
        content,
        imagePath,
        published: published || false, // Default ke false (draft) jika tidak disediakan
        author: {
          connect: { id: authorId },
        },
      };

      if (categoryId) {
        postData.category = {
          connect: { id: categoryId },
        };
      }

      if (tagIds && tagIds.length > 0) {
        postData.tags = {
          create: tagIds.map((id) => ({
            tag: { connect: { id } },
          })),
        };
      }

      return await this.prisma.post.create({
        data: postData,
        include: {
          author: {
            select: { id: true, name: true, email: true, username: true },
          },
          category: true,
          tags: { include: { tag: true } },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          // Record to connect not found
          throw new BadRequestException(
            'Satu atau lebih ID (author, category, atau tag) tidak ditemukan.',
          );
        }
      }
      console.error('Error creating post:', error);
      throw new InternalServerErrorException('Gagal membuat post.');
    }
  }

  /**
   * Mendapatkan semua post dengan opsi filter dan paginasi.
   * @param params Objek parameter untuk filter dan paginasi
   * @returns Daftar post dan metadata paginasi
   */
  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PostWhereUniqueInput;
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithRelationInput;
  }): Promise<{ data: Post[]; count: number }> {
    const { skip, take, cursor, where, orderBy } = params;

    const posts = await this.prisma.post.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy: orderBy || { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, name: true, email: true, username: true },
        },
        category: true,
        tags: { include: { tag: true } },
      },
    });

    const count = await this.prisma.post.count({ where });
    return { data: posts, count };
  }

  /**
   * Mendapatkan satu post berdasarkan ID.
   * @param id ID post
   * @returns Post yang dicari
   * @throws NotFoundException jika post tidak ditemukan
   */
  async findOneById(id: number): Promise<Post | null> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, email: true, username: true },
        },
        category: true,
        tags: { include: { tag: true } },
        comments: {
          // Sertakan komentar jika diperlukan
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { id: true, name: true, username: true } },
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Post dengan ID "${id}" tidak ditemukan.`);
    }
    return post;
  }

  /**
   * Mendapatkan satu post berdasarkan slug.
   * Hanya mengambil post yang sudah dipublikasi jika tidak ada status spesifik.
   * @param slug Slug post
   * @returns Post yang dicari
   * @throws NotFoundException jika post tidak ditemukan
   */
  async findOneBySlug(slug: string): Promise<Post | null> {
    const post = await this.prisma.post.findUnique({
      where: { slug, published: true }, // Secara default hanya cari yang published
      include: {
        author: {
          select: { id: true, name: true, email: true, username: true },
        },
        category: true,
        tags: { include: { tag: true } },
        comments: {
          where: { moderationStatus: 'approved' }, // Hanya komentar yang disetujui
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { id: true, name: true, username: true } },
          },
        },
      },
    });

    if (!post) {
      // Bisa juga mencari di draft jika diperlukan, tergantung logika aplikasi
      const draftPost = await this.prisma.post.findUnique({
        where: { slug, published: false },
        include: {
          author: {
            select: { id: true, name: true, email: true, username: true },
          },
          category: true,
          tags: { include: { tag: true } },
        },
      });
      if (draftPost) return draftPost; // Kembalikan draft jika ditemukan dan logic mengizinkan
      throw new NotFoundException(
        `Post dengan slug "${slug}" tidak ditemukan atau belum dipublikasikan.`,
      );
    }
    return post;
  }

  /**
   * Memperbarui post.
   * @param id ID post yang akan diperbarui
   * @param updatePostDto Data untuk memperbarui post
   * @param userId ID pengguna yang melakukan update (untuk validasi kepemilikan jika perlu)
   * @returns Post yang telah diperbarui
   * @throws NotFoundException jika post tidak ditemukan
   */
  async update(
    id: number,
    updatePostDto: UpdatePostDto,
    userId?: number,
  ): Promise<Post> {
    const {
      title,
      content,
      imagePath,
      categoryId,
      tagIds,
      published,
      slug: customSlug,
    } = updatePostDto;

    const existingPost = await this.prisma.post.findUnique({
      where: { id },
      include: { tags: true }, // Untuk membandingkan tag yang ada
    });

    if (!existingPost) {
      throw new NotFoundException(`Post dengan ID "${id}" tidak ditemukan.`);
    }

    // Opsional: Validasi kepemilikan - uncomment dan sesuaikan jika perlu
    // if (userId && existingPost.authorId !== userId) {
    //   throw new ForbiddenException('Anda tidak memiliki izin untuk mengupdate post ini.');
    // }

    const postUpdateData: Prisma.PostUpdateInput = {};

    if (title !== undefined) postUpdateData.title = title;
    if (content !== undefined) postUpdateData.content = content;
    if (imagePath !== undefined) postUpdateData.imagePath = imagePath; // Bisa null untuk menghapus
    if (published !== undefined) postUpdateData.published = published;

    // Handle slug: generate baru jika title berubah dan tidak ada customSlug, atau gunakan customSlug jika ada
    if (customSlug) {
      postUpdateData.slug = await this.generateUniqueSlug(customSlug, id);
    } else if (title && title !== existingPost.title) {
      postUpdateData.slug = await this.generateUniqueSlug(title, id);
    }

    // Handle categoryId
    if (categoryId !== undefined) {
      // Jika categoryId ada di DTO
      if (categoryId === null) {
        // Jika null, disconnect category
        postUpdateData.category = { disconnect: true };
      } else {
        // Jika ada ID, connect ke category baru
        postUpdateData.category = { connect: { id: categoryId } };
      }
    }

    // Handle tags: Ini sedikit lebih kompleks karena many-to-many
    // Kita akan menghapus tag yang tidak ada di tagIds baru, dan menambahkan tag baru.
    if (tagIds !== undefined) {
      // Jika tagIds ada di DTO (bisa array kosong)
      const currentTagIds = existingPost.tags.map((pt) => pt.tagId);
      const tagsToDisconnect = currentTagIds.filter(
        (tagId) => !tagIds.includes(tagId),
      );
      const tagsToConnect = tagIds.filter(
        (tagId) => !currentTagIds.includes(tagId),
      );

      const tagOperations: Prisma.PostsTagsUpdateManyWithoutPostNestedInput = {};
      if (tagsToDisconnect.length > 0) {
        tagOperations.deleteMany = tagsToDisconnect.map((tagId) => ({
          tagId,
          postId: id,
        }));
      }
      if (tagsToConnect.length > 0) {
        tagOperations.create = tagsToConnect.map((tagId) => ({
          tag: { connect: { id: tagId } },
        }));
      }
      postUpdateData.tags = tagOperations;
    }

    try {
      return await this.prisma.post.update({
        where: { id },
        data: postUpdateData,
        include: {
          author: { select: { id: true, name: true, email: true, username: true } },
          category: true,
          tags: { include: { tag: true } },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new BadRequestException(
            'Gagal mengupdate post. Pastikan ID post, kategori, atau tag valid.',
          );
        }
        if (
          error.code === 'P2002' &&
          error.meta?.target &&
          (error.meta.target as string[]).includes('slug')
        ) {
          throw new BadRequestException(
            `Slug '${postUpdateData.slug || existingPost.slug}' sudah digunakan. Harap pilih slug lain.`,
          );
        }
      }
      console.error('Error updating post:', error);
      throw new InternalServerErrorException('Gagal mengupdate post.');
    }
  }

  /**
   * Menghapus post.
   * @param id ID post yang akan dihapus
   * @param userId ID pengguna yang melakukan penghapusan (untuk validasi kepemilikan jika perlu)
   * @returns Post yang telah dihapus
   * @throws NotFoundException jika post tidak ditemukan
   */
  async remove(id: number, userId?: number): Promise<Post> {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) {
      throw new NotFoundException(`Post dengan ID "${id}" tidak ditemukan.`);
    }

    // Opsional: Validasi kepemilikan - uncomment dan sesuaikan jika perlu
    // if (userId && post.authorId !== userId) {
    //   throw new ForbiddenException('Anda tidak memiliki izin untuk menghapus post ini.');
    // }

    try {
      // Relasi PostsTags akan terhapus otomatis karena onDelete: Cascade di skema
      return await this.prisma.post.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      throw new InternalServerErrorException('Gagal menghapus post.');
    }
  }
}
