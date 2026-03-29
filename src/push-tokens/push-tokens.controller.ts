import { Controller, Post, Body, UseGuards, ValidationPipe, UsePipes, HttpCode } from '@nestjs/common';
import { PushTokensService } from './push-tokens.service';
import { CreatePushTokenDto } from './create-push-token.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/get-user.decorator';

@Controller('push-tokens')
@UseGuards(AuthGuard('jwt'))
export class PushTokensController {
  constructor(private readonly pushTokensService: PushTokensService) {}

  @Post('/')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @HttpCode(201)
  create(
    @Body() createPushTokenDto: CreatePushTokenDto,
    @GetUser() user: { userId: string },
  ) {
    return this.pushTokensService.createOrUpdate(createPushTokenDto, user.userId);
  }
}
