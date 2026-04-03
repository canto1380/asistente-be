import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) { }

  async createUsuario(usuario: CreateUsuarioDto) {
    const usuarioExiste = await this.prisma.usuario.findFirst({
      where: {
        email: usuario.email
      }
    })

    if (usuarioExiste) {
      throw new BadRequestException('Ya existe un usuario con el email ingresado')
    }
    const hashedPassword = await bcrypt.hash(usuario.password, 10)
    usuario.password = hashedPassword
    return await this.prisma.usuario.create({
      data: usuario
    })
  }

  async findAllUsuario() {
    return await this.prisma.usuario.findMany({
      include: { role: true },
    })
  }

  async findOneUsuario(id: string) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id },
      include: { role: true },
    })
    if(!usuario) {
      throw new NotFoundException(`No existe un usuario con el id: ${id}`)
    }
    return usuario
  }

  async findByEmail(email: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
      include: { role: true }, // Incluimos el rol para el token
    });
    if(!usuario) {
      throw new NotFoundException(`No existe un usuario con el email: ${email}`)
    }
    return usuario
  }

  async updateUsuario(id: string, usuario: UpdateUsuarioDto) {
    await this.findOneUsuario(id)
    return await this.prisma.usuario.update({
      where: { id },
      data: usuario
    })
  }

  async updateStatusUsuario(id: string) {
    const usuarioAEditar = await this.findOneUsuario(id)
    await this.prisma.usuario.update({
      where: { id },
      data: {
        activo: !usuarioAEditar.activo
      }
    })
    return { message: `Usuario ${usuarioAEditar.activo ? 'desactivado' : 'activado'} correctamente`};
  }
}
