import { Injectable, OnModuleInit, OnApplicationShutdown } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnApplicationShutdown {
  async onModuleInit() {
    // Opsional: Prisma secara default melakukan lazy connect,
    // tapi Anda bisa melakukan koneksi eksplisit di sini jika perlu.
    await this.$connect();
    console.log('Prisma Client Connected');
  }

  async onApplicationShutdown(signal?: string) {
    console.log('Prisma Client Disconnecting on signal:', signal);
    await this.$disconnect();
  }

  // Anda bisa menambahkan method custom di sini jika perlu,
  // misalnya untuk transaksi atau logging khusus.
}