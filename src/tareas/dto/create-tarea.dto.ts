// DTO de creación de tarea (definido por el asistente)

// DTO de creación de tarea con soporte de gastos y categoría de gasto
import { IsDateString, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

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

