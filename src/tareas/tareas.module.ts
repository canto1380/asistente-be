import { Module, forwardRef } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { GastosModule } from 'src/gastos/gastos.module';
import { TareasController } from './tareas.controller';
import { TareasService } from './tareas.service';
import { ListasTareasModule } from 'src/listas-tareas/listas-tareas.module';
import { RecordatoriosModule } from 'src/recordatorios/recordatorios.module';

@Module({
  imports: [GastosModule, forwardRef(() => ListasTareasModule), RecordatoriosModule],
  controllers: [TareasController],
  providers: [TareasService, PrismaService],
  exports: [TareasService],
})
export class TareasModule {}
