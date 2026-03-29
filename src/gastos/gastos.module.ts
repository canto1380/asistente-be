import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GastosService } from './gastos.service';
import { GastosController } from './gastos.controller';

@Module({
  controllers: [GastosController],
  providers: [GastosService, PrismaService],
  exports: [GastosService],
})
export class GastosModule {}
