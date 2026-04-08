import { Injectable, UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UsuariosService } from 'src/usuarios/usuarios.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usuariosService: UsuariosService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usuariosService.findByEmail(email);
    if(!user) return null
    if (await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    } else {
      throw new NotFoundException(`La clave ingresada es incorrecta.`)
    }
  }

  async login(user: any) {
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role?.nombre,
      // Agregamos datos de perfil al token (información pública del usuario)
      nombre: user.nombre,
      apellido: user.apellido
    };
    
    // Generamos Access Token (vida corta, ej: 1 hora)
    const accessToken = this.jwtService.sign(payload, { expiresIn: '5h' });
    
    // Generamos Refresh Token (vida larga, ej: 7 días)
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: user
    };
  }

  async refresh(refreshToken: string) {
    try {
      // Verificamos que el refresh token sea válido
      const payload = this.jwtService.verify(refreshToken);
      
      // Buscamos al usuario para asegurar que sigue existiendo/activo
      const user = await this.usuariosService.findOneUsuario(payload.sub);
      // Generamos un nuevo payload limpio (sin fechas de exp viejas)
      const newPayload = { 
        sub: user.id, 
        email: user.email, 
        role: user.role?.nombre,
        nombre: user.nombre,
        apellido: user.apellido
      };

      return {
        access_token: this.jwtService.sign(newPayload, { expiresIn: '7d' }),
        // Opcional: Podrías rotar el refresh token aquí también si quisieras máxima seguridad
        refresh_token: refreshToken 
      };
    } catch (e) {
      throw new ForbiddenException('Token de refresco inválido o expirado');
    }
  }
}
