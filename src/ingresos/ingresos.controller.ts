import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, UsePipes, ValidationPipe, HttpCode, ParseUUIDPipe } from '@nestjs/common';
import { IngresosService } from './ingresos.service';
import { CreateIngresoDto } from './dto/create-ingreso.dto';
import { UpdateIngresoDto } from './dto/update-ingreso.dto';
import { GetUser } from 'src/auth/get-user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@Controller('ingresos')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'ADMINEMPRESA')
export class IngresosController {
  constructor(private readonly ingresosService: IngresosService) {}

  @Post('/')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @HttpCode(201)
  create(@Body() ingreso: CreateIngresoDto, @GetUser() user: { userId: string }) {
    return this.ingresosService.create(ingreso, user.userId);
  }

  @Get('/')
  @HttpCode(200)
  findAll(@GetUser() user: { userId: string, role: string }) {
    return this.ingresosService.findAll(user.userId, user.role);
  }

  @Get('/resumen')
  @HttpCode(200)
  obtenerResumen(@GetUser('id') usuarioId: string, @Query('mes') mes: number, @Query('anio') anio: number) {
    return this.ingresosService.obtenerResumenMensual(usuarioId, mes, anio);
  }

  @Get('/balance')
  @HttpCode(200)
  obtenerBalance(@GetUser() user: { userId: string }, @Query('mes') mes: number, @Query('anio') anio: number) {
    return this.ingresosService.obtenerBalanceMensual(user.userId, mes, anio);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string,  @GetUser() user: { userId: string, role: string }) {
    return this.ingresosService.findOne(id, user.userId, user.role);
  }

  @Patch('/:id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @HttpCode(200)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() ingreso: UpdateIngresoDto,
    @GetUser() user: { userId: string, role: string }
  ) {
    return this.ingresosService.update(id, ingreso, user.userId, user.role);
  }

  @Delete('/:id')
  @HttpCode(200)
  remove(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: { userId: string, role: string }){
    return this.ingresosService.remove(id, user.userId, user.role);
  }
}
