import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoriaGastoDto } from './dto/create-categoria-gasto.dto';
import { UpdateCategoriaGastoDto } from './dto/update-categoria-gasto.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoriaGastoService {
  constructor(private prisma: PrismaService) { }

  async create(categoriaGasto: CreateCategoriaGastoDto, usuarioId: string, role: string) {
    const categoriaExiste = await this.prisma.categoriaGasto.findFirst({
      where: {
        nombre: categoriaGasto.nombre,
        usuarioId,
      },
    });
    if (categoriaExiste) {
      throw new BadRequestException('Ya existe una categoria de gasto con el mismo nombre para este usuario.')
    }

    return await this.prisma.categoriaGasto.create({
      data: {
        ...categoriaGasto,
        usuarioId
      }
    })
  }

  async findAll(usuarioId: string, role: string) {
    if (role === 'ADMIN') {
      return await this.prisma.categoriaGasto.findMany();
    }
    if (role === 'ADMINEMPRESA') {
      return await this.prisma.categoriaGasto.findMany({
        where: { usuarioId }
      })
    }
    throw new BadRequestException('Rol no válido para consultar categorias de gasto');
  }

  async findOne(id: string, usuarioId: string, role: string) {
    if (role === 'ADMIN') {
      const categoria = await this.prisma.categoriaGasto.findUnique({
        where: { id }
      })
      if (!categoria) {
        throw new BadRequestException(`No existe una categoria de gasto con el id: ${id}`)
      }
      return categoria
    }
    if (role === 'ADMINEMPRESA') {
      const categoria = await this.prisma.categoriaGasto.findFirst({
        where: { id, usuarioId }
      })
      if (!categoria) {
        throw new NotFoundException(`No existe una categoría de gasto con el id: ${id}`)
      }
      return categoria
    }
    throw new BadRequestException('Rol no válido para consultar categorías de gasto')
  }

  async update(id: string, cateogriaGasto: UpdateCategoriaGastoDto, usuarioId: string, role: string) {
    await this.findOne(id, usuarioId, role);
    await this.prisma.categoriaGasto.update({
      where: { id },
      data: {
        ...cateogriaGasto
      }
    })
    return { message: `Estado del evento actualizado correctamente` };
  }

  async deleteCategoriaGasto(id: string, usuarioId: string, role: string) {
    await this.findOne(id, usuarioId, role);
    await this.prisma.categoriaGasto.delete({
      where: { id }
    })
    return { message: `Categoría de gasto eliminada correctamente` };
  }
}
