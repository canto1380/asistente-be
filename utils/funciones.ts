import { BadRequestException } from "@nestjs/common";
import { EstadoRecordatorio } from "@prisma/client";

export const switchEstadoRecordatorio = (estado: any): EstadoRecordatorio => {
    let estadoParaRecordatorio: any
    switch (estado) {
        case 'PENDIENTE':
            estadoParaRecordatorio = 'PENDIENTE'
            return estadoParaRecordatorio
        case 'COMPLETADA':
            estadoParaRecordatorio = 'ENVIADO'
            return estadoParaRecordatorio
        case 'CANCELADA':
            estadoParaRecordatorio = 'CANCELADO'
            return estadoParaRecordatorio
        default:
            throw new BadRequestException('Estado de tarea no válido');
    }
}


export const switchParaDeterminarTipo = (type: any, usuarioId: string, id: string): string => {
    const whereClause: any = {usuarioId}
    switch(type) {
        case 'tarea':
          whereClause.tareaId = id
          return whereClause
        case 'lista':
          whereClause.listaTareaId = id
          return whereClause
        case 'evento':
          whereClause.eventoId = id
          return whereClause
        default:
          throw new BadRequestException('Tipo de entidad no válido.');
      }
}