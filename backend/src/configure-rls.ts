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

// Script SQL para configurar RLS
const rlsScript = `
-- Configuração de RLS (Row Level Security) para o Supabase

-- 1. Habilitar RLS para tabelas importantes
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE atas_reuniao ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- 2. Criar políticas de segurança para tabela de empresas
-- Permitir que usuários vejam apenas as empresas associadas a eles
CREATE POLICY empresas_usuario_policy ON empresas
  FOR SELECT TO authenticated
  USING (
    id = ANY (
      SELECT empresa_id 
      FROM usuarios 
      WHERE id = auth.uid()
    ) OR auth.uid() IN (
      SELECT id 
      FROM usuarios 
      WHERE roles @> ARRAY['admin']::TEXT[]
    )
  );

-- Permitir que usuários criem empresas se tiverem permissão
CREATE POLICY empresas_insert_policy ON empresas
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT id 
      FROM usuarios 
      WHERE roles @> ARRAY['admin']::TEXT[]
    )
  );

-- Permitir que usuários atualizem empresas se tiverem permissão
CREATE POLICY empresas_update_policy ON empresas
  FOR UPDATE TO authenticated
  USING (
    auth.uid() IN (
      SELECT id 
      FROM usuarios 
      WHERE roles @> ARRAY['admin']::TEXT[]
    )
  );

-- Permitir que usuários excluam empresas se tiverem permissão
CREATE POLICY empresas_delete_policy ON empresas
  FOR DELETE TO authenticated
  USING (
    auth.uid() IN (
      SELECT id 
      FROM usuarios 
      WHERE roles @> ARRAY['admin']::TEXT[]
    )
  );

-- 3. Criar políticas de segurança para tabela de usuários
-- Permitir que usuários vejam apenas seus próprios dados ou se forem admin
CREATE POLICY usuarios_select_policy ON usuarios
  FOR SELECT TO authenticated
  USING (
    id = auth.uid() OR auth.uid() IN (
      SELECT id 
      FROM usuarios 
      WHERE roles @> ARRAY['admin']::TEXT[]
    )
  );

-- Permitir que usuários atualizem apenas seus próprios dados
CREATE POLICY usuarios_update_policy ON usuarios
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 4. Criar políticas de segurança para uploads
-- Permitir que usuários vejam apenas uploads da empresa associada
CREATE POLICY uploads_select_policy ON uploads
  FOR SELECT TO authenticated
  USING (
    empresa_id = ANY (
      SELECT empresa_id 
      FROM usuarios 
      WHERE id = auth.uid()
    ) OR auth.uid() IN (
      SELECT id 
      FROM usuarios 
      WHERE roles @> ARRAY['admin']::TEXT[]
    )
  );

-- Permitir que usuários criem uploads se estiverem associados à empresa
CREATE POLICY uploads_insert_policy ON uploads
  FOR INSERT TO authenticated
  WITH CHECK (
    empresa_id = ANY (
      SELECT empresa_id 
      FROM usuarios 
      WHERE id = auth.uid()
    ) OR auth.uid() IN (
      SELECT id 
      FROM usuarios 
      WHERE roles @> ARRAY['admin']::TEXT[]
    )
  );

-- 5. Criar políticas de segurança para processos
-- Permitir que usuários vejam apenas processos da empresa associada
CREATE POLICY processos_select_policy ON processos
  FOR SELECT TO authenticated
  USING (
    empresa_id = ANY (
      SELECT empresa_id 
      FROM usuarios 
      WHERE id = auth.uid()
    ) OR auth.uid() IN (
      SELECT id 
      FROM usuarios 
      WHERE roles @> ARRAY['admin']::TEXT[]
    )
  );

-- Permitir que usuários criem processos se estiverem associados à empresa
CREATE POLICY processos_insert_policy ON processos
  FOR INSERT TO authenticated
  WITH CHECK (
    empresa_id = ANY (
      SELECT empresa_id 
      FROM usuarios 
      WHERE id = auth.uid()
    ) OR auth.uid() IN (
      SELECT id 
      FROM usuarios 
      WHERE roles @> ARRAY['admin']::TEXT[]
    )
  );

-- 6. Criar políticas de segurança para atas de reunião
-- Permitir que usuários vejam apenas atas da empresa associada
CREATE POLICY atas_select_policy ON atas_reuniao
  FOR SELECT TO authenticated
  USING (
    empresa_id = ANY (
      SELECT empresa_id 
      FROM usuarios 
      WHERE id = auth.uid()
    ) OR auth.uid() IN (
      SELECT id 
      FROM usuarios 
      WHERE roles @> ARRAY['admin']::TEXT[]
    )
  );

-- Permitir que usuários criem atas se estiverem associados à empresa
CREATE POLICY atas_insert_policy ON atas_reuniao
  FOR INSERT TO authenticated
  WITH CHECK (
    empresa_id = ANY (
      SELECT empresa_id 
      FROM usuarios 
      WHERE id = auth.uid()
    ) OR auth.uid() IN (
      SELECT id 
      FROM usuarios 
      WHERE roles @> ARRAY['admin']::TEXT[]
    )
  );

-- 7. Criar políticas de segurança para vendas
-- Permitir que usuários vejam apenas vendas da empresa associada
CREATE POLICY vendas_select_policy ON vendas
  FOR SELECT TO authenticated
  USING (
    empresa_id = ANY (
      SELECT empresa_id 
      FROM usuarios 
      WHERE id = auth.uid()
    ) OR auth.uid() IN (
      SELECT id 
      FROM usuarios 
      WHERE roles @> ARRAY['admin']::TEXT[]
    )
  );

-- 8. Criar políticas de segurança para pedidos
-- Permitir que usuários vejam apenas pedidos da empresa associada
CREATE POLICY pedidos_select_policy ON pedidos
  FOR SELECT TO authenticated
  USING (
    empresa_id = ANY (
      SELECT empresa_id 
      FROM usuarios 
      WHERE id = auth.uid()
    ) OR auth.uid() IN (
      SELECT id 
      FROM usuarios 
      WHERE roles @> ARRAY['admin']::TEXT[]
    )
  );

-- 9. Criar políticas de segurança para tabelas de configurações
-- Permitir acesso limitado a configurações
CREATE POLICY configuracoes_select_policy ON configuracoes_modelo_negocio
  FOR SELECT TO authenticated
  USING (
    auth.uid() IN (
      SELECT id 
      FROM usuarios 
      WHERE roles @> ARRAY['admin', 'gerente']::TEXT[]
    )
  );

-- Permitir que apenas admins criem/editem configurações
CREATE POLICY configuracoes_modify_policy ON configuracoes_modelo_negocio
  FOR ALL TO authenticated
  USING (
    auth.uid() IN (
      SELECT id 
      FROM usuarios 
      WHERE roles @> ARRAY['admin']::TEXT[]
    )
  );

-- 10. Configurar políticas para tabelas de logs e histórico
-- Permitir que usuários vejam logs relacionados às suas ações
CREATE POLICY logs_auditoria_select_policy ON logs_auditoria
  FOR SELECT TO authenticated
  USING (
    usuario_id = auth.uid() OR auth.uid() IN (
      SELECT id 
      FROM usuarios 
      WHERE roles @> ARRAY['admin']::TEXT[]
    )
  );

-- Fim da configuração de RLS
`;

async function configureRLS() {
  console.log('🔐 Iniciando configuração de RLS (Row Level Security)...');
  
  try {
    console.log('⚠️  Aviso: Este script serve para verificar a conexão e preparar o RLS');
    console.log('💡 Para aplicar as políticas de RLS, use o painel SQL do Supabase');
    console.log('🔗 Acesse: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql');
    
    // Testar conexão
    console.log('\n🔍 Testando conexão com o banco de dados...');
    
    // Verificar se estamos conectados ao Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('⚠️  Não autenticado no Supabase Auth (isso é normal para configuração de banco de dados)');
    } else {
      console.log('✅ Conectado ao Supabase Auth como:', user?.email || user?.id);
    }
    
    console.log('\n📋 Script de RLS preparado com sucesso!');
    console.log('📝 Políticas de segurança criadas para as seguintes tabelas:');
    console.log('   - empresas: Controle de acesso por empresa e admin');
    console.log('   - usuarios: Acesso próprio e admin');
    console.log('   - uploads: Acesso por empresa associada');
    console.log('   - processos: Acesso por empresa associada');
    console.log('   - atas_reuniao: Acesso por empresa associada');
    console.log('   - vendas: Acesso por empresa associada');
    console.log('   - pedidos: Acesso por empresa associada');
    console.log('   - configuracoes_modelo_negocio: Acesso por role');
    console.log('   - logs_auditoria: Acesso por usuário ou admin');
    
    console.log('\n🔐 Próximos passos para implementar o RLS:');
    console.log('   1. Copie o conteúdo da constante rlsScript para o editor SQL do Supabase');
    console.log('   2. Execute o script no painel do Supabase para aplicar as políticas');
    console.log('   3. Teste o acesso para garantir que as políticas estão funcionando corretamente');
    
    // Salvar o script em um arquivo para fácil acesso
    const fs = require('fs').promises;
    await fs.writeFile('supabase-rls-policy.sql', rlsScript);
    console.log('\n💾 Script de RLS salvo em: supabase-rls-policy.sql');
    
    console.log('\n✅ Configuração de RLS preparada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a configuração do RLS:', error.message);
    process.exit(1);
  }
}

configureRLS();