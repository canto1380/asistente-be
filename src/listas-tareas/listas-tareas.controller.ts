import {
  Body,
  Controller,
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
import { CreateListaTareaDto } from './dto/create-lista-tarea.dto';
import { UpdateListaTareaDto } from './dto/update-lista-tarea.dto';
import { ListasTareasService } from './listas-tareas.service';

@Controller('listas-tareas')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'ADMINEMPRESA')
export class ListasTareasController {
  constructor(private readonly listasTareasService: ListasTareasService) {}

  @Post('/')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @HttpCode(201)
  create(@Body() lsitaTarea: CreateListaTareaDto, @GetUser() user: { userId: string }) {
    return this.listasTareasService.createListaTarea(lsitaTarea, user.userId);
  }

  @Get('/')
  @HttpCode(200)
  findAll(@GetUser() user: { userId: string; role: string }) {
    return this.listasTareasService.findAllListasTareas(user.userId, user.role);
  }

  @Get('/:id')
  @HttpCode(200)
  findOne(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: { userId: string; role: string }) {
    return this.listasTareasService.findOneListaTarea(id, user.userId, user.role);
  }

  @Patch('/:id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @HttpCode(200)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() listaTarea: UpdateListaTareaDto,
    @GetUser() user: { userId: string; role: string },
  ) {
    return this.listasTareasService.updateListaTarea(id, listaTarea, user.userId, user.role);
  }
}

