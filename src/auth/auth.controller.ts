import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() usuario: any) {
    const { email, password } = usuario;
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Clave incorrecta. Intente nuevamente');
    }
    return this.authService.login(user);
  }
  @Post('refresh')
  async refresh(@Body() body) {
    return this.authService.refresh(body.refresh_token);
  }
}
