// src/posts/posts.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  DefaultValuePipe,
  NotFoundException,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Sesuaikan path jika perlu
import { GetUser } from '../auth/decorators/get-user.decorator'; // Sesuaikan path jika perlu
import { User as UserModel, Prisma } from '@prisma/client'; // Import User model dari Prisma

// Helper interface untuk payload pengguna dari JWT
interface AuthenticatedUser {
  id: number;
  email: string;
  // tambahkan properti lain jika ada di payload JWT Anda
}

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Membuat post baru' })
  @ApiResponse({ status: 201, description: 'Post berhasil dibuat.' })
  @ApiResponse({ status: 400, description: 'Input tidak valid.' })
  @ApiResponse({ status: 401, description: 'Tidak Terautentikasi.' })
  async create(
    @Body() createPostDto: CreatePostDto,
    @GetUser() user: AuthenticatedUser, // Menggunakan GetUser decorator
  ) {
    if (!user || !user.id) {
      throw new NotFoundException(
        'User tidak ditemukan atau tidak terautentikasi.',
      );
    }
    // user.id akan menjadi authorId
    return this.postsService.create(createPostDto, user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'Mendapatkan semua post dengan filter dan paginasi',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Nomor halaman (mulai dari 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Jumlah item per halaman',
    example: 10,
  })
  @ApiQuery({
    name: 'published',
    required: false,
    type: Boolean,
    description: 'Filter berdasarkan status publikasi (true/false)',
    example: true,
  })
  @ApiQuery({
    name: 'authorId',
    required: false,
    type: Number,
    description: 'Filter berdasarkan ID author',
  })
  @ApiQuery({
    name: 'categorySlug',
    required: false,
    type: String,
    description: 'Filter berdasarkan slug kategori',
  })
  @ApiQuery({
    name: 'tagSlug',
    required: false,
    type: String,
    description: 'Filter berdasarkan slug tag',
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    type: String,
    description: 'Urutkan hasil (contoh: createdAt:desc)',
    example: 'createdAt:desc',
  })
  @ApiResponse({ status: 200, description: 'Daftar post berhasil diambil.' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('published') published?: string, // Terima sebagai string, lalu konversi
    @Query('authorId', new DefaultValuePipe(undefined)) authorId?: number,
    @Query('categorySlug') categorySlug?: string,
    @Query('tagSlug') tagSlug?: string,
    @Query('orderBy', new DefaultValuePipe('createdAt:desc')) orderBy?: string,
  ) {
    const take = limit > 0 ? limit : 10;
    const skip = (page - 1) * take;

    const where: Prisma.PostWhereInput = {};
    if (published !== undefined) {
      where.published = published === 'true'; // Konversi string 'true'/'false' ke boolean
    }
    if (authorId) {
      where.authorId = +authorId; // Pastikan dikonversi ke number jika datang sebagai string
    }
    if (categorySlug) {
      where.category = { slug: categorySlug };
    }
    if (tagSlug) {
      where.tags = { some: { tag: { slug: tagSlug } } };
    }

    let orderByCondition: Prisma.PostOrderByWithRelationInput = {
      createdAt: 'desc',
    };
    if (orderBy) {
      const [field, direction] = orderBy.split(':');
      if (field && (direction === 'asc' || direction === 'desc')) {
        if (field === 'author' || field === 'category') {
          // Contoh relasi
          // orderByCondition = { [field]: { name: direction } }; // Ganti 'name' dengan field yang relevan
        } else {
          orderByCondition = { [field]: direction };
        }
      }
    }

    const result = await this.postsService.findAll({
      skip,
      take,
      where,
      orderBy: orderByCondition,
    });
    return {
      data: result.data,
      meta: {
        totalItems: result.count,
        itemsPerPage: take,
        currentPage: page,
        totalPages: Math.ceil(result.count / take),
      },
    };
  }

  @Get('slug/:slug')
  @ApiOperation({
    summary:
      'Mendapatkan satu post berdasarkan slug (hanya yang sudah dipublikasi)',
  })
  @ApiParam({
    name: 'slug',
    description: 'Slug post',
    example: 'panduan-lengkap-belajar-nestjs',
  })
  @ApiResponse({ status: 200, description: 'Post berhasil ditemukan.' })
  @ApiResponse({
    status: 404,
    description: 'Post tidak ditemukan atau belum dipublikasi.',
  })
  async findOneBySlug(@Param('slug') slug: string) {
    const post = await this.postsService.findOneBySlug(slug);
    if (!post) {
      throw new NotFoundException(
        `Post dengan slug "${slug}" tidak ditemukan atau belum dipublikasi.`,
      );
    }
    return post;
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Mendapatkan satu post berdasarkan ID (termasuk draft)',
  })
  @ApiParam({ name: 'id', description: 'ID Post', example: 1 })
  @ApiResponse({ status: 200, description: 'Post berhasil ditemukan.' })
  @ApiResponse({ status: 404, description: 'Post tidak ditemukan.' })
  // Pertimbangkan untuk menambahkan @UseGuards(JwtAuthGuard) jika endpoint ini tidak sepenuhnya publik
  // atau jika Anda ingin membatasi akses ke draft hanya untuk author/admin.
  async findOneById(@Param('id', ParseIntPipe) id: number) {
    const post = await this.postsService.findOneById(id);
    if (!post) {
      throw new NotFoundException(`Post dengan ID "${id}" tidak ditemukan.`);
    }
    return post;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Memperbarui post' })
  @ApiParam({
    name: 'id',
    description: 'ID Post yang akan diupdate',
    example: 1,
  })
  @ApiResponse({ status: 200, description: 'Post berhasil diperbarui.' })
  @ApiResponse({ status: 400, description: 'Input tidak valid.' })
  @ApiResponse({ status: 401, description: 'Tidak Terautentikasi.' })
  @ApiResponse({ status: 403, description: 'Tidak Diizinkan.' }) // Jika ada validasi kepemilikan
  @ApiResponse({ status: 404, description: 'Post tidak ditemukan.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePostDto: UpdatePostDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    // Anda mungkin ingin menambahkan logika otorisasi di sini atau di service
    // misalnya, hanya author post atau admin yang bisa mengupdate.
    // Untuk saat ini, kita hanya meneruskan userId ke service.
    if (!user || !user.id) {
      throw new NotFoundException(
        'User tidak ditemukan atau tidak terautentikasi.',
      );
    }
    return this.postsService.update(id, updatePostDto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT) // Mengembalikan 204 No Content jika berhasil
  @ApiOperation({ summary: 'Menghapus post' })
  @ApiParam({
    name: 'id',
    description: 'ID Post yang akan dihapus',
    example: 1,
  })
  @ApiResponse({ status: 204, description: 'Post berhasil dihapus.' })
  @ApiResponse({ status: 401, description: 'Tidak Terautentikasi.' })
  @ApiResponse({ status: 403, description: 'Tidak Diizinkan.' }) // Jika ada validasi kepemilikan
  @ApiResponse({ status: 404, description: 'Post tidak ditemukan.' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: AuthenticatedUser,
  ) {
    // Sama seperti update, pertimbangkan logika otorisasi.
    if (!user || !user.id) {
      throw new NotFoundException(
        'User tidak ditemukan atau tidak terautentikasi.',
      );
    }
    await this.postsService.remove(id, user.id);
    // Tidak ada return body untuk 204
  }
}
