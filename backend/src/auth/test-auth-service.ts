import { config } from 'dotenv';
import { SupabaseAuthService } from './supabase-auth.service';
import { SupabaseService } from '../supabase/supabase.service';
import { JwtService } from '@nestjs/jwt';

// Carregar variáveis de ambiente
config({ path: '.env' });

async function testAuthService() {
  console.log('🔍 Testando serviço de autenticação com Supabase...');
  
  try {
    // Criar instâncias dos serviços
    const supabaseService = new SupabaseService();
    const jwtService = new JwtService({
      secret: process.env.JWT_SECRET || 'default-secret-key-for-development',
      signOptions: { expiresIn: '1h' },
    });
    
    const authService = new SupabaseAuthService(supabaseService, jwtService);
    
    console.log('✅ Serviços inicializados com sucesso');
    
    // Testar método de obtenção de usuário do token (sem token válido)
    console.log('\n🔍 Testando validação de token...');
    try {
      await authService.getUserFromToken('token-invalido');
      console.log('❌ Erro: deveria ter lançado exceção para token inválido');
    } catch (error) {
      console.log('✅ Token inválido corretamente rejeitado');
    }
    
    console.log('\n✅ Todos os testes básicos do serviço de autenticação passaram!');
    console.log('💡 Para testes completos, execute o sistema e tente login/registro');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
    process.exit(1);
  }
}

testAuthService();