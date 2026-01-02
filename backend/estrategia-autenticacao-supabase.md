# Estratégia de Autenticação para Supabase

## 1. Análise do Sistema Atual de Autenticação

### 1.1. Estrutura Atual
Com base na análise do schema Prisma, o sistema atual utiliza:

- **Tabela de Usuários** (`usuarios`): Armazena informações de autenticação
  - `email`: Campo único para login
  - `senha`: Senha armazenada de forma criptografada
  - `roles`: Array de permissões (ex: ["admin", "user", "gerente", "diretor"])
  - `ativo`: Status de ativação do usuário
  - `empresa_id`: Relacionamento com empresa (opcional)

### 1.2. Funcionalidades de Autenticação
- Login e autenticação JWT
- Sistema de roles e permissões
- Relacionamento com empresas
- Auditoria de acessos (`ultimo_acesso`)

## 2. Integração com Supabase Auth

### 2.1. Benefícios do Supabase Auth
- Autenticação segura gerenciada
- Suporte a provedores OAuth (Google, GitHub, etc.)
- Recuperação de senha automática
- Segurança contra ataques comuns
- Integração fácil com o banco de dados

### 2.2. Estratégia de Migração
A migração para Supabase Auth pode ser feita de duas formas:

#### Opção A: Substituição Completa
- Migrar usuários existentes para o sistema de autenticação do Supabase
- Utilizar `supabase.auth.admin.createUser` para criar usuários com senhas hash
- Manter informações adicionais na tabela `usuarios` como perfil

#### Opção B: Integração Paralela
- Manter o sistema atual de autenticação
- Gradualmente adicionar suporte ao Supabase Auth
- Usar os dois sistemas em paralelo durante a transição

## 3. Recomendação: Substituição Completa com Integração

### 3.1. Etapas da Migração

#### Fase 1: Preparação
1. Criar função no Supabase para sincronizar usuários
2. Atualizar a tabela `usuarios` para incluir o `id` do Supabase Auth
3. Configurar RLS (Row Level Security) para proteger os dados

#### Fase 2: Migração de Usuários
```sql
-- Adicionar coluna para armazenar o ID do Supabase Auth
ALTER TABLE usuarios ADD COLUMN supabase_user_id UUID;

-- Criar índice para otimizar buscas
CREATE INDEX idx_usuarios_supabase_user_id ON usuarios(supabase_user_id);
```

#### Fase 3: Integração do Backend
- Substituir sistema de autenticação JWT por Supabase Auth
- Atualizar middleware de autenticação
- Adaptar os controllers para usar o usuário do Supabase Auth

### 3.2. Configuração de RLS (Row Level Security)

```sql
-- Habilitar RLS para a tabela de usuários
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas seus próprios dados
CREATE POLICY usuarios_select_policy ON usuarios
  FOR SELECT TO authenticated
  USING (supabase_user_id = auth.uid());

-- Política para permitir que usuários atualizem apenas seus próprios dados
CREATE POLICY usuarios_update_policy ON usuarios
  FOR UPDATE TO authenticated
  USING (supabase_user_id = auth.uid())
  WITH CHECK (supabase_user_id = auth.uid());

-- Política para permitir que usuários insiram dados (apenas para admin)
CREATE POLICY usuarios_insert_policy ON usuarios
  FOR INSERT TO service_role
  WITH CHECK (true);

-- Política para permitir que admin delete dados
CREATE POLICY usuarios_delete_policy ON usuarios
  FOR DELETE TO service_role
  USING (true);
```

## 4. Adaptações Necessárias no Código

### 4.1. Backend (NestJS)
- Substituir `@nestjs/jwt` por `@supabase/supabase-js` para autenticação
- Atualizar o `AuthGuard` para usar Supabase Auth
- Adaptar os decorators de autorização para trabalhar com roles do sistema

### 4.2. Frontend (Next.js)
- Substituir o sistema de autenticação atual por `@supabase/supabase-js`
- Atualizar o serviço de autenticação (`auth.service.ts`)
- Adaptar o armazenamento de tokens (localStorage → Supabase Auth state)

## 5. Preservação de Roles e Permissões

### 5.1. Sistema de Roles
O sistema atual de roles (armazenado como array no campo `roles`) pode ser mantido:

```typescript
// Exemplo de verificação de roles
const user = await supabase.auth.getUser();
const userProfile = await getUserProfile(user.data.user.id);

// Verificar roles
if (userProfile.roles.includes('admin')) {
  // Ação para administradores
}
```

### 5.2. Middleware de Autorização
Adaptar o middleware para verificar tanto a autenticação quanto as permissões:

```typescript
// Exemplo de guard com Supabase Auth
@Injectable()
export class RolesGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = await request.supabase.auth.getUser();
    
    if (!user.data.user) {
      throw new UnauthorizedException();
    }
    
    // Verificar roles específicos
    const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }
    
    const userProfile = await getUserProfile(user.data.user.id);
    return requiredRoles.some((role) => userProfile.roles.includes(role));
  }
}
```

## 6. Considerações de Segurança

### 6.1. Senhas
- Durante a migração, as senhas existentes precisam ser importadas corretamente
- Usar `supabase.auth.admin.createUser` com a senha já hash se necessário
- Recomendar a redefinição de senhas após a migração para segurança

### 6.2. Tokens
- Substituir JWT personalizado pelo sistema de sessão do Supabase
- Configurar refresh automático de tokens
- Garantir que os tokens tenham expiração apropriada

## 7. Plano de Execução

### 7.1. Etapa 1: Configuração Inicial
- Configurar Supabase Auth no projeto
- Atualizar variáveis de ambiente
- Criar scripts para migração de usuários

### 7.2. Etapa 2: Adaptação do Backend
- Substituir sistema de autenticação JWT
- Atualizar controllers e services
- Implementar RLS no banco de dados

### 7.3. Etapa 3: Adaptação do Frontend
- Substituir serviço de autenticação
- Atualizar componentes de login
- Testar fluxo completo de autenticação

### 7.4. Etapa 4: Testes e Validação
- Testar todas as funcionalidades protegidas
- Validar permissões e roles
- Verificar segurança de dados

## 8. Checklist de Implementação

- [ ] Configurar Supabase Auth no projeto
- [ ] Atualizar variáveis de ambiente no `.env`
- [ ] Criar script para migrar usuários existentes
- [ ] Adicionar coluna `supabase_user_id` à tabela `usuarios`
- [ ] Implementar RLS para proteger os dados
- [ ] Substituir JWT Auth por Supabase Auth no backend
- [ ] Atualizar serviço de autenticação no frontend
- [ ] Testar fluxo de login/logout
- [ ] Validar sistema de roles e permissões
- [ ] Testar segurança de dados por RLS
- [ ] Documentar a nova arquitetura de autenticação