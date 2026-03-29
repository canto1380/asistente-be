import { Module } from '@nestjs/common';
import { CategoriaGastoService } from './categoria-gasto.service';
import { CategoriaGastoController } from './categoria-gasto.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [CategoriaGastoController],
  providers: [CategoriaGastoService, PrismaService],
})
export class CategoriaGastoModule {}
