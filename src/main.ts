import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Aktifkan ValidationPipe secara global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Hanya izinkan properti yang didefinisikan di DTO
    forbidNonWhitelisted: true, // Tolak request jika ada properti tak dikenal
    transform: true, // Otomatis transform payload ke instance DTO
  }));

  // Tambahkan konfigurasi lain jika perlu (misal: CORS, prefix global)
  // app.enableCors();
  // app.setGlobalPrefix('api');

  await app.listen(process.env.PORT || 3000); // Gunakan port dari env atau default 3000
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
