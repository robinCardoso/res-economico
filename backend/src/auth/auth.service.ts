import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  async validateBasicAuth(email: string, password: string) {
    // TODO: implementar autenticação real (JWT/OAuth)
    const isDemoUser = email === 'demo@empresa.com.br' && password === 'senha123';
    if (!isDemoUser) {
      return null;
    }
    return {
      id: 'demo-user',
      email,
      nome: 'Usuário Demo',
      roles: ['admin'],
    };
  }
}
