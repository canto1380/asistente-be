import { Module, forwardRef } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ListasTareasController } from './listas-tareas.controller';
import { ListasTareasService } from './listas-tareas.service';
import { RecordatoriosModule } from 'src/recordatorios/recordatorios.module';
import { TareasModule } from 'src/tareas/tareas.module';

@Module({
  imports: [RecordatoriosModule, forwardRef(() => TareasModule)],
  controllers: [ListasTareasController],
  providers: [ListasTareasService, PrismaService],
  exports: [ListasTareasService],
})
export class ListasTareasModule {}
