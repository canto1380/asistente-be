import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { PermisosModule } from './permisos/permisos.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { EventosModule } from './eventos/eventos.module';
import { ListasTareasModule } from './listas-tareas/listas-tareas.module';
import { TareasModule } from './tareas/tareas.module';
import { CategoriaGastoModule } from './categoria-gasto/categoria-gasto.module';
import { GastosModule } from './gastos/gastos.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { IngresosModule } from './ingresos/ingresos.module';
import { RecordatoriosModule } from './recordatorios/recordatorios.module';
import { PushTokensModule } from './push-tokens/push-tokens.module';
import { OpenaiModule } from 'config/openai/openai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    RolesModule,
    PermisosModule,
    UsuariosModule,
    EventosModule,
    ListasTareasModule,
    TareasModule,
    CategoriaGastoModule,
    GastosModule,
    NotificacionesModule,
    IngresosModule,
    RecordatoriosModule,
    PushTokensModule,
    OpenaiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
