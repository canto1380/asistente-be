import { Controller, Patch, Param, ParseUUIDPipe, UseGuards, HttpCode, Req, Delete, Get, UsePipes, ValidationPipe, Body } from '@nestjs/common';
import { RecordatoriosService } from './recordatorios.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/get-user.decorator';
import { UpdateRecordatorioDto } from './dto/update-recordatorio.sto';

@Controller('recordatorios')
@UseGuards(AuthGuard('jwt'))
export class RecordatoriosController {
  constructor(private readonly recordatoriosService: RecordatoriosService) {}


  @Get('/')
  @HttpCode(200)
  findAll(@GetUser() user: { userId: string; role: string }) {
    return this.recordatoriosService.findAllRecordatorios(user.userId, user.role);
  }

  @Patch('/:id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @HttpCode(200)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() recordatorio: UpdateRecordatorioDto,
    @GetUser() user: { userId: string; role: string },
  ) {
    return this.recordatoriosService.updateRecordatorio(id, recordatorio, user.userId, user.role);
  }

  @Patch('/:id/posponer')
  @HttpCode(204) // 204 No Content es una buena práctica para acciones que no devuelven cuerpo
  async posponer(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const usuarioId = req.user.sub; // El payload del JWT es inyectado por AuthGuard
    await this.recordatoriosService.posponerRecordatorio(id, usuarioId);
  }

  @Patch('/:id/realizado')
  @HttpCode(204)
  async realizar(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    const usuarioId = req.user.sub;
    await this.recordatoriosService.realizarRecordatorio(id, usuarioId);
  }

  @Delete('/:id')
  @HttpCode(200)
  async remove(
    @Param('id', ParseUUIDPipe) id: string, 
    @GetUser() user: { userId: string; role: string },
  ) {
    await this.recordatoriosService.removeRecordatorio(id, user.userId, user.role);
  }
}