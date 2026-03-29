import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { TipoDispositivo } from '@prisma/client';

export class CreatePushTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsEnum(TipoDispositivo)
  @IsNotEmpty()
  tipoDispositivo: TipoDispositivo;
}
