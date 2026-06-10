import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateIngresoDto } from './dto/create-ingreso.dto';
import { UpdateIngresoDto } from './dto/update-ingreso.dto';

@Injectable()
export class IngresosService {
  constructor(private prisma: PrismaService) { }

  async create(nuevoIngreso: CreateIngresoDto, usuarioId: string) {
    return await this.prisma.ingreso.create({
      data: {
        ...nuevoIngreso,
        total: Number(nuevoIngreso.total),
        usuarioId
      },
    });
  }

  async findAll(usuarioId: string, role: string) {
    const where: any = { deletedAt: null };

    if (role === 'ADMINEMPRESA') {
      return await this.prisma.ingreso.findMany({
        where: {
          usuarioId: usuarioId
        },
        orderBy: { fecha: 'desc' },
      });
    }
    if (role === 'ADMIN') {
      return await this.prisma.ingreso.findMany({
        orderBy: { fecha: 'desc' },
      });
    }
    throw new BadRequestException('Rol no válido para consultar eventos.');
  }

  async findOne(id: string, usuarioId: string, role: string) {
    const where: any = { id, deletedAt: null };
    if (role !== 'ADMIN') where.usuarioId = usuarioId;

    const ingreso = await this.prisma.ingreso.findFirst({ where });

    if (!ingreso) {
      throw new NotFoundException(`Ingreso con ID ${id} no encontrado`);
    }
    return ingreso;
  }

  async update(id: string, ingresoParaActualizar: UpdateIngresoDto, usuarioId: string, role: string) {
    await this.findOne(id, usuarioId, role);

    return await this.prisma.ingreso.update({
      where: { id },
      data: {
        ...ingresoParaActualizar,
        total: ingresoParaActualizar.total ? Number(ingresoParaActualizar.total) : undefined
      },
    });
  }

  async remove(id: string, usuarioId: string, role: string) {
    await this.findOne(id, usuarioId, role);

    // Soft delete
    return await this.prisma.ingreso.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async obtenerResumenMensual(usuarioId: string, mes: number, anio: number) {
    const ingresos = await this.prisma.ingreso.findMany({
      where: {
        usuarioId,
        mes: Number(mes),
        anio: Number(anio),
        deletedAt: null,
      },
    });

    const total = ingresos.reduce((acc, curr) => acc + Number(curr.total), 0);

    return {
      mes,
      anio,
      total,
      cantidad: ingresos.length,
    };
  }

  async obtenerBalanceMensual(usuarioId: string, mes: number, anio: number) {
    const [ingresosSum, gastosSum] = await Promise.all([
      this.prisma.ingreso.aggregate({
        where: {
          usuarioId,
          mes: Number(mes),
          anio: Number(anio),
          deletedAt: null,
        },
        _sum: { total: true },
      }),
      this.prisma.gasto.aggregate({
        where: {
          usuarioId,
          mes: Number(mes),
          anio: Number(anio),
          completado: true,
          deletedAt: null,
        },
        _sum: { total: true },
      }),
    ]);

    const totalIngresos = Number(ingresosSum._sum.total) || 0;
    const totalGastos = Number(gastosSum._sum.total) || 0;

    return {
      mes: Number(mes),
      anio: Number(anio),
      totalIngresos,
      totalGastos,
      balance: totalIngresos - totalGastos,
    };
  }
}
