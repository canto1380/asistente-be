import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePermisoDto } from './dto/create-permiso.dto';
import { UpdatePermisoDto } from './dto/update-permiso.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PermisosService {

  constructor(private prisma: PrismaService){}

  async createPermiso(permiso: CreatePermisoDto) {
    const permisoExiste = await this.prisma.permiso.findUnique({
      where: { codigo: permiso.codigo },
    });

    if(permisoExiste) {
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
    if(!permiso) {
      throw new NotFoundException(`No existe un permiso con el id ${id}`)
    }
    return permiso
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
    return await this.prisma.permiso.delete({
      where: { id },
    });
  }
}
