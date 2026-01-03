import { Body, Controller, Post, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    this.logger.log(`Tentativa de login para: ${dto.email}`);
    try {
      const result = await this.authService.login(dto.email, dto.password);
      this.logger.log(`Login bem-sucedido para: ${dto.email}`);
      return result;
    } catch (error) {
      this.logger.error(`Erro no login para ${dto.email}:`, error);
      throw error;
    }
  }
}
