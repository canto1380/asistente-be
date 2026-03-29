import { IsBoolean, IsDate, IsDateString, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateListaTareaDto {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsIn(['SEMANAL', 'MENSUAL', 'CUSTOM'], {
    message: 'El tipoPeriodo debe ser SEMANAL, MENSUAL o CUSTOM',
  })
  @IsOptional()
  tipoPeriodo?: string;

  @IsNumber()
  @IsOptional()
  gastoTotal?: number;

  @IsBoolean()
  @IsOptional()
  estado?: boolean;

  @IsUUID()
  @IsNotEmpty()
  categoriaGastoId: string;

  @IsNumber()
  @IsNotEmpty()
  mes: number;

  @IsNumber()
  @IsNotEmpty()
  anio: number;

  @IsDateString()
  @IsOptional()
  inicio?: Date;

  @IsDateString()
  @IsOptional()
  fin?: Date;

  @IsString()
  @IsNotEmpty()
  horaRecordatorio: string;
}

