import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsuariosModule } from 'src/usuarios/usuarios.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { jwtSecret } from 'config/constants';

@Module({
  imports: [
    UsuariosModule,
    PassportModule,
    // Generacion del TOKEN
    JwtModule.register({
      secret: jwtSecret,
      signOptions: { expiresIn: '5h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
