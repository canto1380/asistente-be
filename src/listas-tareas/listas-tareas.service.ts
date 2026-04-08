import { BadRequestException, Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateListaTareaDto } from './dto/create-lista-tarea.dto';
import { UpdateListaTareaDto } from './dto/update-lista-tarea.dto';
import { TipoPeriodo } from '@prisma/client';
import { RecordatoriosService } from 'src/recordatorios/recordatorios.service';
import { TareasService } from 'src/tareas/tareas.service';

@Injectable()
export class ListasTareasService {
  constructor(
    private prisma: PrismaService,
    private recordatoriosService: RecordatoriosService,
    @Inject(forwardRef(() => TareasService))
    private tareasService: TareasService
  ) { }

  async createListaTarea(listaTarea: CreateListaTareaDto, usuarioId: string) {
    const listaTareaExiste = await this.prisma.listaTarea.findFirst({
      where: {
        titulo: listaTarea.titulo,
        usuarioId,
      },
    });
    if (listaTareaExiste) {
      throw new BadRequestException('Ya existe una lista de tareas con el mismo título para este usuario.')
    }

    const { horaRecordatorio, ...listaTareaData} = listaTarea;
    const hora = listaTarea['horaRecordatorio'] || '15:00';

    // -- Segun el tipo periodo, calculamos los demas campos -- //
    // 1. si es mensual, recibimos del front ya el mes y anio elegido por el usuario. Calculamos desde ahi la fechaVencimiento
    if(listaTarea.tipoPeriodo === TipoPeriodo.MENSUAL && listaTarea.mes && listaTarea.anio) {
      const ultimoDia = new Date(listaTarea.anio, listaTarea.mes, 0).getDate();
      const mes = String(listaTarea.mes).padStart(2, '0');
      const isoString = `${listaTarea.anio}-${mes}-${ultimoDia}T${hora}:00-03:00`;
      const isoStringInicio = `${listaTarea.anio}-${mes}-01T00:00:00-03:00`; // Primer día del mes

      listaTareaData.fin = new Date(isoString)
      listaTareaData.inicio = new Date(isoStringInicio);
    }

    // 2. Si es semanal, tomamos la fecha new Date() ahora para calcular el proximo domingo a la fecha. De esas fechas, sacamos el mes, anio, fechaVencimiento
    else if(listaTarea.tipoPeriodo === TipoPeriodo.SEMANAL && listaTarea.inicio) {
      const inicioLista = new Date(listaTarea.inicio); // Conversión explícita a Date
      const mesInicioLista = inicioLista.getUTCMonth() + 1;
      const anioInicioLista = inicioLista.getUTCFullYear();


      // para fechaVencimiento
      const dia = inicioLista.getUTCDay()
      const diff = (7 - dia) % 7
      const nextDomingo = new Date(inicioLista);
      nextDomingo.setUTCDate(inicioLista.getUTCDate() + diff);

      const yyyy = nextDomingo.getUTCFullYear();
      const mm = nextDomingo.getUTCMonth() + 1;
      const dd = nextDomingo.getUTCDate();

      const mmStr = String(mm).padStart(2, '0');
      const ddStr = String(dd).padStart(2, '0');
      const isoString = `${yyyy}-${mmStr}-${ddStr}T${hora}:00-03:00`;
      
      listaTareaData.anio = anioInicioLista;
      listaTareaData.mes = mesInicioLista;
      listaTareaData.inicio = inicioLista;
      listaTareaData.fin = new Date(isoString);
    }

    // 3. si es custom, recibimos inicio y fin desde el front. De esas fechas, sacamos el mes, anio, fechaVencimiento
    else if(listaTarea.tipoPeriodo === TipoPeriodo.CUSTOM && listaTarea.fin && listaTarea.inicio) {
      const inicioLista = new Date(listaTarea.inicio); // Conversión explícita a Date
      const mesInicioLista = inicioLista.getMonth() +1 
      const anioInicioLista = inicioLista.getFullYear();

      listaTareaData.inicio = new Date(listaTarea.inicio)
      listaTareaData.fin = new Date(`${listaTarea.fin}T${hora}:00-03:00`)
      listaTareaData.mes = mesInicioLista
      listaTareaData.anio = anioInicioLista
    } else {
      throw new BadRequestException('Tipo de periodo no válido o falta de valores')
    }
    // Creacion de la lista
    const listaTareaCreada = await this.prisma.listaTarea.create({
      data: {
        ...listaTareaData,
        tipoPeriodo: listaTareaData.tipoPeriodo ? (listaTareaData.tipoPeriodo as TipoPeriodo) : undefined,
        categoriaGastoId: listaTareaData.categoriaGastoId,
        usuarioId,
      },
    });

    // Creacion del recordatorio
    const recordatorio = await this.recordatoriosService.crearActualizarRecordatorioParaListaTarea(usuarioId, listaTareaCreada)


    return { message: recordatorio ? 'Lista de tareas creada correctamente con su recordatorio.' : 'Lista de tareas creada correctamente sin recordatorio.'}
  }

  async findAllListasTareas(usuarioId: string, role: string) {
    if (role === 'ADMIN') {
      return await this.prisma.listaTarea.findMany({
        include: { tareas: true },
      });
    }
    if (role === 'ADMINEMPRESA') {
      return await this.prisma.listaTarea.findMany({
        where: { usuarioId },
        include: { tareas: true },
      });
    }
    throw new BadRequestException('Rol no válido para consultar listas de tareas');
  }

  async findOneListaTarea(id: string, usuarioId: string, role: string) {

    if (role === 'ADMIN') {
      const lista = await this.prisma.listaTarea.findUnique({
        where: { id },
        include: { tareas: true },
      });
      if (!lista) {
        throw new NotFoundException(`No existe una lista de tareas con el id: ${id}`)
      }
      return lista
    }
    if (role === 'ADMINEMPRESA') {
      const lista = await this.prisma.listaTarea.findFirst({
        where: { id, usuarioId },
        include: { tareas: true },
      });
      if (!lista) {
        throw new NotFoundException(`No existe una lista de tareas con el id: ${id}`);
      }
      return lista
    }
    throw new BadRequestException('Rol no válido para consultar listas de tareas');
  }

  async updateListaTarea(id: string, listaTarea: UpdateListaTareaDto, usuarioId: string, role: string) {
    await this.findOneListaTarea(id, usuarioId, role);

    const { horaRecordatorio, ...listaTareaData } = listaTarea;
    const hora = horaRecordatorio || '15:00';

     // -- Segun el tipo periodo, calculamos los demas campos -- //
    // 1. si es mensual, recibimos del front ya el mes y anio elegido por el usuario. Calculamos desde ahi la fechaVencimiento
    if(listaTarea.tipoPeriodo === TipoPeriodo.MENSUAL && listaTarea.mes && listaTarea.anio) {
      const ultimoDia = new Date(listaTarea.anio, listaTarea.mes, 0).getDate();
      const mes = String(listaTarea.mes).padStart(2, '0');
      const isoString = `${listaTarea.anio}-${mes}-${ultimoDia}T${hora}:00-03:00`;
      const isoStringInicio = `${listaTarea.anio}-${mes}-01T00:00:00-03:00`; // Primer día del mes

      listaTareaData.fin = new Date(isoString)
      listaTareaData.inicio = new Date(isoStringInicio);
    }

    // 2. Si es semanal, tomamos la fecha new Date() ahora para calcular el proximo domingo a la fecha. De esas fechas, sacamos el mes, anio, fechaVencimiento
    else if(listaTareaData.tipoPeriodo === TipoPeriodo.SEMANAL && listaTareaData.inicio) {
      const inicioLista = new Date(listaTareaData.inicio); // Conversión explícita a Date
      const mesInicioLista = inicioLista.getUTCMonth() + 1;
      const anioInicioLista = inicioLista.getUTCFullYear();


      // para fechaVencimiento
      const dia = inicioLista.getUTCDay()
      const diff = (7 - dia) % 7
      const nextDomingo = new Date(inicioLista);
      nextDomingo.setUTCDate(inicioLista.getUTCDate() + diff);

      const yyyy = nextDomingo.getUTCFullYear();
      const mm = nextDomingo.getUTCMonth() + 1;
      const dd = nextDomingo.getUTCDate();

      const mmStr = String(mm).padStart(2, '0');
      const ddStr = String(dd).padStart(2, '0');
      const isoString = `${yyyy}-${mmStr}-${ddStr}T${hora}:00-03:00`;
      
      listaTareaData.anio = anioInicioLista;
      listaTareaData.mes = mesInicioLista;
      listaTareaData.inicio = inicioLista;
      listaTareaData.fin = new Date(isoString);
    }

    // 3. si es custom, recibimos inicio y fin desde el front. De esas fechas, sacamos el mes, anio, fechaVencimiento
    else if(listaTareaData.tipoPeriodo === TipoPeriodo.CUSTOM && listaTareaData.fin && listaTareaData.inicio) {
      const inicioLista = new Date(listaTareaData.inicio); // Conversión explícita a Date
      const mesInicioLista = inicioLista.getMonth() +1 
      const anioInicioLista = inicioLista.getFullYear();

      listaTareaData.inicio = new Date(listaTareaData.inicio)
      listaTareaData.fin = new Date(`${listaTareaData.fin}T${hora}:00-03:00`)
      listaTareaData.mes = mesInicioLista
      listaTareaData.anio = anioInicioLista
    } else {
      throw new BadRequestException('Tipo de periodo no válido o falta de valores')
    }


    const listaActualizada = await this.prisma.listaTarea.update({
      where: { id },
      data: {
        ...listaTareaData,
        tipoPeriodo: listaTareaData.tipoPeriodo ? (listaTareaData.tipoPeriodo as TipoPeriodo) : undefined,
      },
    });

    // Actualiza la descripción en todos los registros de Gasto asociados a esta lista.
    if (listaTareaData.titulo) {
      await this.prisma.gasto.updateMany({
        where: { listaTareaId: id },
        data: {
          descripcion: listaTareaData.titulo,
        },
      });
    }

    const recordatorio = await this.recordatoriosService.crearActualizarRecordatorioParaListaTarea(usuarioId, listaActualizada)

    return listaActualizada
  }

  async updateEstadoListaTarea(id: string, usuarioId: string, role: string) {
    const lista = await this.findOneListaTarea(id, usuarioId, role);

    const tareasVinculadas =  await this.tareasService.findTareasByListaTarea(id, usuarioId)
    let estado = true
    for (const tarea of tareasVinculadas) {
      if (tarea.estado === 'PENDIENTE') {
        estado = false
        break
      }
    }
    await this.prisma.listaTarea.update({
      where: { id },
      data: { estado },
    });
    return { message: `Lista de tareas ${lista.estado ? 'completada' : 'pendiente'}` };
  }

  async removeListaTarea(id: string, usuarioId: string, role: string) {
    await this.findOneListaTarea(id, usuarioId, role);

    // 1. Verificar si tiene tareas asignadas
    const tareasCount = await this.prisma.tarea.count({ where: { listaTareaId: id } });
    if (tareasCount > 0) {
      throw new BadRequestException('No se puede eliminar la lista porque tiene tareas asignadas. Elimine las tareas primero.');
    }

    // 2. Verificar si tiene gastos asociados
    const gastoAsociado = await this.prisma.gasto.findFirst({ where: { listaTareaId: id } });
    if (gastoAsociado) {
      throw new BadRequestException('No se puede eliminar la lista porque tiene un registro de gasto asociado.');
    }

    await this.prisma.listaTarea.delete({ where: { id } });
    return { message: 'Lista de tareas eliminada correctamente' };
  }

  async recalcularGastoDeListaTareaEnListaTarea(params: {
    listaTareaId: string;
    usuarioId: string;
  }) {
    const { listaTareaId, usuarioId } = params

    const lista = await this.prisma.listaTarea.findFirst({
      where: { id: listaTareaId, usuarioId },
    });
    if (!lista) {
      throw new NotFoundException(`No existe una lista de tareas con el id: ${listaTareaId} para este usuario`);
    }

    const tareas = await this.prisma.tarea.findMany({
      where: { listaTareaId },
      select: {
        gasto: true
      }
    })
    const tareasConGasto = tareas.filter(t => t.gasto !== null)

    const total = tareasConGasto.reduce((sum, t) => {
      return sum + Number(t.gasto)
    }, 0)

    // Actualizamos siempre, incluso si el total es 0 (ej. se borraron los gastos)
    return await this.prisma.listaTarea.update({
      where: { id: listaTareaId },
      data: {
        gastoTotal: total
      }
    })
  }
}
