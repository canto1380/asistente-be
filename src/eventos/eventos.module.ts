import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GastosModule } from 'src/gastos/gastos.module';
import { EventosService } from './eventos.service';
import { EventosController } from './eventos.controller';
import { RecordatoriosModule } from 'src/recordatorios/recordatorios.module';
import { OpenaiModule } from 'config/openai/openai.module';

@Module({
  imports: [GastosModule, RecordatoriosModule, OpenaiModule],
  controllers: [EventosController],
  providers: [EventosService, PrismaService],
})
export class EventosModule {}
