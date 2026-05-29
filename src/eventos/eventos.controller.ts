import { Controller, Get, Post, Body, Patch, Param, Delete, UsePipes, ValidationPipe, HttpCode, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { EventosService } from './eventos.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { GetUser } from 'src/auth/get-user.decorator';
import { UpdateEventoStatusDto } from './dto/update-evento-status.dto';

@Controller('eventos')
@UseGuards(AuthGuard('jwt'), RolesGuard) // Proteger todo el controlador
@Roles('ADMIN', 'ADMINEMPRESA') // Aplica a TODOS los endpoints de este controlador
export class EventosController {
  constructor(private readonly eventosService: EventosService) { }

  @Post('/')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @HttpCode(201)
  create(@Body() evento: CreateEventoDto, @GetUser() user: { userId: string }) {
    return this.eventosService.createEvento(evento, user.userId);
  }

  @Post('/chat')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @HttpCode(201)
  chat(@Body() evento: any, @GetUser() user: { userId: string }) {
    return this.eventosService.chat(evento, user.userId);
  }


  @Get('/')
  @HttpCode(200)
  findAll(@GetUser() user: { userId: string, role: string }) {
    return this.eventosService.findAllEvento(user.userId, user.role);
  }

  @Get(':id')
  @HttpCode(200)
  // La lógica de si el usuario puede ver este evento debería estar en el servicio
  findOne(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: { userId: string, role: string }) {
    return this.eventosService.findOneEvento(id, user.userId, user.role);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @HttpCode(200)
  // La lógica de si el usuario puede editar este evento debería estar en el servicio
  update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() evento: UpdateEventoDto,
    @GetUser() user: { userId: string, role: string }) {
    return this.eventosService.updateEvento(id, evento, user.userId, user.role);
  }

  @Patch('/status/:id')
  @HttpCode(200)
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() updateStatusDto: UpdateEventoStatusDto, @GetUser() user: { userId: string, role: string }) {
    return this.eventosService.updateStatusEvento(id, updateStatusDto, user.userId, user.role);
  }

  @Delete('/:id')
  @HttpCode(200)
  remove(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: { userId: string, role: string }){
    return this.eventosService.removeEvento(id, user.userId, user.role);
  }


}
