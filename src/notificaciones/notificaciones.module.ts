import { Module } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [NotificacionesService, PrismaService],
  exports: [NotificacionesService],
})
export class NotificacionesModule {}
