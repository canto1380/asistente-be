import { IsEnum } from "class-validator";


  export enum Prioridad {
    PENDIENTE = 'BAJA',
    COMPLETADA = 'MEDIA',
    CANCELADA = 'ALTA',
  }
  
  export class UpdatePrioridadTareaDto {
    @IsEnum(Prioridad, {
        message: 'La prioridad debe ser BAJA, MEDIA o ALTA',
    })
    prioridad: Prioridad
  }