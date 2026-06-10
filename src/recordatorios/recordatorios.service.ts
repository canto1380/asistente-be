// src/recordatorios/recordatorios.service.ts

import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificacionesService } from 'src/notificaciones/notificaciones.service';
import { EstadoRecordatorio, TipoPeriodo } from '@prisma/client';
import { switchParaDeterminarTipo } from 'utils/funciones';

@Injectable()
export class RecordatoriosService {
  private readonly logger = new Logger(RecordatoriosService.name);

  constructor(
    private prisma: PrismaService,
    private notificacionesService: NotificacionesService,
  ) { }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.log('Ejecutando cron job para buscar recordatorios pendientes...');

    const ahora = new Date();
    const recordatoriosPendientes = await this.prisma.recordatorio.findMany({
      where: {
        activador: {
          lte: ahora, // Menor o igual a la fecha/hora actual
        },
        estado: 'PENDIENTE',
      },
      include: {
        usuario: true, // Para obtener el usuarioId
        evento: true,  // Para el texto de la notificación
        tarea: true,   // Para el texto de la notificación
      },
    });
    this.logger.log('recordatorio: ', recordatoriosPendientes)

    if (recordatoriosPendientes.length === 0) {
      this.logger.log('No hay recordatorios pendientes.');
      return;
    }

    this.logger.log(`Se encontraron ${recordatoriosPendientes.length} recordatorios.`);

    for (const recordatorio of recordatoriosPendientes) {
      const tokens = await this.prisma.pushToken.findMany({
        where: { usuarioId: recordatorio.usuarioId },
      });

      if (tokens.length > 0) {
        const titulo = recordatorio.evento?.titulo ?? recordatorio.tarea?.titulo ?? 'Recordatorio';
        const cuerpo = `¡No lo olvides! Tienes una actividad programada: "${titulo}"`;

        const timestamp = Date.now().toString();
        this.logger.debug(`[DEBUG] Preparando notificación para ${recordatorio.id}. Timestamp generado: ${timestamp}`);

        for (const token of tokens) {
          this.logger.debug(`[DEBUG] Enviando a token: ${token.token.substring(0, 10)}...`);

          // Enviamos el ID del recordatorio en la data para poder posponerlo desde el FE
          await this.notificacionesService.enviarNotificacion(token.token, titulo, cuerpo, {
            recordatorioId: recordatorio.id,
            tipo: recordatorio.eventoId ? 'EVENTO' : 'TAREA',
            timestamp: timestamp, // <--- IMPORTANTE: Hace que cada envío sea único
            sound: 'notificacion.mp3', // Nombre del archivo que guardarás en el Frontend
          });
        }
      }

      // IMPORTANTE: Ya no se cambia el estado aquí. El recordatorio sigue PENDIENTE
      // para que pueda ser pospuesto. Solo se marca como ENVIADO al hacer clic en "Listo".
    }
  }

  async findAllRecordatorios(usuarioId: string, role: string) {
    const where = role === 'ADMIN' ? {} : { usuarioId };
    return this.prisma.recordatorio.findMany({
      where,
      include: {
        evento: true,
        tarea: true,
        listaTarea: true,
      },
      orderBy: { activador: 'desc' },
    });
  }

  async findOneRecordatorio(id: string, usuarioId: string, role: string) {

    if (role === 'ADMIN') {
      const recordatorio = await this.prisma.recordatorio.findUnique({
        where: { id },
        include: { listaTarea: true },
      });
      if (!recordatorio) {
        throw new NotFoundException(`No existe un recordatorio con el id: ${id}`)
      }
      return recordatorio
    }
    if (role === 'ADMINEMPRESA') {
      const recordatorio = await this.prisma.recordatorio.findFirst({
        where: { id, usuarioId },
        include: { listaTarea: true },
      });
      if (!recordatorio) {
        throw new NotFoundException(`No existe un recordatorio con el id: ${id}`)
      }
      return recordatorio
    }
    throw new BadRequestException('Rol no válido para consultar recordatorios');
  }

  async updateActivador(id: string, usuarioId: string, nuevaFecha: Date) {
    const recordatorio = await this.prisma.recordatorio.findFirst({
      where: { id, usuarioId },
    });

    if (!recordatorio) {
      throw new NotFoundException('Recordatorio no encontrado');
    }

    return await this.prisma.recordatorio.update({
      where: { id },
      data: {
        activador: nuevaFecha,
        estado: EstadoRecordatorio.PENDIENTE // Al editar fecha, lo volvemos a poner como pendiente
      },
    });
  }

  async updateEstado(id: string, type: string, usuarioId: string, nuevoEstado: EstadoRecordatorio) {
    const whereClause: any = { usuarioId };

    // Determinamos qué columna filtrar según el tipo
    switch (type) {
      case 'tarea':
        whereClause.tareaId = id;
        break;
      case 'listaTarea':
        whereClause.listaTareaId = id;
        break;
      case 'evento':
        whereClause.eventoId = id;
        break;
      default:
        throw new BadRequestException('Tipo de entidad no válido para actualizar el recordatorio');
    }

    // Buscamos si existe un recordatorio para esa entidad y usuario
    const recordatorio = await this.prisma.recordatorio.findFirst({
      where: whereClause,
    });

    if (recordatorio) {
      return await this.prisma.recordatorio.update({
        where: { id: recordatorio.id },
        data: { estado: nuevoEstado },
      });
    }

    return null;
  }



  async posponerRecordatorio(id: string, usuarioId: string) {
    // Buscamos el recordatorio asegurando que pertenezca al usuario que hace la petición.
    const recordatorio = await this.prisma.recordatorio.findFirst({
      where: { id, usuarioId },
    });

    if (!recordatorio) {
      throw new NotFoundException('Recordatorio no encontrado o no tienes permiso para posponerlo.');
    }

    // Sumamos 10 minutos a la hora actual
    const nuevoActivador = new Date(Date.now() + 10 * 60000);

    return await this.prisma.recordatorio.update({
      where: { id },
      data: {
        activador: nuevoActivador,
        estado: EstadoRecordatorio.PENDIENTE, // Lo volvemos a poner pendiente
      },
    });
  }

  async realizarRecordatorio(id: string, usuarioId: string) {
    // Buscamos el recordatorio para validar que pertenece al usuario.
    const recordatorio = await this.prisma.recordatorio.findFirst({
      where: { id, usuarioId },
    });

    if (!recordatorio) {
      throw new NotFoundException('Recordatorio no encontrado o no tienes permiso.');
    }

    return await this.prisma.recordatorio.update({
      where: { id },
      data: { estado: EstadoRecordatorio.ENVIADO }, // Marcamos como ENVIADO
    });
  }

  async crearActualizarRecordatorioParaTareaIndependiente(
    tareaId: string,
    usuarioId: string,
    estado: any,
    fechaVencimiento: string,
    hora: string = '15:00'
  ) {

    /** Verificamos si ya existe un recordatorio para esta tarea **/
    const recordatorioExistente = await this.prisma.recordatorio.findFirst({
      where: { tareaId },
    });

    /** Preparacion de fecha para el recordatorio **/
    const fechaVencimientoDate = new Date(fechaVencimiento);
    // Usamos toISOString() sobre el objeto Date para asegurarnos de tener siempre el formato YYYY-MM-DD correcto
    const datePart = fechaVencimientoDate.toISOString().split('T')[0];
    const isoStringArgentina = `${datePart}T${hora}:00-03:00`;
    const fechaActivador = new Date(isoStringArgentina);
    // Ajuste de zona horaria: restamos 3hs a 'now' para alinear la comparación con la hora Argentina y evitar que falle por ser UTC
    const offsetArgentina = 3 * 60 * 60 * 1000;
    if (fechaActivador.getTime() > (Date.now() - offsetArgentina)) {
      if (!recordatorioExistente) {
        return await this.prisma.recordatorio.create({
          data: {
            usuarioId: usuarioId,
            tareaId: tareaId,
            activador: fechaActivador,
            estado: estado,
          }
        })
      } else {
        return await this.prisma.recordatorio.update({
          where: { id: recordatorioExistente.id },
          data: {
            activador: fechaActivador,
            estado: estado,
          }
        })
      }
    }
    return
  }
  async crearActualizarRecordatorioParaListaTarea(
    usuarioId: string,
    listaTarea: any

  ) {
    if (listaTarea && listaTarea.fin) {
      const activador = listaTarea.fin
      const fechaActivador = new Date(activador)

      const existeRecordatorioDeLista = await this.prisma.recordatorio.findFirst({
        where: { listaTareaId: listaTarea.id }
      })

      if (fechaActivador && fechaActivador > new Date()) {
        if (!existeRecordatorioDeLista) {
          return await this.prisma.recordatorio.create({
            data: {
              usuarioId: usuarioId,
              listaTareaId: listaTarea.id, // Vinculamos a la lista para que el check funcione a futuro
              activador: fechaActivador,
              estado: 'PENDIENTE',
            }
          })
        } else {
          return await this.prisma.recordatorio.update({
            where: { id: existeRecordatorioDeLista.id },
            data: {
              activador: fechaActivador,
              estado: 'PENDIENTE',
            }
          })
        }
      } else {
        this.logger.warn(`No se creó recordatorio para la lista ${listaTarea.id} porque la fecha fin es anterior a la actual.`);
        return null;
      }
    } else {
      throw new BadRequestException('No existe la lista y su fecha de finalización.')
    }
  }

  async crearActualizarRecordatorioParaEvento(eventoId: string, usuarioId: string, estado: EstadoRecordatorio, fechaRecordatorio: Date) {
    const recordatorioExistente = await this.prisma.recordatorio.findFirst({
      where: { eventoId: eventoId }
    });

    if (recordatorioExistente) {
      await this.prisma.recordatorio.update({
        where: { id: recordatorioExistente.id },
        data: {
          activador: fechaRecordatorio,
          estado: 'PENDIENTE'
        }
      });
    } else {
      await this.prisma.recordatorio.create({
        data: {
          usuarioId: usuarioId,
          eventoId: eventoId,
          activador: fechaRecordatorio,
          estado: 'PENDIENTE',
        },
      });
    }
  }

  async updateRecordatorio(id: string, recordatorio: any, usuarioId: string, role: string) {
    const aa = await this.findOneRecordatorio(id, usuarioId, role);
    await this.prisma.recordatorio.update({
      where: { id },
      data: {
        activador: recordatorio.activador,
        estado: 'PENDIENTE',
        usuarioId
      },
    });
    return { message: `Recordatorio actualizado correctamente` };
  }

  // Cambiamos el nombre para que sea genérico y soporte eliminación por ID de recordatorio
  async eliminarRecordatorio(id: string, usuarioId: string, type: string) {
    const whereClause: any = switchParaDeterminarTipo(type, usuarioId, id)

    const recordatorioAEliminar = await this.prisma.recordatorio.findFirst({
      where: whereClause,
    })
    if (recordatorioAEliminar) {
      return await this.prisma.recordatorio.delete({
        where: { id: recordatorioAEliminar.id },
      });
    }
    return
  }
  // Funcion de REQUEST
  async removeRecordatorio(id: string, usuarioId: string, role: string) {
    const recordatorioAEliminar = await this.findOneRecordatorio(id, usuarioId, role)
    if (recordatorioAEliminar) {
      return await this.prisma.recordatorio.delete({
        where: { id: recordatorioAEliminar.id },
      });
    }
    return
  }
}
