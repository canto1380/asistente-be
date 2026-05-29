import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenaiService implements OnModuleInit {
  private openai: OpenAI;
  private readonly logger = new Logger(OpenaiService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      this.logger.error('OPENAI_API_KEY no encontrada en las variables de entorno');
      return;
    }

    try {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('Cliente OpenAI inicializado correctamente');
    } catch (error) {
      this.logger.error('Error al inicializar el cliente OpenAI', error);
    }
  }

  // Método de utilidad para acceder al cliente desde otros servicios
  getClient(): OpenAI {
    return this.openai;
  }
}