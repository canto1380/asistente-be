// src/notificaciones/notificaciones.service.ts

import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);

  constructor(
    private prisma: PrismaService,
  ) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    if (admin.apps.length > 0) {
      return;
    }

    try {
      const jsonFromEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
      if (jsonFromEnv) {
        const serviceAccount = JSON.parse(jsonFromEnv) as admin.ServiceAccount;
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        this.logger.log(
          'Firebase Admin SDK inicializado correctamente (credenciales desde FIREBASE_SERVICE_ACCOUNT_JSON).',
        );
        return;
      }

      const serviceAccountPath = path.join(
        process.cwd(),
        'config',
        'firebase-service-account.json',
      );
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const serviceAccount = require(serviceAccountPath) as admin.ServiceAccount;
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      this.logger.log(
        'Firebase Admin SDK inicializado correctamente (archivo config/firebase-service-account.json).',
      );
    } catch (error) {
      this.logger.error(
        'Error al inicializar Firebase Admin SDK. En producción define FIREBASE_SERVICE_ACCOUNT_JSON en el host; en local usa config/firebase-service-account.json.',
        error instanceof Error ? error.stack : error,
      );
    }
  }

  async enviarNotificacion(
    token: string,
    titulo: string,
    cuerpo: string,
    data?: { [key: string]: string },
  ): Promise<void> {
    if (admin.apps.length === 0) {
      this.logger.warn(
        'Firebase Admin no está inicializado; no se envía la notificación push.',
      );
      return;
    }

    const message: admin.messaging.Message = {
      token: token,
      // Se elimina el campo 'notification' para enviar una notificación de solo datos (Data-only).
      // Esto da control total al Service Worker en el frontend para mostrar la notificación,
      // lo cual es crucial para manejar acciones personalizadas como 'Posponer' de forma fiable.
      data: {
        title: titulo,
        body: cuerpo,
        ...data,
      },
      android: {
        priority: 'high', // Prioridad alta para Android
      },
      webpush: {
        headers: {
          Urgency: 'high', // Prioridad alta para Web Push estándar
        },
        fcmOptions: {
          // Opcional: link que se abre al hacer clic en la notificación
          // link: 'https://tu-app.com/eventos'
        },
      },
    };

    try {
      this.logger.debug(`[DEBUG] Payload final a Firebase: ${JSON.stringify(message.data)}`);
      await admin.messaging().send(message);
      this.logger.log(`Notificación enviada a token: ${token}`);
    } catch (error) {
      this.logger.error(`Error al enviar notificación a token ${token}: `, error.code);
      
      // Si el token ya no es válido, lo eliminamos de la base de datos.
      if (error.code === 'messaging/registration-token-not-registered') {
        this.logger.log(`Token inválido. Eliminando de la DB: ${token}...`);
        // Usamos deleteMany por si acaso, aunque el token es único. No falla si no lo encuentra.
        await this.prisma.pushToken.deleteMany({ where: { token } });
      }
    }
  }
}
