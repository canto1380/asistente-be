import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async createRol(rol: CreateRoleDto) {
    const rolExiste = await this.prisma.rol.findUnique({
      where: { nombre: rol.nombre },
    });

    if (rolExiste) {
      throw new BadRequestException('Ya existe un rol con ese nombre');
    }

    return await this.prisma.rol.create({ data: rol });
  }

  async findAllRol() {
    return await this.prisma.rol.findMany();
  }

  async findOneRol(id: string) {
    const rol = await this.prisma.rol.findUnique({
      where: { id },
    });

    if (!rol) {
      throw new NotFoundException(`No existe un rol con el id ${id}`);
    }

    return rol;
  }

  async updateRol(id: string, rol: UpdateRoleDto) {
    await this.findOneRol(id); // Validamos existencia reutilizando el método anterior
    return await this.prisma.rol.update({
      where: { id },
      data: rol,
    });
  }

  async removeRol(id: string) {
    await this.findOneRol(id); // Validamos existencia reutilizando el método anterior
    return await this.prisma.rol.delete({
      where: { id },
    });
  }

  async togglePermiso(rolId: string, permisoId: string) {
    // 1. Validamos que el rol exista
    await this.findOneRol(rolId);

    // 2. Validamos que el permiso exista
    const permiso = await this.prisma.permiso.findUnique({
      where: { id: permisoId },
    });

    if (!permiso) {
      throw new NotFoundException(`No existe un permiso con el id ${permisoId}`);
    }

    // 3. Buscamos si ya existe la relación
    const relacion = await this.prisma.rolPermiso.findUnique({
      where: {
        rolId_permisoId: { rolId, permisoId },
      },
    });

    // 4. Toggle (Si existe borramos, si no existe creamos)
    if (relacion) {
      await this.prisma.rolPermiso.delete({
        where: { rolId_permisoId: { rolId, permisoId } },
      });
      return { message: 'Permiso desasignado correctamente', asignado: false };
    } else {
      await this.prisma.rolPermiso.create({
        data: { rolId, permisoId },
      });
      return { message: 'Permiso asignado correctamente', asignado: true };
    }
  }
}
