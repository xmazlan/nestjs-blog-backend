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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Sesuaikan path jika perlu
import { Prisma } from '@prisma/client';
// Impor RolesGuard dan PermissionsGuard jika Anda ingin kontrol akses yang lebih granular
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { PermissionsGuard } from '../auth/guards/permissions.guard';
// import { Roles } from '../auth/decorators/roles.decorator';
// import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard) // Hanya user terautentikasi yang bisa membuat kategori
  // @UseGuards(JwtAuthGuard, PermissionsGuard) // Contoh jika menggunakan permission
  // @Permissions('manage-categories') // Contoh permission
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Membuat kategori baru' })
  @ApiResponse({ status: 201, description: 'Kategori berhasil dibuat.' })
  @ApiResponse({ status: 400, description: 'Input tidak valid.' })
  @ApiResponse({ status: 401, description: 'Tidak Terautentikasi.' })
  @ApiResponse({ status: 403, description: 'Tidak Diizinkan (Forbidden).' })
  @ApiResponse({
    status: 409,
    description: 'Konflik, nama kategori sudah ada.',
  })
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Mendapatkan semua kategori dengan filter dan paginasi',
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
    name: 'search',
    required: false,
    type: String,
    description: 'Cari berdasarkan nama kategori',
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    type: String,
    description: 'Urutkan hasil (contoh: name:asc)',
    example: 'name:asc',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar kategori berhasil diambil.',
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('orderBy', new DefaultValuePipe('name:asc')) orderBy?: string,
  ) {
    const take = limit > 0 ? limit : 10;
    const skip = (page - 1) * take;

    const where: Prisma.CategoryWhereInput = {};
    if (search) {
      where.OR = [
        // Cari di nama atau slug - properti mode: 'insensitive' tidak diperlukan
        // dan tidak tersedia di Prisma Client API untuk penyedia MySQL
        { name: { contains: search } }, //mode: 'insensitive'
        { slug: { contains: search } }, //mode: 'insensitive'
      ];
    }

    let orderByCondition: Prisma.CategoryOrderByWithRelationInput = {
      name: 'asc',
    };
    if (orderBy) {
      const [field, direction] = orderBy.split(':');
      if (field && (direction === 'asc' || direction === 'desc')) {
        orderByCondition = { [field]: direction };
      }
    }

    const result = await this.categoriesService.findAll({
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
  @ApiOperation({ summary: 'Mendapatkan satu kategori berdasarkan slug' })
  @ApiParam({
    name: 'slug',
    description: 'Slug kategori',
    example: 'berita-teknologi',
  })
  @ApiResponse({ status: 200, description: 'Kategori berhasil ditemukan.' })
  @ApiResponse({ status: 404, description: 'Kategori tidak ditemukan.' })
  async findOneBySlug(@Param('slug') slug: string) {
    const category = await this.categoriesService.findOneBySlug(slug);
    if (!category) {
      throw new NotFoundException(
        `Kategori dengan slug "${slug}" tidak ditemukan.`,
      );
    }
    return category;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mendapatkan satu kategori berdasarkan ID' })
  @ApiParam({ name: 'id', description: 'ID Kategori', example: 1 })
  @ApiResponse({ status: 200, description: 'Kategori berhasil ditemukan.' })
  @ApiResponse({ status: 404, description: 'Kategori tidak ditemukan.' })
  async findOneById(@Param('id', ParseIntPipe) id: number) {
    const category = await this.categoriesService.findOneById(id);
    if (!category) {
      throw new NotFoundException(
        `Kategori dengan ID "${id}" tidak ditemukan.`,
      );
    }
    return category;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard) // Hanya user terautentikasi yang bisa update
  // @UseGuards(JwtAuthGuard, PermissionsGuard)
  // @Permissions('manage-categories')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Memperbarui kategori' })
  @ApiParam({
    name: 'id',
    description: 'ID Kategori yang akan diupdate',
    example: 1,
  })
  @ApiResponse({ status: 200, description: 'Kategori berhasil diperbarui.' })
  @ApiResponse({ status: 400, description: 'Input tidak valid.' })
  @ApiResponse({ status: 401, description: 'Tidak Terautentikasi.' })
  @ApiResponse({ status: 403, description: 'Tidak Diizinkan.' })
  @ApiResponse({ status: 404, description: 'Kategori tidak ditemukan.' })
  @ApiResponse({
    status: 409,
    description: 'Konflik, nama atau slug sudah digunakan.',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard) // Hanya user terautentikasi yang bisa hapus
  // @UseGuards(JwtAuthGuard, PermissionsGuard)
  // @Permissions('manage-categories')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT) // Mengembalikan 204 No Content jika berhasil
  @ApiOperation({ summary: 'Menghapus kategori' })
  @ApiParam({
    name: 'id',
    description: 'ID Kategori yang akan dihapus',
    example: 1,
  })
  @ApiResponse({ status: 204, description: 'Kategori berhasil dihapus.' })
  @ApiResponse({ status: 401, description: 'Tidak Terautentikasi.' })
  @ApiResponse({ status: 403, description: 'Tidak Diizinkan.' })
  @ApiResponse({ status: 404, description: 'Kategori tidak ditemukan.' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.categoriesService.remove(id);
    // Tidak ada return body untuk 204
  }
}
