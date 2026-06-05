// DTO de creación de tarea (definido por el asistente)

// DTO de creación de tarea con soporte de gastos y categoría de gasto
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { ItemTareaDto } from './item-tarea.dto';

export class CreateTareaDto {
  @IsUUID()
  @IsOptional()
  listaTareaId: string;

  @IsString()
  @IsNotEmpty()
  titulo: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemTareaDto)
  @IsOptional()
  items?: ItemTareaDto[];

  @IsDateString()
  @IsOptional()
  fechaVencimiento?: string;

  @IsIn(['PENDIENTE', 'COMPLETADA', 'CANCELADA'], {
    message: 'El estado debe ser PENDIENTE, COMPLETADA o CANCELADA',
  })
  @IsOptional()
  estado?: string;

  @IsIn(['BAJA', 'MEDIA', 'ALTA'], {
    message: 'La prioridad debe ser BAJA, MEDIA o ALTA',
  })
  @IsOptional()
  prioridad?: string;

  @IsNumber()
  @IsOptional()
  gasto?: number;

  // Categoría de gasto a utilizar cuando esta tarea forme parte
  // de una lista de tareas con gastos agregados.
  @IsUUID()
  @IsOptional()
  categoriaGastoId?: string;

  @IsString()
  @IsNotEmpty()
  horaRecordatorio: string;
}

