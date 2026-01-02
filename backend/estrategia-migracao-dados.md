# Estratégia de Migração de Dados para Supabase

## 1. Planejamento da Migração

### 1.1. Avaliação Inicial
- **Backup completo** do banco de dados atual
- **Análise da estrutura** do banco de dados (realizada via schema.prisma)
- **Verificação de integridade** dos dados existentes
- **Identificação de dependências** entre tabelas

### 1.2. Ordem de Migração
A migração deve seguir uma ordem específica para respeitar as dependências entre tabelas:

1. **Tabelas de referência** (sem dependências):
   - marcas
   - grupos
   - subgrupos
   - contas_catalogo

2. **Tabelas principais** (com poucas dependências):
   - empresas
   - usuarios
   - configuracoes_modelo_negocio

3. **Tabelas intermediárias** (com dependências moderadas):
   - templates_importacao
   - configuracoes_email
   - bravo_sync_configs
   - produtos

4. **Tabelas de conteúdo** (com dependências complexas):
   - uploads
   - linhas_upload
   - alertas
   - resumos_economicos

5. **Tabelas de processos e atas**:
   - processos
   - processos_itens
   - processos_anexos
   - processos_historico
   - atas_reuniao
   - atas_participantes
   - atas_anexos
   - atas_comentarios
   - historico_andamento
   - prazos_acoes
   - lembretes_prazos
   - logs_alteracoes_atas

6. **Tabelas de vendas e pedidos**:
   - vendas
   - vendas_analytics
   - vendas_importacao_logs
   - vendas_column_mappings
   - vendas_analytics_filters
   - pedidos
   - pedidos_analytics
   - pedidos_importacao_logs
   - pedidos_column_mappings
   - pedidos_analytics_filters

7. **Tabelas de configuração e logs**:
   - logs_auditoria
   - logs_envio_email
   - preferencias_notificacao
   - push_subscriptions
   - usuarios_clientes
   - bravo_sync_logs
   - bravo_sync_progress

## 2. Preparação para a Migração

### 2.1. Configuração do Ambiente
- Criar projeto no Supabase
- Configurar as variáveis de ambiente no `.env` para apontar para o Supabase
- Executar o script `migrate-to-supabase.sql` para criar o schema no Supabase

### 2.2. Scripts de Migração
- Criar scripts específicos para cada tabela ou grupo de tabelas
- Implementar validações de integridade após cada etapa
- Preparar scripts de rollback para cada etapa (em caso de falha)

## 3. Execução da Migração

### 3.1. Fase 1: Estrutura e Dados Básicos
```bash
# Passos:
1. Executar script de criação de schema no Supabase
2. Migrar tabelas de referência
3. Migrar tabelas de empresas e usuários
4. Validar integridade dos dados migrados
```

### 3.2. Fase 2: Dados de Configuração
```bash
# Passos:
1. Migrar configurações de modelo de negócio
2. Migrar templates de importação
3. Migrar configurações de email
4. Migrar dados do sistema Bravo
5. Validar integridade dos dados migrados
```

### 3.3. Fase 3: Dados de Negócio
```bash
# Passos:
1. Migrar dados de uploads e linhas de upload
2. Migrar dados de resumos econômicos
3. Migrar dados de processos e atas
4. Validar integridade dos dados migrados
```

### 3.4. Fase 4: Dados de Vendas e Pedidos
```bash
# Passos:
1. Migrar dados de produtos
2. Migrar dados de vendas e pedidos
3. Migrar analytics de vendas e pedidos
4. Validar integridade dos dados migrados
```

### 3.5. Fase 5: Configurações e Logs
```bash
# Passos:
1. Migrar logs e configurações de notificação
2. Migrar logs de sincronização
3. Validar integridade dos dados migrados
```

## 4. Considerações Técnicas

### 4.1. Conversão de Tipos de Dados
- Converter `Decimal` para `NUMERIC` no PostgreSQL do Supabase
- Converter `Json` para `JSONB` para melhor performance
- Garantir compatibilidade dos UUIDs
- Converter `DateTime` para `TIMESTAMP WITH TIME ZONE`

### 4.2. Constraints e Relacionamentos
- Verificar e recriar todas as constraints de chave estrangeira
- Validar integridade referencial antes da migração
- Recriar índices após a migração para melhor performance

### 4.3. Performance
- Utilizar `COPY` para migração de grandes volumes de dados
- Desativar temporariamente triggers durante a migração
- Recriar índices após a conclusão da migração
- Considerar a migração em batches para tabelas grandes

## 5. Validação e Testes

### 5.1. Validação de Dados
- Comparar contagens de registros entre origem e destino
- Verificar integridade referencial
- Validar campos obrigatórios e constraints
- Testar consultas críticas do sistema

### 5.2. Testes Funcionais
- Testar autenticação e autorização
- Validar funcionalidades críticas do sistema
- Verificar integração com APIs externas
- Testar processos de negócio principais

## 6. Plano de Rollback

### 6.1. Preparação
- Manter backup do banco de dados original
- Documentar todas as etapas de migração
- Preparar scripts de reversão para cada etapa

### 6.2. Execução
- Em caso de falha crítica, retornar ao banco de dados original
- Restaurar variáveis de ambiente para o banco original
- Comunicar stakeholders sobre o rollback

## 7. Pós-Migração

### 7.1. Otimização
- Recriar índices e estatísticas
- Ajustar configurações de performance do Supabase
- Validar e otimizar consultas mais utilizadas

### 7.2. Monitoramento
- Configurar monitoramento de performance
- Estabelecer métricas de uso e performance
- Preparar alertas para possíveis problemas

## 8. Checklist de Migração

- [ ] Backup completo do banco de dados original
- [ ] Criação do projeto no Supabase
- [ ] Execução do script de schema no Supabase
- [ ] Migração das tabelas de referência
- [ ] Migração das tabelas principais
- [ ] Migração das tabelas de conteúdo
- [ ] Migração das tabelas de processos e atas
- [ ] Migração das tabelas de vendas e pedidos
- [ ] Migração das tabelas de configuração e logs
- [ ] Validação da integridade dos dados
- [ ] Testes funcionais completos
- [ ] Atualização das variáveis de ambiente
- [ ] Configuração de monitoramento
- [ ] Documentação da migração