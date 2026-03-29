import { Module } from '@nestjs/common';
import { PermisosService } from './permisos.service';
import { PermisosController } from './permisos.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [PermisosController],
  providers: [PermisosService, PrismaService],
})
export class PermisosModule {}
