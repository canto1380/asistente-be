import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GastosService } from './gastos.service';
import { GetUser } from 'src/auth/get-user.decorator';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';

@Controller('gastos')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'ADMINEMPRESA')
export class GastosController {
  constructor(private readonly gastosService: GastosService) {}

  /**
   * Listado de todos los gastos visibles para el usuario.
   * ADMIN ve todos; ADMINEMPRESA solo sus propios gastos.
   */
  @Get('/')
  @HttpCode(200)
  findAll(@GetUser() user: { userId: string; role: string }) {
    return this.gastosService.findAll(user.userId, user.role);
  }

  @Get('/mensual')
  async obtenerReporteMensual(
    @GetUser() user: { userId: string },
    @Query('mes', ParseIntPipe) mes: number,
    @Query('anio', ParseIntPipe) anio: number,
    @Query('categoriaGasto', new ParseUUIDPipe({ optional: true })) categoriaGasto?: string,
  ) {
    return this.gastosService.obtenerReporteMensual(user.userId, mes, anio, categoriaGasto);
  }

  /**
   * Detalle de un gasto concreto.
   */
  @Get('/:id')
  @HttpCode(200)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: { userId: string; role: string },
  ) {
    return this.gastosService.findOne(id, user.userId, user.role);
  }

}
