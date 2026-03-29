import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/get-user.decorator';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { CreateTareaDto } from './dto/create-tarea.dto';
import { UpdateTareaDto } from './dto/update-tarea.dto';
import { TareasService } from './tareas.service';
import { UpdateEstadoTareaDto } from './dto/update-estado-tarea.dto';
import { UpdatePrioridadTareaDto } from './dto/update-prioridad-tare.dto';

@Controller('tareas')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'ADMINEMPRESA')
export class TareasController {
  constructor(private readonly tareasService: TareasService) {}

  @Post('/')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @HttpCode(201)
  create(@Body() tarea: CreateTareaDto, @GetUser() user: { userId: string; role: string}) {
    return this.tareasService.createTarea(tarea, user.userId, user.role);
  }

  @Get('/')
  @HttpCode(200)
  findAll(@GetUser() user: { userId: string; role: string }) {
    return this.tareasService.findAllTareas(user.userId, user.role);
  }

  @Get('/:id')
  @HttpCode(200)
  findOne(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: { userId: string; role: string }) {
    return this.tareasService.findOneTarea(id, user.userId, user.role);
  }

  @Patch('/:id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @HttpCode(200)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() tarea: UpdateTareaDto,
    @GetUser() user: { userId: string; role: string },
  ) {
    return this.tareasService.updateTarea(id, tarea, user.userId, user.role);
  }

  @Patch('/toggle/:id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @HttpCode(200)
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() estado: UpdateEstadoTareaDto,
    @GetUser() user: { userId: string, role: string}
  ) {
    return this.tareasService.updateStatusTarea(id, user.userId, user.role, estado);
  }

  @Patch('/estado-prioridad/:id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @HttpCode(200)
  updateEstadoPrioridad(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() prioridad: UpdatePrioridadTareaDto,
    @GetUser() user: { userId: string, role: string}
  ) {
    return this.tareasService.updatePrioridadTarea(id, user.userId, user.role, prioridad)
  }

  @Delete('/:id')
  @HttpCode(200)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: { userId: string, role: string },
  ) {
    return this.tareasService.removeTarea(id, user.userId, user.role);
  }
}
