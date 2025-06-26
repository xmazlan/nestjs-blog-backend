// src/tags/tags.controller.ts
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
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
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

@ApiTags('Tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @UseGuards(JwtAuthGuard) // Hanya user terautentikasi yang bisa membuat tag
  // @UseGuards(JwtAuthGuard, PermissionsGuard) // Contoh jika menggunakan permission
  // @Permissions('manage-tags') // Contoh permission
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Membuat tag baru' })
  @ApiResponse({ status: 201, description: 'Tag berhasil dibuat.' })
  @ApiResponse({ status: 400, description: 'Input tidak valid.' })
  @ApiResponse({ status: 401, description: 'Tidak Terautentikasi.' })
  @ApiResponse({ status: 403, description: 'Tidak Diizinkan (Forbidden).' })
  @ApiResponse({ status: 409, description: 'Konflik, nama tag sudah ada.' })
  async create(@Body() createTagDto: CreateTagDto) {
    return this.tagsService.create(createTagDto);
  }

  @Get()
  @ApiOperation({ summary: 'Mendapatkan semua tag dengan filter dan paginasi' })
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
    description: 'Cari berdasarkan nama tag',
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    type: String,
    description: 'Urutkan hasil (contoh: name:asc)',
    example: 'name:asc',
  })
  @ApiResponse({ status: 200, description: 'Daftar tag berhasil diambil.' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('orderBy', new DefaultValuePipe('name:asc')) orderBy?: string,
  ) {
    const take = limit > 0 ? limit : 10;
    const skip = (page - 1) * take;

    const where: Prisma.TagWhereInput = {};
    if (search) {
      where.OR = [
        // Cari di nama atau slug
        { name: { contains: search } }, // mode: tidak didukung di MySQL
        { slug: { contains: search } }, // mode: tidak didukung di MySQL
      ];
    }

    let orderByCondition: Prisma.TagOrderByWithRelationInput = { name: 'asc' };
    if (orderBy) {
      const [field, direction] = orderBy.split(':');
      if (field && (direction === 'asc' || direction === 'desc')) {
        orderByCondition = { [field]: direction };
      }
    }

    const result = await this.tagsService.findAll({
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
  @ApiOperation({ summary: 'Mendapatkan satu tag berdasarkan slug' })
  @ApiParam({
    name: 'slug',
    description: 'Slug tag',
    example: 'nestjs-framework',
  })
  @ApiResponse({ status: 200, description: 'Tag berhasil ditemukan.' })
  @ApiResponse({ status: 404, description: 'Tag tidak ditemukan.' })
  async findOneBySlug(@Param('slug') slug: string) {
    const tag = await this.tagsService.findOneBySlug(slug);
    if (!tag) {
      throw new NotFoundException(`Tag dengan slug "${slug}" tidak ditemukan.`);
    }
    return tag;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mendapatkan satu tag berdasarkan ID' })
  @ApiParam({ name: 'id', description: 'ID Tag', example: 1 })
  @ApiResponse({ status: 200, description: 'Tag berhasil ditemukan.' })
  @ApiResponse({ status: 404, description: 'Tag tidak ditemukan.' })
  async findOneById(@Param('id', ParseIntPipe) id: number) {
    const tag = await this.tagsService.findOneById(id);
    if (!tag) {
      throw new NotFoundException(`Tag dengan ID "${id}" tidak ditemukan.`);
    }
    return tag;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard) // Hanya user terautentikasi yang bisa update
  // @UseGuards(JwtAuthGuard, PermissionsGuard)
  // @Permissions('manage-tags')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Memperbarui tag' })
  @ApiParam({
    name: 'id',
    description: 'ID Tag yang akan diupdate',
    example: 1,
  })
  @ApiResponse({ status: 200, description: 'Tag berhasil diperbarui.' })
  @ApiResponse({ status: 400, description: 'Input tidak valid.' })
  @ApiResponse({ status: 401, description: 'Tidak Terautentikasi.' })
  @ApiResponse({ status: 403, description: 'Tidak Diizinkan.' })
  @ApiResponse({ status: 404, description: 'Tag tidak ditemukan.' })
  @ApiResponse({
    status: 409,
    description: 'Konflik, nama atau slug sudah digunakan.',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTagDto: UpdateTagDto,
  ) {
    return this.tagsService.update(id, updateTagDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard) // Hanya user terautentikasi yang bisa hapus
  // @UseGuards(JwtAuthGuard, PermissionsGuard)
  // @Permissions('manage-tags')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT) // Mengembalikan 204 No Content jika berhasil
  @ApiOperation({ summary: 'Menghapus tag' })
  @ApiParam({ name: 'id', description: 'ID Tag yang akan dihapus', example: 1 })
  @ApiResponse({ status: 204, description: 'Tag berhasil dihapus.' })
  @ApiResponse({ status: 401, description: 'Tidak Terautentikasi.' })
  @ApiResponse({ status: 403, description: 'Tidak Diizinkan.' })
  @ApiResponse({ status: 404, description: 'Tag tidak ditemukan.' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.tagsService.remove(id);
    // Tidak ada return body untuk 204
  }
}
