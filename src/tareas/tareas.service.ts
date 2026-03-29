import { BadRequestException, ForbiddenException, Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { EstadoTarea, Prioridad, TipoPeriodo } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { GastosService } from 'src/gastos/gastos.service';
import { ListasTareasService } from 'src/listas-tareas/listas-tareas.service'
import { CreateTareaDto } from './dto/create-tarea.dto';
import { UpdateTareaDto } from './dto/update-tarea.dto';
import { UpdateEstadoTareaDto } from './dto/update-estado-tarea.dto';
import { UpdatePrioridadTareaDto } from './dto/update-prioridad-tare.dto';
import { RecordatoriosService } from 'src/recordatorios/recordatorios.service';
import { switchEstadoRecordatorio } from 'utils/funciones';

@Injectable()
export class TareasService {
  constructor(
    private prisma: PrismaService,
    private gastosService: GastosService,
    @Inject(forwardRef(() => ListasTareasService))
    private listasTareasService: ListasTareasService,
    private recordatoriosService: RecordatoriosService,
  ) { }

  private async assertListaTareaAccesible(listaTareaId: string, usuarioId: string, role: string) {
    if (role === 'ADMIN') {
      const lista = await this.prisma.listaTarea.findUnique({ where: { id: listaTareaId } });
      if (!lista) throw new NotFoundException(`No existe una lista de tareas con el id: ${listaTareaId}`);
      return lista;
    }
    if (role === 'ADMINEMPRESA') {
      const lista = await this.prisma.listaTarea.findFirst({
        where: { id: listaTareaId, usuarioId },
      });
      if (!lista) throw new ForbiddenException('No tienes permisos para usar esa lista de tareas');
      return lista;
    }
    throw new BadRequestException('Rol no válido para operar tareas');
  }

  async createTarea(tarea: CreateTareaDto, usuarioId: string, role: string) {
    const tareaExiste = await this.prisma.tarea.findFirst({
      where: {
        titulo: tarea.titulo,
        listaTarea: { usuarioId },
      },
    });
    if (tareaExiste) {
      throw new BadRequestException('Ya existe una tarea con el mismo título para este usuario.');
    }

    // Si la lista esta cerrada, no se permite agregar una nueva tarea
    // if (tarea.listaTareaId) {
    //   const lista = await this.assertListaTareaAccesible(tarea.listaTareaId, usuarioId, role);
    //   if (lista.estado === true) {
    //     throw new BadRequestException('Lista cerrada. No se puede agregar una tarea nueva.')
    //   }
    // }

    // categoriaGastoId no existe en el modelo Tarea; solo se usa para recalcular Gasto de la lista
    const { categoriaGastoId, horaRecordatorio, ...tareaData } = tarea;
    const nuevaTarea = await this.prisma.tarea.create({
      data: {
        ...tareaData,
        fechaVencimiento: tareaData.fechaVencimiento || undefined,
        estado: tareaData.estado ? (tareaData.estado as EstadoTarea) : undefined,
        prioridad: tareaData.prioridad ? (tareaData.prioridad as Prioridad) : undefined,
        usuarioId
      },
    });

    /** RECORDATORIO **/
    /* Tarea independiente 
    * Al no tener una hora determinada, el recordatorio se crea si tiene fecha de vencimiento con la hora 15:00
    */
    if (!tarea.listaTareaId && tarea.fechaVencimiento) {
      // 1. Tomamos la fecha de vencimiento y la fijamos a las 15:00 hs de Argentina (ART = UTC-3)
      // NOTA: En la DB se guardará como 18:00:00 UTC (15+3), lo cual es correcto para que suene a las 15:00 ART.
      const fechaVenciientoDate = new Date(tarea.fechaVencimiento);
      const hora = horaRecordatorio || '15:00';
      if (tarea.estado === 'PENDIENTE')
        await this.recordatoriosService.crearActualizarRecordatorioParaTareaIndependiente(nuevaTarea.id, usuarioId, tarea.estado, fechaVenciientoDate.toISOString(), hora)
    }

    /*
    * Si la tarea pertenece a una lista y la tarea tiene estado pendiente, verificamos si ya existe un recordatorio para esa lista
    * Si no existe el recordatorio, lo creamos. Se lo crea con fecha segun el mes y anio de la lista tarea
     */
    if (tarea.listaTareaId && nuevaTarea.estado === 'PENDIENTE') {
      const recordatorioDeLista = await this.prisma.recordatorio.findFirst({
        where: { listaTareaId: tarea.listaTareaId }
      })
      if (!recordatorioDeLista) {
        // Buscamos la lista tarea
        const listaTarea = await this.prisma.listaTarea.findUnique({
          where: { id: tarea.listaTareaId },
        });
        await this.recordatoriosService.crearActualizarRecordatorioParaListaTarea(usuarioId, listaTarea)
      }
    }

    // Si la tarea pertenece a una lista, se actualiza el gasto total de la lista y se actualiza/crea el registro de Gasto para la lista.
    if (nuevaTarea.listaTareaId) {
      // Actualiza el Gasto de la lista
      await this.gastosService.recalcularGastoDeListaTareaEnGasto({
        listaTareaId: nuevaTarea.listaTareaId,
        usuarioId,
      });

      // Actualiza el campo visual en el modelo ListaTarea
      await this.listasTareasService.recalcularGastoDeListaTareaEnListaTarea({
        listaTareaId: nuevaTarea.listaTareaId,
        usuarioId,
      });
    }

    // Si la tarea es independiente (sin lista) y tiene gasto + categoría, registramos en Gasto
    if (!nuevaTarea.listaTareaId && nuevaTarea.gasto && categoriaGastoId) {
      await this.gastosService.registrarGastoTareaIndependiente({
        tareaId: nuevaTarea.id,
        usuarioId,
        categoriaGastoId: tarea.categoriaGastoId,
        total: Number(nuevaTarea.gasto),
        descripcion: nuevaTarea.descripcion ?? undefined,
        fecha: nuevaTarea.fechaVencimiento ?? undefined,
      });
    }

    return nuevaTarea;
  }

  async findAllTareas(usuarioId: string, role: string) {

    // Incluimos los gastos asociados y categoria de cada gasto
    const includeRelations = {
      gastos: {
        include: {
          categoriaGasto: true
        }
      },
      listaTarea: true
    }

    if (role === 'ADMIN') {
      return await this.prisma.tarea.findMany({
        include: includeRelations
      });
    }
    if (role === 'ADMINEMPRESA') {
      return await this.prisma.tarea.findMany({
        where: { usuarioId },
        include: includeRelations,
      });
    }
    throw new BadRequestException('Rol no válido para consultar tareas');
  }

  async findTareasByListaTarea(listaTareaId: string, usuarioId: string) {
    return await this.prisma.tarea.findMany({
      where: { listaTareaId, usuarioId },
      include: { listaTarea: true },
    });
  }

  async findOneTarea(id: string, usuarioId: string, role: string) {

    if (role === 'ADMIN') {
      const tarea = await this.prisma.tarea.findUnique({
        where: { id },
        include: { listaTarea: true },
      });
      if (!tarea) {
        throw new NotFoundException(`No existe una tarea con el id: ${id}`)
      }
      return tarea
    }
    if (role === 'ADMINEMPRESA') {
      const tarea = await this.prisma.tarea.findFirst({
        where: { id, usuarioId },
        include: { listaTarea: true },
      });
      if (!tarea) {
        throw new NotFoundException(`No existe una tarea con el id: ${id}`)
      }
      return tarea
    }
    throw new BadRequestException('Rol no válido para consultar tareas');
  }

  async updateTarea(id: string, tarea: UpdateTareaDto, usuarioId: string, role: string) {
    const tareaExistente = await this.findOneTarea(id, usuarioId, role);

    if (tarea.listaTareaId) {
      await this.assertListaTareaAccesible(tarea.listaTareaId, usuarioId, role);
    }

    // categoriaGastoId no existe en el modelo Tarea; solo se usa para recalcular Gasto de la lista
    const { categoriaGastoId, horaRecordatorio, ...tareaData } = tarea;
    const tareaActualizada = await this.prisma.tarea.update({
      where: { id },
      data: {
        ...tareaData,
        fechaVencimiento: tareaData.fechaVencimiento ? new Date(tareaData.fechaVencimiento) : undefined,
        estado: tareaData.estado ? (tareaData.estado as EstadoTarea) : undefined,
        prioridad: tareaData.prioridad ? (tareaData.prioridad as Prioridad) : undefined,
        usuarioId
      },
    });

    const oldListaId = tareaExistente.listaTareaId;
    const newListaId = tareaActualizada.listaTareaId;

    // --- Lógica para Tareas Independientes --- //
    if (!newListaId) { // Si la tarea es o se convirtió en independiente
      if (tareaActualizada.gasto && Number(tareaActualizada.gasto) > 0 && categoriaGastoId) {
        // Si tiene gasto, se crea/actualiza su registro de Gasto individual
        await this.gastosService.registrarGastoTareaIndependiente({
          tareaId: tareaActualizada.id,
          usuarioId,
          categoriaGastoId,
          total: Number(tareaActualizada.gasto),
          descripcion: tareaActualizada.descripcion ?? undefined,
          fecha: tareaActualizada.fechaVencimiento ?? undefined,
        });
      } else {
        // Si no tiene gasto, se elimina cualquier Gasto individual que pudiera tener
        await this.gastosService.eliminarGastoDeTareaIndependiente(tareaActualizada.id);
      }
    } else { // Si la tarea está en una lista
      // Si antes era independiente, nos aseguramos de borrar su Gasto individual
      if (!oldListaId) {
        await this.gastosService.eliminarGastoDeTareaIndependiente(tareaActualizada.id);
      }
    }

    // --- Lógica para Listas de Tareas --- //
    // Si la tarea se movió o se quitó de una lista, hay que recalcular la lista ANTIGUA
    // Tambien verificamos el estado de la lista de tarea
    if (oldListaId && oldListaId !== newListaId) {
      await this.listasTareasService.recalcularGastoDeListaTareaEnListaTarea({ listaTareaId: oldListaId, usuarioId });
      await this.gastosService.recalcularGastoDeListaTareaEnGasto({ listaTareaId: oldListaId, usuarioId });

      // verificacion de estado de la lista antigua
      await this.listasTareasService.updateEstadoListaTarea(oldListaId, usuarioId, role)

    }
    // Si la tarea ahora está en una lista (sea la misma o una nueva), recalcular la lista NUEVA
    if (newListaId) {
      await this.listasTareasService.recalcularGastoDeListaTareaEnListaTarea({ listaTareaId: newListaId, usuarioId });
      await this.gastosService.recalcularGastoDeListaTareaEnGasto({
        listaTareaId: newListaId,
        usuarioId,
      });
      // verificacion de esaado de la lista nueva
      await this.listasTareasService.updateEstadoListaTarea(newListaId, usuarioId, role)
    }

    // --- Logica de recordatorios --- //
    //si la tarea no pertenecia a una lista y ahora si, hay que eliminar el recordatorio
    if (!tareaExistente.listaTareaId && tareaActualizada.listaTareaId) {
      await this.recordatoriosService.eliminarRecordatorio(tareaExistente.id, usuarioId, 'tarea')
    }

    const hora = horaRecordatorio || '15:00';
    // Si la tarea pertenecia a una lista y ahora no, hay que crear un recordatorio para esa nueva tarea independiente
    if (tareaExistente.listaTareaId && !tareaActualizada.listaTareaId && tareaActualizada.fechaVencimiento) {
      await this.recordatoriosService.crearActualizarRecordatorioParaTareaIndependiente(tareaActualizada.id, usuarioId, 'PENDIENTE', (tareaActualizada.fechaVencimiento).toISOString(), hora)
    }

    // si la tarea pertenecia y sigue pertenenciendo a la misma lista, no hay que actualizar

    // si la tarea pertenecia a una lista y cambio de lista, no hay que actualizar

    // si la lista no pertenece ni pertenecia a una lista, actualizar el recordatorio solo si cambio la fecha de vencimiento
    if (!tareaExistente.listaTareaId && !tareaActualizada.listaTareaId && tareaActualizada.fechaVencimiento) {
      await this.recordatoriosService.crearActualizarRecordatorioParaTareaIndependiente(tareaActualizada.id, usuarioId, 'PENDIENTE', (tareaActualizada.fechaVencimiento).toISOString(), hora)
    }

    return { message: `Tarea actualizada correctamente` };
  }

  async updateStatusTarea(id: string, usuarioId: string, role: string, estado: UpdateEstadoTareaDto) {
    const tarea = await this.findOneTarea(id, usuarioId, role);

    // actualizamos el estado de la tarea
    await this.prisma.tarea.update({
      where: { id },
      data: { estado: estado.estado as EstadoTarea },
    });

    const estadoParaRecordatorio = switchEstadoRecordatorio(estado.estado)
    await this.recordatoriosService.updateEstado(tarea.id, 'tarea', usuarioId, estadoParaRecordatorio)

    // Si la tarea pertenece a una lista, verificamos el estado de todas para determinar si cerrar o no la listaTarea
    if (tarea.listaTareaId) {
      const tareasLista = await this.prisma.tarea.findMany({
        where: { listaTareaId: tarea.listaTareaId },
      });
      const estado = tareasLista.every((t) => t.estado === 'COMPLETADA' || t.estado === 'CANCELADA');
      if (estado) {
        await this.prisma.listaTarea.update({
          where: { id: tarea.listaTareaId },
          data: { estado: true },
        });
        await this.recordatoriosService.updateEstado(tarea.listaTareaId, 'listaTarea', usuarioId, 'ENVIADO')
      } else {
        await this.prisma.listaTarea.update({
          where: { id: tarea.listaTareaId },
          data: { estado: false },
        });
        await this.recordatoriosService.updateEstado(tarea.listaTareaId, 'listaTarea', usuarioId, 'PENDIENTE')
      }
    }


    return { message: `Tarea ${tarea.estado ? 'completada' : 'pendiente'}` };
  }

  async updatePrioridadTarea(id: string, usuarioId: string, role: string, prioridad: UpdatePrioridadTareaDto) {
    const tarea = await this.findOneTarea(id, usuarioId, role);
    await this.prisma.tarea.update({
      where: { id },
      data: { prioridad: prioridad.prioridad as Prioridad },
    })
    return { message: `Se actualizó la prioridad de la tarea a ${prioridad}` }
  }

  async removeTarea(id: string, usuarioId: string, role: string) {
    const tarea = await this.findOneTarea(id, usuarioId, role);

    // 1. Validar si tiene gasto asociado (sea independiente o no, aunque principalmente aplica a independientes con registro propio)
    if (!tarea.listaTareaId) {
      const gastoAsociado = await this.prisma.gasto.findFirst({ where: { tareaId: id } });
      if (gastoAsociado) {
        throw new BadRequestException('No se puede eliminar la tarea porque tiene un gasto asociado.');
      }
    }

    // 2. Eliminamos la tarea de la base de datos
    await this.prisma.tarea.delete({
      where: { id },
    });

    // 3. AHORA recalculamos los gastos de la lista (la tarea ya no será sumada)
    if (tarea.listaTareaId) {
      await this.listasTareasService.recalcularGastoDeListaTareaEnListaTarea({
        listaTareaId: tarea.listaTareaId,
        usuarioId,
      });
      await this.gastosService.recalcularGastoDeListaTareaEnGasto({
        listaTareaId: tarea.listaTareaId,
        usuarioId,
      });
    }

    return { message: 'Tarea eliminada correctamente' };
  }
}