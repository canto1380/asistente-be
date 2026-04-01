import { Controller, Get, Post, Body, Patch, Param, Delete, UsePipes, ValidationPipe, HttpCode, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post('/')
  @UsePipes(new ValidationPipe({whitelist: true}))
  @HttpCode(201)
  // @UseGuards(AuthGuard('jwt'), RolesGuard)
  // @Roles('ADMIN') // Solo ADMIN puede crear usuarios
  create(@Body() usuario: CreateUsuarioDto) {
    return this.usuariosService.createUsuario(usuario);
  }

  @Get('/')
  @HttpCode(200)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'SECRETARIO') // Ahora ADMIN o SECRETARIO pueden ver el listado
  findAll() {
    return this.usuariosService.findAllUsuario();
  }

  @Get('/:id')
  @HttpCode(200)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuariosService.findOneUsuario(id);
  }

  @Patch('/:id')
  @HttpCode(200)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() usuario: UpdateUsuarioDto) {
    return this.usuariosService.updateUsuario(id, usuario);
  }

  @Patch('/toggle/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN') // Solo ADMIN puede activar/desactivar usuarios
  updateStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuariosService.updateStatusUsuario(id);
  }
}
