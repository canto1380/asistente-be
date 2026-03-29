import { IsBoolean, IsDateString, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class CreateEventoDto {
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsOptional()
  descripcion: string;

  @IsString()
  @IsOptional()
  ubicacion: string;

  @IsString()
  @IsOptional()
  direccion: string;

  @IsString()
  @IsOptional()
  link: string;

  @IsString()
  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'La hora debe tener el formato HH:mm' })
  hora: string;

  @IsBoolean()
  @IsNotEmpty()
  activo: boolean;

  @IsIn(['PENDIENTE', 'COMPLETADA', 'CANCELADA'], {
    message: 'El estado debe ser pendiente, completa o cancelada',
  })
  estado: string;

  @IsString()
  @IsNotEmpty()
  prioridad: string;

  @IsDateString()
  @IsOptional()
  inicio: string;

  @IsBoolean()
  @IsOptional()
  todoElDia: boolean;

  // Datos opcionales para registrar automáticamente un gasto asociado al evento
  @IsNumber()
  @IsOptional()
  gastoTotal?: number;

  @IsUUID()
  @IsOptional()
  categoriaGastoId?: string;
}
