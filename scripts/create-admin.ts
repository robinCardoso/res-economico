import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Carregar variáveis de ambiente
config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas');
  console.error('Certifique-se de que .env.local contém:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Cliente com service role (tem permissões de admin)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  try {
    console.log('🔄 Criando usuário admin...');

    // 1. Criar usuário no Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'contato@redeuniaonacional.com.br',
      password: 'Pcs759153',
      email_confirm: true, // Auto-confirmar email
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Usuário não foi criado');
    }

    console.log('✅ Usuário criado no Auth:', authData.user.id);

    // 2. Criar registro na tabela usuarios
    const { error: userError } = await supabase
      .from('usuarios')
      .insert({
        id: authData.user.id,
        email: 'contato@redeuniaonacional.com.br',
        nome: 'Robson Soares Cardoso',
        senha: '', // Gerenciado pelo Auth
        roles: ['admin', 'user'],
        ativo: true,
        empresa_id: null,
      });

    if (userError) {
      // Se houver erro, tentar fazer update
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({
          roles: ['admin', 'user'],
          ativo: true,
        })
        .eq('id', authData.user.id);

      if (updateError) {
        throw updateError;
      }
    }

    console.log('✅ Usuário admin criado com sucesso!');
    console.log('📧 E-mail: contato@redeuniaonacional.com.br');
    console.log('🔑 Senha: Pcs759153');
    console.log('👤 Roles: admin, user');

  } catch (error: any) {
    console.error('❌ Erro ao criar usuário:', error.message);
    process.exit(1);
  }
}

createAdminUser();
