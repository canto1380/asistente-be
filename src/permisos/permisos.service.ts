import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePermisoDto } from './dto/create-permiso.dto';
import { UpdatePermisoDto } from './dto/update-permiso.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PermisosService {

  constructor(private prisma: PrismaService) { }

  async createPermiso(permiso: CreatePermisoDto) {
    const permisoExiste = await this.prisma.permiso.findUnique({
      where: { codigo: permiso.codigo },
    });

    if (permisoExiste) {
      throw new BadRequestException('Ya existe un permiso con ese codigo')
    }
    return await this.prisma.permiso.create({ data: permiso });
  }

  async findAllPermiso() {
    return await this.prisma.permiso.findMany();
  }

  async findOnePermiso(id: string) {
    const permiso = await this.prisma.permiso.findUnique({
      where: { id },
    });
    if (!permiso) {
      throw new NotFoundException(`No existe un permiso con el id ${id}`)
    }
    return permiso
  }

  async findPermisosPorRol(id: string) {
    const permisos = await this.prisma.rolPermiso.findMany({
      where: { rolId: id },
      include: {
        permiso: true,
      },
    });
    return permisos
  }

  async updatePermiso(id: string, permiso: UpdatePermisoDto) {
    await this.findOnePermiso(id); // Validamos existencia reutilizando el método anterior
    return await this.prisma.permiso.update({
      where: { id },
      data: permiso,
    });
  }

  async removePermiso(id: string) {
    await this.findOnePermiso(id)

    // 1. Validar que no existan roles asignados a este permiso
    const rolesConPermiso = await this.prisma.rolPermiso.count({
      where: { permisoId: id },
    });
    if (rolesConPermiso > 0) {
      throw new BadRequestException('No se puede eliminar el permiso porque está asignado a uno o más roles.');
    }

    return await this.prisma.permiso.delete({
      where: { id },
    });
  }
}
