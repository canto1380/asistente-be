import { Module } from '@nestjs/common';
import { RecordatoriosService } from './recordatorios.service';
import { RecordatoriosController } from './recordatorios.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificacionesModule } from 'src/notificaciones/notificaciones.module';

@Module({
  imports: [NotificacionesModule],
  controllers: [RecordatoriosController],
  providers: [RecordatoriosService, PrismaService],
  exports: [RecordatoriosService],
})
export class RecordatoriosModule {}
