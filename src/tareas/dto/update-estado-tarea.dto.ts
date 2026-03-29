import { IsEnum } from "class-validator";

export enum EstadoTarea {
    PENDIENTE = 'PENDIENTE',
    COMPLETADA = 'COMPLETADA',
    CANCELADA = 'CANCELADA',
  }
  
  export class UpdateEstadoTareaDto {
    @IsEnum(EstadoTarea, {
      message: 'El estado debe ser PENDIENTE, COMPLETADA o CANCELADA',
    })
    estado: EstadoTarea;

  }