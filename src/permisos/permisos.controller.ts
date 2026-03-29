import { Controller, Get, Post, Body, Patch, Param, Delete, UsePipes, ValidationPipe, HttpCode, ParseUUIDPipe } from '@nestjs/common';
import { PermisosService } from './permisos.service';
import { CreatePermisoDto } from './dto/create-permiso.dto';
import { UpdatePermisoDto } from './dto/update-permiso.dto';

@Controller('permisos')
export class PermisosController {
  constructor(private readonly permisosService: PermisosService) {}

  @Post('/')
  @UsePipes(new ValidationPipe({whitelist: true}))
  @HttpCode(201)
  createPermiso(@Body() permiso: CreatePermisoDto) {
    return this.permisosService.createPermiso(permiso);
  }

  @Get('/')
  @HttpCode(200)
  findAllPermiso() {
    return this.permisosService.findAllPermiso();
  }

  @Get('/:id')
  @HttpCode(200)
  findOnePermiso(@Param('id', ParseUUIDPipe) id: string) {
    return this.permisosService.findOnePermiso(id);
  }

  @Patch('/:id')
  @HttpCode(200)
  updatePermiso(@Param('id', ParseUUIDPipe) id: string, @Body() permiso: UpdatePermisoDto) {
    return this.permisosService.updatePermiso(id, permiso);
  }

  @Delete('/:id')
  @HttpCode(200)
  removePermiso(@Param('id', ParseUUIDPipe) id: string) {
    return this.permisosService.removePermiso(id);
  }
}
