import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePushTokenDto } from './create-push-token.dto';


@Injectable()
export class PushTokensService {
  private readonly logger = new Logger(PushTokensService.name);


  constructor(private prisma: PrismaService) { }

  async createOrUpdate(dto: CreatePushTokenDto, usuarioId: string) {
    // Usamos upsert para crear el token si no existe, o actualizarlo si ya existe
    // Esto evita duplicados y mantiene la información del dispositivo al día
    try {
      this.logger.log('datos push token: ', dto, usuarioId)
      const token = await this.prisma.pushToken.upsert({
        where: { token: dto.token },
        update: {
          usuarioId,
          tipoDispositivo: dto.tipoDispositivo,
        },
        create: {
          ...dto,
          usuarioId,
        },
      });
      return token;
    } catch (error) {
      console.log('error: ', error)
    }
  }
}
