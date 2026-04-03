import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ValidationPipe, UsePipes, HttpCode, ParseUUIDPipe } from '@nestjs/common';
import { CategoriaGastoService } from './categoria-gasto.service';
import { CreateCategoriaGastoDto } from './dto/create-categoria-gasto.dto';
import { UpdateCategoriaGastoDto } from './dto/update-categoria-gasto.dto';
import { Roles } from 'src/auth/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/roles.guard';
import { GetUser } from 'src/auth/get-user.decorator';

@Controller('categoria-gasto')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'ADMINEMPRESA')
export class CategoriaGastoController {
  constructor(private readonly categoriaGastoService: CategoriaGastoService) { }

  @Post('/')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @HttpCode(201)
  create(@Body() categoriaGasto: CreateCategoriaGastoDto, @GetUser() user: { userId: string, role: string }) {
    return this.categoriaGastoService.create(categoriaGasto, user.userId, user.role);
  }

  @Get('/')
  @HttpCode(200)
  findAll(@GetUser() user: { userId: string, role: string }) {
    return this.categoriaGastoService.findAll(user.userId, user.role);
  }

  @Get(':id')
  @HttpCode(200)
  findOne(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: { userId: string, role: string }) {
    return this.categoriaGastoService.findOne(id, user.userId, user.role);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @HttpCode(200)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() categoriaGasto: UpdateCategoriaGastoDto,
    @GetUser() user: { userId: string, role: string }
  ) {
    return this.categoriaGastoService.update(id, categoriaGasto, user.userId, user.role);
  }

  @Delete(':id')
  @HttpCode(200)
  delete(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: { userId: string, role: string }) {
    return this.categoriaGastoService.deleteCategoriaGasto(id, user.userId, user.role);
  }
}