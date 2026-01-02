import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config({ path: '.env' });

// Obter credenciais do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias');
  process.exit(1);
}

// Cliente do Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthValidation() {
  console.log('🔐 Iniciando testes de autenticação e autorização...');
  
  try {
    console.log('\n🔍 Testando conexão com Supabase Auth...');
    
    // Testar se conseguimos obter informações do usuário sem estar autenticado
    const { data: { user: unauthenticatedUser }, error: unauthError } = await supabase.auth.getUser();
    
    if (unauthError) {
      console.log('✅ Correto: Não é possível obter usuário sem autenticação:', unauthError.message);
    } else {
      console.log('⚠️  Aviso: Foi possível obter usuário sem autenticação');
    }
    
    // Testar métodos de autenticação disponíveis
    console.log('\n📋 Verificando métodos de autenticação...');
    
    // Testar se as tabelas de autenticação existem
    const { error: usersCheckError } = await supabase
      .from('usuarios')
      .select('id', { count: 'exact', head: true });
    
    if (usersCheckError) {
      if (usersCheckError.code === '42P01') {
        console.log('⚠️  Tabela "usuarios" não existe (aguardando migração de dados)');
      } else {
        console.log('⚠️  Erro ao verificar tabela de usuários:', usersCheckError.message);
      }
    } else {
      console.log('✅ Tabela "usuarios" está acessível');
      
      // Contar usuários existentes
      const { count: userCount, error: countError } = await supabase
        .from('usuarios')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.log('⚠️  Erro ao contar usuários:', countError.message);
      } else {
        console.log(`📊 Total de usuários: ${userCount}`);
      }
    }
    
    // Testar se a tabela de empresas está acessível (importante para autorização)
    const { error: empresasCheckError } = await supabase
      .from('empresas')
      .select('id', { count: 'exact', head: true });
    
    if (empresasCheckError) {
      if (empresasCheckError.code === '42P01') {
        console.log('⚠️  Tabela "empresas" não existe (aguardando migração de dados)');
      } else {
        console.log('⚠️  Erro ao verificar tabela de empresas:', empresasCheckError.message);
      }
    } else {
      console.log('✅ Tabela "empresas" está acessível');
    }
    
    // Testar se o RLS (Row Level Security) está habilitado
    console.log('\n🔒 Verificando configurações de segurança...');
    
    // Verificar se policies existem para a tabela de usuários
    const { data: policies, error: policyError } = await supabase
      .from('information_schema.row_security_policies')
      .select('*')
      .eq('table_name', 'usuarios');
    
    if (policyError) {
      console.log('⚠️  Não foi possível verificar policies de segurança:', policyError.message);
    } else if (policies && policies.length > 0) {
      console.log(`✅ ${policies.length} policies de segurança encontradas para a tabela "usuarios"`);
    } else {
      console.log('⚠️  Nenhuma policy de segurança encontrada para a tabela "usuarios" (pode ser normal se ainda não aplicado)');
    }
    
    console.log('\n✅ Testes de autenticação e autorização concluídos!');
    console.log('📋 Próximos passos:');
    console.log('   1. Verificar se os dados de usuários foram migrados corretamente');
    console.log('   2. Testar o fluxo completo de login com credenciais reais');
    console.log('   3. Validar as políticas de RLS aplicadas às tabelas');
    console.log('   4. Testar permissões de acesso por role');
    
  } catch (error) {
    console.error('❌ Erro durante os testes de autenticação:', error.message);
    process.exit(1);
  }
}

// Executar a função principal se este arquivo for executado diretamente
if (require.main === module) {
  testAuthValidation();
}

export { testAuthValidation };