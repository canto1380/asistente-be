import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateGastoDto {

  @IsUUID()
  @IsNotEmpty()
  categoriaGastoId: string;

  @IsUUID()
  @IsOptional()
  listaTareaId?: string;

  @IsUUID()
  @IsOptional()
  eventoId?: string;

  @IsNumber()
  @IsNotEmpty()
  total: number;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsNotEmpty()
  mes: string;

  @IsString()
  @IsNotEmpty()
  anio: string;
}
