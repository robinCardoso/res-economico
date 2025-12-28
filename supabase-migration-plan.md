# Plano de Migração para Supabase e Unificação Backend-Frontend

## Visão Geral

Este plano detalha a migração do sistema atual para uma arquitetura baseada em Supabase com unificação do backend e frontend usando Next.js. O objetivo é criar uma aplicação full-stack mais coesa e eficiente, aproveitando os recursos de banco de dados, autenticação e armazenamento do Supabase.

## Objetivos

1. Migrar o backend NestJS para Next.js App Router
2. Conectar o sistema ao Supabase (banco de dados PostgreSQL, autenticação, armazenamento)
3. Unificar backend e frontend em uma única aplicação Next.js
4. Manter todas as funcionalidades atuais do sistema
5. Melhorar a experiência de desenvolvimento e manutenção

## Estrutura de Pastas

```
res-economico/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── .vscode/
│   └── settings.json
├── public/
│   ├── icons/
│   ├── images/
│   └── favicon.ico
├── src/
│   ├── app/                    # Rotas Next.js App Router
│   │   ├── (auth)/             # Páginas de autenticação
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   ├── (dashboard)/        # Páginas do painel
│   │   │   ├── dashboard/
│   │   │   ├── empresas/
│   │   │   ├── usuarios/
│   │   │   ├── processos/
│   │   │   ├── pedidos/
│   │   │   ├── vendas/
│   │   │   ├── atas/
│   │   │   └── configuracoes/
│   │   ├── api/                # Rotas API do Next.js
│   │   │   ├── auth/
│   │   │   │   ├── [[...nextauth]]/  # NextAuth.js
│   │   │   │   └── [...nextauth]/
│   │   │   ├── supabase/
│   │   │   │   ├── webhook/
│   │   │   │   └── realtime/
│   │   │   ├── ai/
│   │   │   ├── uploads/
│   │   │   └── reports/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/             # Componentes React reutilizáveis
│   │   ├── ui/                 # Componentes base (botões, inputs, etc.)
│   │   ├── forms/              # Componentes de formulário
│   │   ├── tables/             # Componentes de tabela
│   │   ├── charts/             # Componentes de gráficos
│   │   └── navigation/         # Componentes de navegação
│   ├── hooks/                  # Hooks personalizados
│   │   ├── useAuth.ts
│   │   ├── useSupabase.ts
│   │   └── useRealtime.ts
│   ├── lib/                    # Lógica de negócios e utilitários
│   │   ├── supabase/           # Cliente Supabase
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   ├── validations/        # Esquemas de validação (Zod)
│   │   ├── utils.ts
│   │   └── constants.ts
│   ├── services/               # Serviços de negócio
│   │   ├── auth.service.ts
│   │   ├── empresas.service.ts
│   │   ├── usuarios.service.ts
│   │   ├── processos.service.ts
│   │   ├── pedidos.service.ts
│   │   ├── vendas.service.ts
│   │   ├── atas.service.ts
│   │   └── ai.service.ts
│   ├── types/                  # Tipos TypeScript
│   │   ├── supabase.ts         # Tipos gerados pelo Supabase
│   │   ├── global.ts
│   │   └── dtos.ts
│   ├── providers/              # Providers React
│   │   ├── theme.provider.tsx
│   │   ├── supabase.provider.tsx
│   │   └── auth.provider.tsx
│   └── middleware.ts
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── 001_create_empresas_table.sql
│   │   ├── 002_create_usuarios_table.sql
│   │   ├── 003_create_processos_table.sql
│   │   ├── 004_create_pedidos_table.sql
│   │   ├── 005_create_vendas_table.sql
│   │   ├── 006_create_atas_table.sql
│   │   └── ...
│   └── seed.sql
├── styles/
│   └── globals.css
├── docs/
│   ├── api.md
│   ├── migration-guide.md
│   └── supabase-setup.md
├── tests/
│   ├── integration/
│   ├── unit/
│   └── e2e/
├── .env.local              # Variáveis locais
├── .env.production         # Variáveis de produção
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
├── postcss.config.js
├── README.md
└── Dockerfile
```

## Etapas da Migração

### Fase 1: Configuração Inicial

1. **Configuração do Projeto Next.js**
   - Criar novo projeto Next.js com App Router
   - Configurar TypeScript, Tailwind CSS
   - Configurar ESLint e Prettier
   - Configurar Docker (opcional)

2. **Configuração do Supabase**
   - Criar projeto no Supabase
   - Configurar autenticação (email/password, OAuth)
   - Configurar armazenamento de arquivos
   - Configurar RLS (Row Level Security)
   - Definir esquema de banco de dados

3. **Estruturação da Aplicação**
   - Criar estrutura de pastas conforme definido acima
   - Configurar provedores (tema, autenticação, Supabase)
   - Configurar rotas básicas

### Fase 2: Migração do Backend

1. **Migração de Modelos e Esquemas**
   - Converter modelos Prisma para esquema Supabase
   - Manter relacionamentos e integridades
   - Gerar tipos TypeScript a partir do esquema Supabase

2. **Migração de Serviços**
   - Converter serviços NestJS para funções Next.js
   - Substituir Prisma por cliente Supabase
   - Implementar lógica de negócios em funções API

3. **Migração de Autenticação**
   - Substituir JWT por autenticação Supabase
   - Implementar NextAuth.js ou hooks personalizados
   - Manter permissões e papéis de usuário

### Fase 3: Migração do Frontend

1. **Migração de Componentes**
   - Converter componentes Angular/React existentes
   - Adaptar para o design system do Next.js
   - Implementar componentes reutilizáveis

2. **Migração de Funcionalidades**
   - Mapear todas as telas existentes
   - Adaptar chamadas de API para endpoints Next.js
   - Implementar validações e feedback de usuário

### Fase 4: Integrações Específicas

1. **Integração com IA**
   - Migrar serviços de IA para Next.js
   - Manter funcionalidades de contexto empresarial
   - Integrar com provedores de IA (OpenAI, Anthropic, etc.)

2. **Integração com Relatórios**
   - Implementar geração de relatórios no Next.js
   - Manter funcionalidades existentes
   - Adaptar para novos endpoints

3. **Integração com Atas**
   - Manter funcionalidades de atas e reuniões
   - Adaptar para o novo esquema de dados
   - Implementar recursos de notificação

### Fase 5: Testes e Validação

1. **Testes de Integração**
   - Validar todas as funcionalidades críticas
   - Testar fluxos de usuário completos
   - Verificar integridade de dados

2. **Testes de Performance**
   - Avaliar tempo de resposta
   - Verificar uso de recursos
   - Otimizar consultas e renderização

3. **Testes de Segurança**
   - Validar RLS do Supabase
   - Verificar autenticação e autorização
   - Testar proteção contra ataques comuns

## Considerações Técnicas

### Banco de Dados

- **Migração**: Converter esquema Prisma para Supabase
- **Tipos**: Gerar automaticamente tipos TypeScript do esquema
- **RLS**: Implementar segurança no nível de linha
- **Triggers**: Utilizar triggers do PostgreSQL quando necessário

### Autenticação e Autorização

- **NextAuth.js**: Integração com provedores OAuth
- **Supabase Auth**: Gerenciamento de sessão
- **Permissões**: Manter sistema de permissões por empresa/cliente
- **Segurança**: Implementar proteção contra CSRF, XSS

### Armazenamento

- **Supabase Storage**: Armazenar arquivos e uploads
- **CDN**: Configurar cache e entrega de conteúdo
- **Segurança**: Controlar acesso a arquivos

### Realtime

- **Supabase Realtime**: Implementar atualizações em tempo real
- **WebSockets**: Alternativa quando necessário
- **Notificações**: Sistema de notificações em tempo real

### Deploy

- **Vercel**: Deploy otimizado para Next.js
- **Supabase**: Banco de dados e serviços
- **CI/CD**: Pipelines automatizados
- **Monitoramento**: Logs e métricas

## Benefícios Esperados

1. **Desenvolvimento**
   - Código mais coeso e organizado
   - Menor latência entre frontend e backend
   - Melhor experiência de desenvolvimento

2. **Performance**
   - Redução de chamadas HTTP entre serviços
   - Melhor otimização de recursos
   - Carregamento mais rápido das páginas

3. **Manutenção**
   - Menor complexidade de deploy
   - Menos infraestrutura para gerenciar
   - Mais fácil de escalar

4. **Custos**
   - Redução de custos com hospedagem
   - Menor necessidade de servidores dedicados
   - Maior eficiência de recursos

## Riscos e Mitigantes

1. **Tempo de Desenvolvimento**
   - Risco: Prazo maior que o esperado
   - Mitigante: Implementação em fases, com validação contínua

2. **Perda de Dados**
   - Risco: Problemas durante a migração de dados
   - Mitigante: Cópias de segurança e testes em ambiente de staging

3. **Compatibilidade**
   - Risco: Funcionalidades que não funcionam como esperado
   - Mitigante: Testes abrangentes e validação com usuários

4. **Curva de Aprendizado**
   - Risco: Equipe não familiarizada com novas tecnologias
   - Mitigante: Documentação e treinamento adequados