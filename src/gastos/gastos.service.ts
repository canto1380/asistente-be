import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateGastoDto } from './dto/update-gasto.dto';

@Injectable()
export class GastosService {
  constructor(private prisma: PrismaService) { }

  /**
   * Crea un gasto asociado a un evento concreto.
   * Se utilizará, por ejemplo, al crear un evento con gastos.
   */
  async registrarGastoEvento(params: {
    usuarioId: string;
    eventoId: string;
    categoriaGastoId: string;
    total: number;
    descripcion?: string;
    fecha?: Date;
  }) {
    const { usuarioId, eventoId, categoriaGastoId, total, descripcion, fecha } = params;

    const fechaRef = fecha ?? new Date();
    const mes = fechaRef.getMonth() + 1;
    const anio = fechaRef.getFullYear();

    return this.prisma.gasto.create({
      data: {
        usuarioId,
        eventoId,
        categoriaGastoId,
        total,
        descripcion,
        mes,
        anio,
      },
    });
  }

  async buscarGastoPorEvento(eventoId: string, usuarioId: string) {
    const gasto = await this.prisma.gasto.findFirst({
      where: { eventoId, usuarioId },
    });
    return gasto;
  }

  /**
   * Crea o actualiza el gasto de una tarea independiente (sin lista).
   * Un solo registro Gasto por tareaId; fecha = fechaVencimiento de la tarea o now.
   * categoriaGastoId es opcional al actualizar: si no se envía, se mantiene la del Gasto existente.
   */
  async registrarGastoTareaIndependiente(params: {
    tareaId: string;
    usuarioId: string;
    categoriaGastoId?: string;
    total: number;
    descripcion?: string;
    fecha?: Date;
  }) {
    const { tareaId, usuarioId, total, descripcion, fecha } = params;

    const fechaRef = fecha || new Date();
    const mes = fechaRef.getMonth() + 1;
    const anio = fechaRef.getFullYear();


    const existente = await this.prisma.gasto.findFirst({
      where: { tareaId, usuarioId },
    });

    const categoriaGastoId = params.categoriaGastoId ?? existente?.categoriaGastoId;
    if (!categoriaGastoId) {
      return null; // Crear sin categoría no permitido
    }

    const data = {
      usuarioId,
      categoriaGastoId,
      tareaId,
      total,
      descripcion,
      mes,
      anio
    };

    if (existente) {
      return this.prisma.gasto.update({
        where: { id: existente.id },
        data,
      });
    }

    return this.prisma.gasto.create({
      data,
    });
  }

  /**
   * Elimina el gasto asociado a una tarea independiente (cuando quitan el gasto de la tarea).
   */
  async eliminarGastoDeTareaIndependiente(tareaId: string) {
    await this.prisma.gasto.deleteMany({
      where: { tareaId },
    });
  }

  /**
   * Recalcula y registra el gasto total de una lista de tareas,
   * sumando el campo "gasto" de todas las tareas asociadas.
   *
   * La fecha que se guarda es la última fecha de gasto,
   * que se calcula como el mayor "updatedAt" de las tareas con gasto.
   */
  async recalcularGastoDeListaTareaEnGasto(params: {
    listaTareaId: string;
    usuarioId: string;
  }) {
    const { listaTareaId, usuarioId } = params;

    const lista = await this.prisma.listaTarea.findFirst({
      where: { id: listaTareaId, usuarioId },
    });
    if (!lista || !lista.categoriaGastoId) {
      throw new NotFoundException(
        `No existe una lista de tareas con el id: ${listaTareaId} para este usuario`,
      );
    }

    const categoriaGastoId = lista.categoriaGastoId;
    const mes = lista.mes;
    const anio = lista.anio;
    const descripcion = lista.descripcion

    const tareas = await this.prisma.tarea.findMany({
      where: { listaTareaId },
      select: {
        gasto: true,
        updatedAt: true,
      },
    });

    const tareasConGasto = tareas.filter((t) => t.gasto !== null);

    const total = tareasConGasto.reduce((sum, t) => {
      return sum + Number(t.gasto);
    }, 0);


    // Si no hay gastos, eliminamos cualquier registro previo de gasto para esa lista
    if (total === 0) {
      await this.prisma.gasto.deleteMany({
        where: {
          listaTareaId,
          usuarioId,
          categoriaGastoId,
        },
      });
      return null;
    }

    const existente = await this.prisma.gasto.findFirst({
      where: {
        listaTareaId,
        usuarioId,
        categoriaGastoId,
      },
    });

    if (existente) {
      return this.prisma.gasto.update({
        where: { id: existente.id },
        data: {
          total,
        },
      });
    }

    return this.prisma.gasto.create({
      data: {
        usuarioId,
        categoriaGastoId,
        listaTareaId,
        total,
        descripcion,
        mes,
        anio
      },
    });
  }

  async findAll(usuarioId: string, role: string) {
    if (role === 'ADMIN') {
      return this.prisma.gasto.findMany({
        include: {
          categoriaGasto: true,
          evento: true,
          listaTarea: true,
          tarea: true,
        },
      });
    }

    if (role === 'ADMINEMPRESA') {
      return this.prisma.gasto.findMany({
        where: { usuarioId },
        include: {
          categoriaGasto: true,
          evento: true,
          listaTarea: true,
          tarea: true,
        },
      });
    }

    throw new BadRequestException('Rol no válido para consultar gastos');
  }

  async findOne(id: string, usuarioId: string, role: string) {
    if (role === 'ADMIN') {
      const gasto = await this.prisma.gasto.findUnique({
        where: { id },
        include: {
          categoriaGasto: true,
          evento: true,
          listaTarea: true,
          tarea: true,
        },
      });
      if (!gasto) {
        throw new NotFoundException(`No existe un gasto con el id: ${id}`);
      }
      return gasto;
    }

    if (role === 'ADMINEMPRESA') {
      const gasto = await this.prisma.gasto.findFirst({
        where: { id, usuarioId },
        include: {
          categoriaGasto: true,
          evento: true,
          listaTarea: true,
          tarea: true,
        },
      });
      if (!gasto) {
        throw new NotFoundException(`No existe un gasto con el id: ${id}`);
      }
      return gasto;
    }

    throw new BadRequestException('Rol no válido para consultar gastos');
  }


  /**
   * Eliminación lógica/física de un gasto concreto.
   * Por ahora usamos delete directo; si quieres soft delete,
   * se podría cambiar a un update de "deletedAt".
   */
  async remove(id: string) {
    const existe = await this.prisma.gasto.findUnique({ where: { id } });
    if (!existe) {
      throw new NotFoundException(`No existe un gasto con el id: ${id}`);
    }

    return this.prisma.gasto.delete({
      where: { id },
    });
  }


  async obtenerReporteMensual(usuarioId: string, mes: string | number, anio: string | number, categoriaGasto?: string) {
    const where: any = {
      usuarioId,
      mes: Number(mes),
      anio: Number(anio),
      deletedAt: null,
    };

    // Solo filtramos por categoría si recibimos un ID que no sea vacío o "undefined"
    if (categoriaGasto && categoriaGasto !== 'undefined' && categoriaGasto !== 'null' && categoriaGasto !== '') {
      where.categoriaGastoId = categoriaGasto;
    }

    const gastos = await this.prisma.gasto.findMany({
      where,
      include: {
        categoriaGasto: true,
        evento: true,
        tarea: true,
        listaTarea: true,
      },
    });

    const total = gastos.reduce((acc, curr) => acc + Number(curr.total), 0);

    return { periodo: { mes, anio }, total, detalles: gastos };
  }

  async removeGasto(id: string, usuarioId: string) {
    const gastoAsociado = await this.prisma.gasto.findFirst({
      where: { eventoId: id, usuarioId },
    })
    if (gastoAsociado) {
      return await this.prisma.gasto.delete({
        where: { id: gastoAsociado.id },
      });
    }
    return null
  }
}
