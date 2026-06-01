import { Controller, Get, Post, Body, Patch, Param, Delete, UsePipes, ValidationPipe, ParseUUIDPipe, HttpCode, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@Controller('roles')
// @UseGuards(AuthGuard('jwt'), RolesGuard) // 1. Valida Token, 2. Valida Rol
// @Roles('ADMIN') // Aplica a TODOS los endpoints de este controlador
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post('/')
  @UsePipes(new ValidationPipe({whitelist: true}))
  @HttpCode(201)
  createRol(@Body() rol: CreateRoleDto) {
    return this.rolesService.createRol(rol);
  }

  @Get('/')
  @HttpCode(200)
  findAllRol() {
    return this.rolesService.findAllRol();
  }

  @Get('/:id')
  @HttpCode(200)
  findOneRol(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.findOneRol(id);
  }

  @Patch('/:id')
  @HttpCode(200)
  updateRol(@Param('id', ParseUUIDPipe) id: string, @Body() rol: UpdateRoleDto) {
    return this.rolesService.updateRol(id, rol);
  }

  @Delete('/:id')
  @HttpCode(200)
  removeRol(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.removeRol(id);
  }

  @Post('/:rolId/:permisoId')
  @HttpCode(200)
  togglePermiso(
    @Param('rolId', ParseUUIDPipe) rolId: string,
    @Param('permisoId', ParseUUIDPipe) permisoId: string,
  ) {
    return this.rolesService.togglePermiso(rolId, permisoId);
  }
}
