import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator'; // Perlu install class-validator dan class-transformer

export class RegisterAuthDto {
  @IsNotEmpty({ message: 'Username tidak boleh kosong' })
  @IsString()
  username: string;

  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  @IsEmail({}, { message: 'Format email tidak valid' })
  email: string;

  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @IsString()
  @MinLength(8, { message: 'Password minimal harus 8 karakter' })
  password: string;

  // Anda bisa menambahkan field lain jika perlu, misal 'name'
  @IsString()
  @IsNotEmpty()
  name?: string;
}