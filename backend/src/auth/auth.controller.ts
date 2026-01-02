import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  SetMetadata,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseAuthService } from './supabase-auth.service';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { GetUser } from './get-user.decorator';

// Interfaces para os DTOs
interface LoginDto {
  email: string;
  password: string;
}

interface RegisterDto {
  email: string;
  password: string;
  nome: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: SupabaseAuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.signIn(loginDto.email, loginDto.password);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.signUp(
      registerDto.email,
      registerDto.password,
      registerDto.nome,
    );
  }

  @UseGuards(SupabaseAuthGuard)
  @Post('logout')
  async logout(@GetUser() user: any) {
    // O logout será implementado de forma mais completa com base na sessão
    // Por enquanto, retornamos uma mensagem indicando sucesso
    return { message: 'Logout realizado com sucesso' };
  }

  @UseGuards(SupabaseAuthGuard)
  @Get('profile')
  async getProfile(@GetUser() user: any) {
    return {
      id: user.id,
      email: user.email,
      // Adicionar mais informações do usuário conforme necessário
    };
  }

  // Exemplo de rota protegida com role específica
  @UseGuards(SupabaseAuthGuard)
  @SetMetadata('roles', ['admin'])
  @Get('admin')
  async adminAccess(@GetUser() user: any) {
    return { 
      message: 'Acesso administrativo autorizado', 
      user: {
        id: user.id,
        email: user.email,
      } 
    };
  }
}