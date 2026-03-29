import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EstadoTarea, Prioridad } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { GastosService } from 'src/gastos/gastos.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { UpdateEventoStatusDto } from './dto/update-evento-status.dto';
import { switchEstadoRecordatorio } from 'utils/funciones';
import { RecordatoriosService } from 'src/recordatorios/recordatorios.service';

@Injectable()
export class EventosService {

  private readonly logger = new Logger(EventosService.name);


  constructor(
    private prisma: PrismaService,
    private gastosService: GastosService,
    private recordatoriosService: RecordatoriosService,
  ) { }

  async createEvento(evento: CreateEventoDto, usuarioId: string) {
    const eventoExiste = await this.prisma.evento.findFirst({
      where: {
        titulo: evento.titulo,
        usuarioId: usuarioId,
      }
    })

    if (eventoExiste) {
      throw new BadRequestException('Ya existe un evento con el mismo título para este usuario.')
    }
    // Desestructuramos para separar la lógica de gastos y recordatorios
    const { categoriaGastoId, gastoTotal, inicio, hora, ...restoEvento } = evento;

    const nuevoEvento = await this.prisma.evento.create({
      data: {
        ...restoEvento,
        inicio: new Date(inicio),
        hora, // Guardamos la hora también
        gastoTotal: gastoTotal ? Number(gastoTotal) : undefined,
        estado: evento.estado as EstadoTarea,
        prioridad: evento.prioridad as Prioridad,
        usuarioId: usuarioId,
      }
    });

    // --- Lógica para crear el Recordatorio ---
    // Solo si se proporciona una hora específica
    if (hora && evento.estado === 'PENDIENTE') {
      // 1. Tomamos la fecha del campo 'inicio' y la hora del campo 'hora'
      // Construimos una fecha ISO 8601 completa especificando la zona horaria de Argentina (ART = UTC-3)
      const datePart = inicio.split('T')[0]; // Extraemos 'YYYY-MM-DD'
      const isoStringArgentina = `${datePart}T${hora}:00-03:00`;
      const fechaDelEvento = new Date(isoStringArgentina);
      this.logger.log('fecha del evento: ', fechaDelEvento)
      // 2. Calculamos 30 minutos antes (30 * 60000 ms)
      const fechaRecordatorio = new Date(fechaDelEvento.getTime() - 30 * 60000);
      this.logger.log('fecha recordatorio: ', fechaRecordatorio)
      this.logger.log('fecha actual: ', new Date())
      // 3. Solo creamos recordatorios para eventos futuros
      // La comparación se hace correctamente en UTC, ya que new Date() también está en UTC.

      if (fechaRecordatorio > new Date()) {
        await this.prisma.recordatorio.create({
          data: {
            usuarioId: usuarioId,
            eventoId: nuevoEvento.id,
            activador: fechaRecordatorio,
            estado: 'PENDIENTE',
          },
        });
      }
    }

    // Si se envía un gasto total y una categoría, registramos automáticamente el gasto del evento
    if (gastoTotal && categoriaGastoId) {
      await this.gastosService.registrarGastoEvento({
        usuarioId,
        eventoId: nuevoEvento.id,
        categoriaGastoId,
        descripcion: nuevoEvento.titulo,
        total: gastoTotal,
        fecha: new Date(inicio)
      });
    }

    return nuevoEvento;
  }

  async findAllEvento(usuarioId: string, role: string) {
    const includeRelations = {
      // Incluimos los gastos asociados y la categoría de cada gasto
      gastos: {
        include: {
          categoriaGasto: true,
        },
      },
    };

    if (role === 'ADMIN') {
      return await this.prisma.evento.findMany({
        include: includeRelations,
        orderBy: {
          inicio: 'desc',
        },
      });
    }
    if (role === 'ADMINEMPRESA') {
      return await this.prisma.evento.findMany({
        where: {
          usuarioId: usuarioId,
        },
        include: includeRelations,
        orderBy: {
          inicio: 'desc',
        },
      });
    }
    throw new BadRequestException('Rol no válido para consultar eventos.');
  }

  async findOneEvento(id: string, usuarioId: string, role: string) {
    if (role === 'ADMIN') {
      const evento = await this.prisma.evento.findUnique({
        where: { id },
        include: { usuario: true }
      })
      if (!evento) {
        throw new NotFoundException(`No existe un evento con el id: ${id}`)
      }
      return evento
    }
    if (role === 'ADMINEMPRESA') {
      const evento = await this.prisma.evento.findUnique({
        where: { id, usuarioId },
        include: { usuario: true }
      })
      if (!evento) {
        throw new NotFoundException(`No existe un evento con el id: ${id}`)
      }
      return evento
    }
    throw new BadRequestException('Rol no válido para consultar eventos');
  }

  async updateEvento(id: string, evento: UpdateEventoDto, usuarioId: string, role: string) {
    // 1. Asegurarse que el evento existe y el usuario tiene acceso
    await this.findOneEvento(id, usuarioId, role);

    // 2. Desestructurar el DTO para separar la lógica de gasto
    const { gastoTotal, categoriaGastoId, ...resto } = evento;
    // 3. Actualizar la entidad Evento
    const eventoActualizado = await this.prisma.evento.update({
      where: { id },
      data: {
        ...resto,
        inicio: resto.inicio ? new Date(resto.inicio) : undefined,
        gastoTotal: gastoTotal || null, // Actualizar el gasto en el propio evento
        estado: evento.estado ? (evento.estado as EstadoTarea) : undefined,
        prioridad: evento.prioridad ? (evento.prioridad as Prioridad) : undefined,
      }
    });

    // 4. Manejar la entidad Gasto asociada
    const gastoExistente = await this.prisma.gasto.findFirst({
      where: { eventoId: id },
    });

    // Caso 1: Se está estableciendo o actualizando un gasto con un valor positivo
    if (gastoTotal && gastoTotal > 0) {
      if (!categoriaGastoId) {
        throw new BadRequestException('Se requiere una categoría de gasto si se especifica un gasto total.');
      }

      if (gastoExistente) {
        // Actualizar el gasto existente
        const fechaRef = eventoActualizado.inicio ? new Date(eventoActualizado.inicio) : new Date();
        const mes = fechaRef.getMonth() + 1;
        const anio = fechaRef.getFullYear();
        await this.prisma.gasto.update({
          where: { id: gastoExistente.id },
          data: {
            total: gastoTotal,
            categoriaGastoId: categoriaGastoId,
            mes,
            anio,
            descripcion: eventoActualizado.titulo,
          },
        });
      } else {
        // Crear un nuevo gasto si no existía
        await this.gastosService.registrarGastoEvento({ usuarioId, eventoId: id, categoriaGastoId, total: gastoTotal, fecha: new Date(eventoActualizado.inicio) });
      }
    } else if (gastoExistente) { // Caso 2: Se está eliminando el gasto (gastoTotal es 0 o nulo)
      await this.prisma.gasto.delete({ where: { id: gastoExistente.id } });
    }

    // 5. Lógica de Recordatorios
    /**
     * Al actualizar un evento, verificamos
     * Si la fecha es posterior a hoy y tiene hora asignada, verificamos si tiene recordatorio, si no tiene, lo creamos
     * si la fecha es posterior a hoy y tiene hora asignada, verificamos si tiene recordatorio, si es asi, actualizamos la hora
     * Si la fecha es anterior a hoy, no se hace nada con recordatorios
     */

    if (eventoActualizado.hora && eventoActualizado.estado === 'PENDIENTE') {
      // verifica si es futuro. si es futuro, verifica si existe un recordatorio. Si existe, lo actualiza, si no existe, lo crea
      const datePart = eventoActualizado.inicio.toISOString().split('T')[0];
      const isoStringArgentina = `${datePart}T${eventoActualizado.hora}:00-03:00`;
      const fechaDelEvento = new Date(isoStringArgentina);
      const fechaRecordatorio = new Date(fechaDelEvento.getTime() - 30 * 60000);

      // Ajuste de zona horaria para la comparación (Argentina UTC-3)
      const offsetArgentina = 3 * 60 * 60 * 1000;
      const isFuture = fechaRecordatorio.getTime() > (Date.now() - offsetArgentina);
      if (isFuture) {
        await this.recordatoriosService.crearActualizarRecordatorioParaEvento(eventoActualizado.id, usuarioId, eventoActualizado.estado, fechaRecordatorio)
      }
    }
    if (eventoActualizado.estado === 'COMPLETADA' || eventoActualizado.estado === 'CANCELADA') {
      //verifica si tiene un recordatorio. Si tiene, actualiza su estado a ENVIADO
    }
    if (!eventoActualizado.hora) {
      // si el evento actualizado no tiene hora y tiene un recordatorio, lo borra
      await this.recordatoriosService.eliminarRecordatorio(id, usuarioId, 'evento')
    }

    return eventoActualizado;
  }

  async updateStatusEvento(id: string, updateStatusDto: UpdateEventoStatusDto, usuarioId: string, role: string) {
    await this.findOneEvento(id, usuarioId, role)

    // Determinar el estado de 'activo' basado en el 'estado' de la tarea.
    // Un evento está 'inactivo' (cerrado) solo si está completado o cancelado.
    const newActivo = updateStatusDto.estado !== 'COMPLETADA' && updateStatusDto.estado !== 'CANCELADA';

    const eventoActualizado = await this.prisma.evento.update({
      where: { id },
      data: {
        estado: updateStatusDto.estado as EstadoTarea,
        activo: newActivo
      }
    })

    // Sincronización del Recordatorio asociado al cambiar el estado
    const estadoParaRecordatorio = switchEstadoRecordatorio(updateStatusDto.estado);
    const recordatorio = await this.prisma.recordatorio.findFirst({
      where: { eventoId: id, usuarioId }
    });

    if (recordatorio) {
      await this.prisma.recordatorio.update({
        where: { id: recordatorio.id },
        data: { estado: estadoParaRecordatorio }
      });
    }



    return { message: `Estado del evento actualizado correctamente` };
  }

  async removeEvento(id: string, usuarioId: string, role: string) {

    // Incluimos los gastos asociados para eliminarlo
    const includeRelations = {
      gastos: {
        include: {
          categoriaGasto: true,
        },
      }
    }

    const gastoAsociado = await this.prisma.gasto.findFirst({ where: { eventoId: id } });
    if (gastoAsociado) {
      throw new BadRequestException('No se puede eliminar el evento porque tiene un gasto asociado.');
    }

    await this.prisma.evento.delete({
      where: { id },
    });

    return { message: `Evento eliminado correctamente.` }
  }
}