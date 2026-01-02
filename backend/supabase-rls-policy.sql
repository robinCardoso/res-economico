
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
