import { IsIn } from "class-validator"

export class UpdateEventoStatusDto {

    @IsIn(['PENDIENTE', 'COMPLETADA', 'CANCELADA'], {
        message: 'El estado debe ser pendiente, completa o cancelada',
    })
    estado: string;
}
