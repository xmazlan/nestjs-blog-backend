import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginAuthDto {
  @IsNotEmpty({ message: 'Username atau email tidak boleh kosong' })
  @IsString()
  identifier: string; // Field ini bisa berisi username atau email

  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @IsString()
  // Tambahkan validasi panjang minimal jika perlu di sini juga
  @MinLength(8, { message: 'Password minimal harus 8 karakter' })
  password: string;
}
