import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtSecret } from 'config/constants';

/**
 * Estrategia para verificar tokens en rutas protegidas
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            // Busca el token en el encabezado Authorization que empiece con Bearer
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            // Si el token esta vencido, no lo deja pasar
            ignoreExpiration: false,
            secretOrKey: jwtSecret,
        });
    }

    /**
     * Se ejecuta cuandoEste método se ejecuta SOLO si el token es válido (firma correcta y no expirado).
     * 'payload' es la información que guardaste dentro del token en AuthService.login()
     * (ej: { sub: 'uuid', email: '...', role: 'ADMIN' })
     **/
    async validate(payload: any) {
        // Esto es lo que se inyecta en request.user
        return { userId: payload.sub, email: payload.email, role: payload.role };
    }
}
