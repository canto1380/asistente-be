import { Module } from '@nestjs/common';
import { PushTokensService } from './push-tokens.service';
import { PushTokensController } from './push-tokens.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [PushTokensService, PrismaService],
  controllers: [PushTokensController]
})
export class PushTokensModule {}
