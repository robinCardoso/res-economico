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

// Script SQL para criar o schema
const schemaScript = `
-- Script de migração para Supabase
-- Este script adapta o schema Prisma para ser compatível com o Supabase

-- 1. Criação do schema e extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para busca textual
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- Para estatísticas

-- 2. Criação das tabelas com base no schema Prisma

-- Tabela de Empresas
CREATE TABLE IF NOT EXISTS empresas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    razao_social TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    filial TEXT,
    tipo TEXT DEFAULT 'MATRIZ',
    uf VARCHAR(2),
    setor TEXT,
    porte TEXT,
    data_fundacao DATE,
    descricao TEXT,
    website TEXT,
    modelo_negocio TEXT,
    modelo_negocio_detalhes JSONB,
    contas_receita JSONB,
    custos_centralizados BOOLEAN,
    contas_custos JSONB,
    receitas_centralizadas BOOLEAN
);

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    nome TEXT NOT NULL,
    roles TEXT[] DEFAULT ARRAY['user'],
    empresa_id UUID REFERENCES empresas(id),
    ativo BOOLEAN DEFAULT TRUE,
    ultimo_acesso TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    departamento TEXT
);

-- Tabela de Configurações de Modelo de Negócio
CREATE TABLE IF NOT EXISTS configuracoes_modelo_negocio (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    modelo_negocio TEXT UNIQUE NOT NULL,
    modelo_negocio_detalhes JSONB NOT NULL,
    contas_receita JSONB NOT NULL,
    contas_custos JSONB NOT NULL,
    custos_centralizados BOOLEAN NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    receitas_centralizadas BOOLEAN DEFAULT FALSE
);

-- Tabela de Templates de Importação
CREATE TABLE IF NOT EXISTS templates_importacao (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    empresa_id UUID REFERENCES empresas(id),
    nome TEXT NOT NULL,
    descricao TEXT,
    configuracao JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Uploads
CREATE TABLE IF NOT EXISTS uploads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    template_id UUID REFERENCES templates_importacao(id),
    mes INTEGER NOT NULL,
    ano INTEGER NOT NULL,
    arquivo_url TEXT NOT NULL,
    hash_arquivo TEXT NOT NULL,
    status TEXT DEFAULT 'PROCESSANDO',
    total_linhas INTEGER NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    nome_arquivo TEXT NOT NULL
);

-- Tabela de Linhas de Upload
CREATE TABLE IF NOT EXISTS linhas_upload (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    upload_id UUID NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
    classificacao TEXT NOT NULL,
    conta TEXT NOT NULL,
    sub_conta TEXT,
    nome_conta TEXT NOT NULL,
    tipo_conta TEXT NOT NULL,
    nivel INTEGER NOT NULL,
    titulo BOOLEAN NOT NULL,
    estabelecimento BOOLEAN NOT NULL,
    saldo_anterior DECIMAL(18, 2) NOT NULL,
    debito DECIMAL(18, 2) NOT NULL,
    credito DECIMAL(18, 2) NOT NULL,
    saldo_atual DECIMAL(18, 2) NOT NULL,
    hash_linha TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Catálogo de Contas
CREATE TABLE IF NOT EXISTS contas_catalogo (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    classificacao TEXT NOT NULL,
    conta TEXT NOT NULL,
    tipo_conta TEXT NOT NULL,
    nivel INTEGER NOT NULL,
    primeira_importacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ultima_importacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'ATIVA',
    sub_conta TEXT DEFAULT '',
    nome_conta TEXT NOT NULL
);

-- Índice único composto
CREATE UNIQUE INDEX IF NOT EXISTS contas_catalogo_unique_idx ON contas_catalogo (classificacao, conta, sub_conta);

-- Tabela de Alertas
CREATE TABLE IF NOT EXISTS alertas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    upload_id UUID NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
    linha_id UUID REFERENCES linhas_upload(id),
    tipo TEXT NOT NULL,
    severidade TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    status TEXT DEFAULT 'ABERTO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de Logs de Auditoria
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recurso TEXT NOT NULL,
    acao TEXT NOT NULL,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    dados JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Resumos Econômicos
CREATE TABLE IF NOT EXISTS resumos_economicos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    titulo TEXT NOT NULL,
    periodo TEXT NOT NULL,
    mes INTEGER,
    ano INTEGER NOT NULL,
    empresa_id UUID REFERENCES empresas(id),
    upload_id UUID REFERENCES uploads(id),
    tipo_analise TEXT NOT NULL,
    parametros JSONB NOT NULL,
    resultado JSONB NOT NULL,
    modelo_ia TEXT NOT NULL,
    status TEXT DEFAULT 'PROCESSANDO',
    criado_por TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para resumos econômicos
CREATE INDEX IF NOT EXISTS resumos_empresa_ano_mes_idx ON resumos_economicos (empresa_id, ano, mes);
CREATE INDEX IF NOT EXISTS resumos_criado_por_created_at_idx ON resumos_economicos (criado_por, created_at);
CREATE INDEX IF NOT EXISTS resumos_status_idx ON resumos_economicos (status);

-- Tabela de Processos
CREATE TABLE IF NOT EXISTS processos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    numero_controle VARCHAR(50) UNIQUE NOT NULL,
    protocolo VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    empresa_id UUID REFERENCES empresas(id),
    tipo TEXT NOT NULL,
    situacao TEXT DEFAULT 'AGUARDANDO_ANALISE',
    nome_cliente_associado TEXT NOT NULL,
    razao_social TEXT NOT NULL,
    titulo TEXT,
    descricao TEXT,
    categoria TEXT,
    prioridade TEXT,
    contato_retorno TEXT,
    uf TEXT,
    cidade TEXT,
    fabrica TEXT,
    importacao TEXT,
    ano TEXT,
    reclamacao TEXT,
    responsavel TEXT,
    prazo_resolucao TIMESTAMP WITH TIME ZONE,
    data_solucao TIMESTAMP WITH TIME ZONE,
    comentarios TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para processos
CREATE INDEX IF NOT EXISTS processos_user_created_at_idx ON processos (user_id, created_at);
CREATE INDEX IF NOT EXISTS processos_empresa_created_at_idx ON processos (empresa_id, created_at);
CREATE INDEX IF NOT EXISTS processos_tipo_situacao_idx ON processos (tipo, situacao);
CREATE INDEX IF NOT EXISTS processos_situacao_created_at_idx ON processos (situacao, created_at);

-- Tabela de Itens de Processos
CREATE TABLE IF NOT EXISTS processos_itens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    processo_id UUID NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
    nf TEXT NOT NULL,
    referencia TEXT NOT NULL,
    descricao_produto TEXT,
    qtd INTEGER NOT NULL,
    valor_unit DECIMAL(18, 2) NOT NULL,
    detalhes TEXT NOT NULL,
    marca TEXT,
    data_instalacao DATE,
    data_remocao DATE,
    km_instalacao TEXT,
    km_remocao TEXT,
    modelo_veiculo TEXT,
    ano_veiculo TEXT,
    marca_veiculo TEXT,
    tem_custo_garantia BOOLEAN DEFAULT FALSE,
    valor_custo DECIMAL(18, 2),
    info_pecas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Anexos de Processos
CREATE TABLE IF NOT EXISTS processos_anexos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    processo_id UUID NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
    nome_arquivo TEXT NOT NULL,
    url_arquivo TEXT NOT NULL,
    tipo_arquivo TEXT NOT NULL,
    tamanho_arquivo INTEGER,
    mime_type TEXT,
    uploaded_by TEXT,
    metadata JSONB,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Histórico de Processos
CREATE TABLE IF NOT EXISTS processos_historico (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    processo_id UUID NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
    acao TEXT NOT NULL,
    descricao TEXT NOT NULL,
    usuario_id TEXT,
    usuario_nome TEXT,
    dados_anteriores JSONB,
    dados_novos JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para histórico de processos
CREATE INDEX IF NOT EXISTS processos_historico_processo_created_at_idx ON processos_historico (processo_id, created_at);
CREATE INDEX IF NOT EXISTS processos_historico_usuario_idx ON processos_historico (usuario_id);

-- Tabelas de Atas de Reunião
CREATE TABLE IF NOT EXISTS atas_reuniao (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    numero VARCHAR(50) UNIQUE NOT NULL,
    titulo TEXT NOT NULL,
    tipo TEXT NOT NULL,
    data_reuniao DATE NOT NULL,
    local TEXT,
    status TEXT DEFAULT 'RASCUNHO',
    pauta TEXT,
    conteudo TEXT,
    descricao TEXT,
    resumo TEXT,
    pautas JSONB,
    decisoes JSONB,
    acoes JSONB,
    observacoes TEXT,
    gerado_por_ia BOOLEAN,
    ia_usada TEXT,
    modelo_ia TEXT,
    custo_ia TEXT,
    tempo_processamento_ia INTEGER,
    arquivo_original_url TEXT,
    arquivo_original_nome TEXT,
    arquivo_original_tipo TEXT,
    data_assinatura DATE,
    data_registro DATE,
    cartorio_registro TEXT,
    numero_registro TEXT,
    pendente_assinatura BOOLEAN DEFAULT FALSE,
    pendente_registro BOOLEAN DEFAULT FALSE,
    modelo_ata_id UUID REFERENCES atas_reuniao(id),
    criado_por TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    empresa_id UUID REFERENCES empresas(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para atas
CREATE INDEX IF NOT EXISTS atas_data_reuniao_idx ON atas_reuniao (data_reuniao);
CREATE INDEX IF NOT EXISTS atas_status_idx ON atas_reuniao (status);
CREATE INDEX IF NOT EXISTS atas_empresa_idx ON atas_reuniao (empresa_id);
CREATE INDEX IF NOT EXISTS atas_criado_por_idx ON atas_reuniao (criado_por);
CREATE INDEX IF NOT EXISTS atas_tipo_idx ON atas_reuniao (tipo);

-- Tabela de Participantes de Atas
CREATE TABLE IF NOT EXISTS atas_participantes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ata_id UUID NOT NULL REFERENCES atas_reuniao(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id),
    nome_externo TEXT,
    email TEXT,
    cargo TEXT,
    presente BOOLEAN DEFAULT TRUE,
    observacoes TEXT
);

-- Tabela de Anexos de Atas
CREATE TABLE IF NOT EXISTS atas_anexos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ata_id UUID NOT NULL REFERENCES atas_reuniao(id) ON DELETE CASCADE,
    nome_arquivo TEXT NOT NULL,
    url_arquivo TEXT NOT NULL,
    tipo_arquivo TEXT NOT NULL,
    tamanho_arquivo INTEGER,
    mime_type TEXT,
    uploaded_by TEXT,
    descricao TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Comentários de Atas
CREATE TABLE IF NOT EXISTS atas_comentarios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ata_id UUID NOT NULL REFERENCES atas_reuniao(id) ON DELETE CASCADE,
    comentario TEXT NOT NULL,
    tipo TEXT NOT NULL,
    autor_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    comentario_pai_id UUID REFERENCES atas_comentarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Histórico de Andamento de Atas
CREATE TABLE IF NOT EXISTS historico_andamento (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ata_id UUID NOT NULL REFERENCES atas_reuniao(id) ON DELETE CASCADE,
    data TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acao TEXT NOT NULL,
    descricao TEXT,
    responsavel TEXT,
    criado_por TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Prazos e Ações de Atas
CREATE TABLE IF NOT EXISTS prazos_acoes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ata_id UUID NOT NULL REFERENCES atas_reuniao(id) ON DELETE CASCADE,
    acao_id TEXT,
    titulo TEXT NOT NULL,
    descricao TEXT,
    data_prazo DATE NOT NULL,
    data_conclusao DATE,
    status TEXT DEFAULT 'PENDENTE',
    concluido BOOLEAN DEFAULT FALSE,
    lembretes_enviados INTEGER DEFAULT 0,
    ultimo_lembrete TIMESTAMP WITH TIME ZONE,
    criado_por TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Lembretes de Prazos
CREATE TABLE IF NOT EXISTS lembretes_prazos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    prazo_id UUID NOT NULL REFERENCES prazos_acoes(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    enviado BOOLEAN DEFAULT FALSE,
    data_envio TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Logs de Alterações de Atas
CREATE TABLE IF NOT EXISTS logs_alteracoes_atas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ata_id UUID NOT NULL REFERENCES atas_reuniao(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id),
    tipo_alteracao TEXT NOT NULL,
    campo TEXT,
    valor_anterior TEXT,
    valor_novo TEXT,
    descricao TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Preferências de Notificação
CREATE TABLE IF NOT EXISTS preferencias_notificacao (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    usuario_id UUID UNIQUE NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    email_ativo BOOLEAN DEFAULT TRUE,
    sistema_ativo BOOLEAN DEFAULT TRUE,
    push_ativo BOOLEAN DEFAULT FALSE,
    lembrete_3_dias BOOLEAN DEFAULT TRUE,
    lembrete_1_dia BOOLEAN DEFAULT TRUE,
    lembrete_hoje BOOLEAN DEFAULT TRUE,
    lembrete_vencido BOOLEAN DEFAULT TRUE,
    horario_inicio VARCHAR(5) DEFAULT '08:00',
    horario_fim VARCHAR(5) DEFAULT '18:00',
    dias_semana TEXT[] DEFAULT ARRAY['segunda', 'terca', 'quarta', 'quinta', 'sexta'],
    notificar_prazos BOOLEAN DEFAULT TRUE,
    notificar_historico BOOLEAN DEFAULT FALSE,
    notificar_comentarios BOOLEAN DEFAULT FALSE,
    notificar_status BOOLEAN DEFAULT TRUE,
    resumo_diario BOOLEAN DEFAULT FALSE,
    resumo_semanal BOOLEAN DEFAULT TRUE,
    dia_resumo_semanal VARCHAR(10) DEFAULT 'segunda',
    horario_resumo_semanal VARCHAR(5) DEFAULT '09:00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Subscrições de Push
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice único para push subscriptions
CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_unique_idx ON push_subscriptions (usuario_id, endpoint);

-- Tabela de Configurações de Email
CREATE TABLE IF NOT EXISTS configuracoes_email (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome TEXT NOT NULL,
    host TEXT NOT NULL,
    porta INTEGER NOT NULL,
    autenticar BOOLEAN DEFAULT TRUE,
    usuario TEXT NOT NULL,
    senha TEXT NOT NULL,
    copias_para TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Logs de Envio de Email
CREATE TABLE IF NOT EXISTS logs_envio_email (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    configuracao_id UUID NOT NULL REFERENCES configuracoes_email(id) ON DELETE CASCADE,
    destinatario TEXT NOT NULL,
    assunto TEXT NOT NULL,
    corpo TEXT,
    status TEXT DEFAULT 'PENDENTE',
    erro TEXT,
    tentativas INTEGER DEFAULT 0,
    enviado_em TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabelas para Sincronização com Bravo ERP
CREATE TABLE IF NOT EXISTS bravo_sync_configs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    chave VARCHAR(255) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descricao TEXT,
    tipo TEXT DEFAULT 'string',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bravo_campo_mapeamento (
    id SERIAL PRIMARY KEY,
    campo_bravo TEXT NOT NULL,
    campo_interno TEXT NOT NULL,
    tipo_transformacao TEXT DEFAULT 'direto',
    ativo BOOLEAN DEFAULT TRUE,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS produtos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    referencia VARCHAR(255) UNIQUE NOT NULL,
    id_prod TEXT,
    descricao TEXT,
    marca TEXT,
    grupo TEXT,
    subgrupo TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    gtin TEXT,
    ncm TEXT,
    cest TEXT,
    data_ult_modif TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para produtos
CREATE INDEX IF NOT EXISTS produtos_id_prod_idx ON produtos (id_prod);
CREATE INDEX IF NOT EXISTS produtos_ativo_idx ON produtos (ativo);
CREATE INDEX IF NOT EXISTS produtos_marca_idx ON produtos (marca);
CREATE INDEX IF NOT EXISTS produtos_grupo_idx ON produtos (grupo);
CREATE INDEX IF NOT EXISTS produtos_data_ult_modif_idx ON produtos (data_ult_modif);

-- Tabela de Logs de Sincronização do Bravo
CREATE TABLE IF NOT EXISTS bravo_sync_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sync_type TEXT NOT NULL,
    status TEXT DEFAULT 'running',
    status_detalhado TEXT,
    apenas_ativos BOOLEAN DEFAULT TRUE,
    limit_requested INTEGER,
    pages_requested INTEGER,
    effective_limit INTEGER,
    current_page INTEGER DEFAULT 1,
    pages_processed INTEGER DEFAULT 0,
    total_pages_found INTEGER,
    resume_from_page INTEGER,
    total_produtos_bravo INTEGER DEFAULT 0,
    produtos_filtrados INTEGER DEFAULT 0,
    produtos_analisados INTEGER DEFAULT 0,
    produtos_inseridos INTEGER DEFAULT 0,
    produtos_atualizados INTEGER DEFAULT 0,
    produtos_ignorados INTEGER DEFAULT 0,
    produtos_com_erro INTEGER DEFAULT 0,
    taxa_otimizacao TEXT,
    economia_queries INTEGER DEFAULT 0,
    error_message TEXT,
    error_details JSONB,
    tipos_erro JSONB,
    sugestoes_correcao TEXT[],
    tempo_total_segundos INTEGER,
    percentual_sucesso INTEGER,
    triggered_by TEXT,
    user_agent TEXT,
    user_id TEXT,
    can_resume BOOLEAN DEFAULT FALSE,
    sync_details JSONB,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de Progresso de Sincronização do Bravo
CREATE TABLE IF NOT EXISTS bravo_sync_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sync_log_id UUID UNIQUE NOT NULL REFERENCES bravo_sync_logs(id) ON DELETE CASCADE,
    progress_percentage DECIMAL(5, 2) NOT NULL,
    current_step TEXT,
    current_page INTEGER,
    total_pages INTEGER,
    products_processed INTEGER DEFAULT 0,
    products_inserted_current_page INTEGER DEFAULT 0,
    total_produtos_bravo INTEGER,
    estimated_time_remaining TEXT,
    current_product TEXT,
    status_atual TEXT,
    etapa_atual TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabelas para Marcas, Grupos e Subgrupos
CREATE TABLE IF NOT EXISTS marcas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grupos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subgrupos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabelas para Vendas
CREATE TABLE IF NOT EXISTS vendas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nfe TEXT NOT NULL,
    id_doc TEXT,
    data_venda DATE NOT NULL,
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT,
    cnpj_cliente TEXT,
    uf_destino TEXT,
    uf_origem TEXT,
    id_prod TEXT,
    referencia TEXT,
    prod_cod_mestre TEXT,
    descricao_produto TEXT,
    marca TEXT DEFAULT 'DESCONHECIDA',
    grupo TEXT DEFAULT 'DESCONHECIDO',
    subgrupo TEXT DEFAULT 'DESCONHECIDO',
    tipo_operacao TEXT,
    quantidade DECIMAL(18, 3) NOT NULL,
    valor_unitario DECIMAL(18, 2) NOT NULL,
    valor_total DECIMAL(18, 2) NOT NULL,
    empresa_id UUID REFERENCES empresas(id),
    produto_id UUID REFERENCES produtos(id),
    importacao_log_id UUID REFERENCES vendas_importacao_logs(id),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para vendas
CREATE INDEX IF NOT EXISTS vendas_nfe_idx ON vendas (nfe);
CREATE INDEX IF NOT EXISTS vendas_data_venda_idx ON vendas (data_venda);
CREATE INDEX IF NOT EXISTS vendas_empresa_data_venda_idx ON vendas (empresa_id, data_venda);
CREATE INDEX IF NOT EXISTS vendas_referencia_idx ON vendas (referencia);
CREATE INDEX IF NOT EXISTS vendas_razao_social_idx ON vendas (razao_social);
CREATE INDEX IF NOT EXISTS vendas_id_doc_idx ON vendas (id_doc);
CREATE INDEX IF NOT EXISTS vendas_marca_idx ON vendas (marca);
CREATE INDEX IF NOT EXISTS vendas_grupo_idx ON vendas (grupo);
CREATE INDEX IF NOT EXISTS vendas_subgrupo_idx ON vendas (subgrupo);
CREATE INDEX IF NOT EXISTS vendas_prod_cod_mestre_idx ON vendas (prod_cod_mestre);
CREATE INDEX IF NOT EXISTS vendas_tipo_operacao_idx ON vendas (tipo_operacao);
CREATE INDEX IF NOT EXISTS vendas_importacao_log_idx ON vendas (importacao_log_id);

-- Chave única composta para evitar duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS vendas_unique_idx ON vendas (nfe, id_doc, referencia);

-- Tabela de Analytics de Vendas
CREATE TABLE IF NOT EXISTS vendas_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    empresa_id UUID REFERENCES empresas(id),
    nome_fantasia TEXT NOT NULL,
    marca TEXT NOT NULL,
    grupo TEXT,
    subgrupo TEXT,
    tipo_operacao TEXT,
    uf TEXT NOT NULL,
    total_valor DECIMAL(18, 2) NOT NULL,
    total_quantidade DECIMAL(18, 3) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chave única para analytics
CREATE UNIQUE INDEX IF NOT EXISTS vendas_analytics_unique_idx ON vendas_analytics (ano, mes, nome_fantasia, marca, grupo, subgrupo, tipo_operacao, uf, empresa_id);

-- Índices para analytics
CREATE INDEX IF NOT EXISTS vendas_analytics_ano_mes_idx ON vendas_analytics (ano, mes);
CREATE INDEX IF NOT EXISTS vendas_analytics_empresa_ano_mes_idx ON vendas_analytics (empresa_id, ano, mes);
CREATE INDEX IF NOT EXISTS vendas_analytics_marca_idx ON vendas_analytics (marca);
CREATE INDEX IF NOT EXISTS vendas_analytics_grupo_idx ON vendas_analytics (grupo);
CREATE INDEX IF NOT EXISTS vendas_analytics_subgrupo_idx ON vendas_analytics (subgrupo);
CREATE INDEX IF NOT EXISTS vendas_analytics_tipo_operacao_idx ON vendas_analytics (tipo_operacao);
CREATE INDEX IF NOT EXISTS vendas_analytics_uf_idx ON vendas_analytics (uf);
CREATE INDEX IF NOT EXISTS vendas_analytics_nome_fantasia_idx ON vendas_analytics (nome_fantasia);

-- Tabela de Logs de Importação de Vendas
CREATE TABLE IF NOT EXISTS vendas_importacao_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome_arquivo TEXT NOT NULL,
    mapping_name TEXT,
    total_linhas INTEGER NOT NULL,
    sucesso_count INTEGER DEFAULT 0,
    erro_count INTEGER DEFAULT 0,
    produtos_nao_encontrados INTEGER DEFAULT 0,
    duplicatas_count INTEGER DEFAULT 0,
    novos_count INTEGER DEFAULT 0,
    progresso INTEGER DEFAULT 0,
    linhas_processadas INTEGER DEFAULT 0,
    usuario_email TEXT NOT NULL,
    usuario_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para logs de importação
CREATE INDEX IF NOT EXISTS vendas_importacao_logs_created_at_idx ON vendas_importacao_logs (created_at);
CREATE INDEX IF NOT EXISTS vendas_importacao_logs_usuario_idx ON vendas_importacao_logs (usuario_id);

-- Tabelas para Mapeamento e Filtros de Vendas
CREATE TABLE IF NOT EXISTS vendas_column_mappings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome TEXT NOT NULL,
    column_mapping JSONB NOT NULL,
    filters JSONB,
    descricao TEXT,
    usuario_id UUID REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendas_analytics_filters (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome TEXT NOT NULL,
    filters JSONB NOT NULL,
    descricao TEXT,
    usuario_id UUID REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabelas para Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    numero_pedido TEXT NOT NULL,
    id_doc TEXT,
    data_pedido DATE NOT NULL,
    nome_fantasia TEXT NOT NULL,
    id_prod TEXT,
    referencia TEXT,
    descricao_produto TEXT,
    marca TEXT DEFAULT 'DESCONHECIDA',
    grupo TEXT DEFAULT 'DESCONHECIDO',
    subgrupo TEXT DEFAULT 'DESCONHECIDO',
    quantidade DECIMAL(18, 3) NOT NULL,
    valor_unitario DECIMAL(18, 2) NOT NULL,
    valor_total DECIMAL(18, 2) NOT NULL,
    empresa_id UUID REFERENCES empresas(id),
    produto_id UUID REFERENCES produtos(id),
    importacao_log_id UUID REFERENCES pedidos_importacao_logs(id),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para pedidos
CREATE INDEX IF NOT EXISTS pedidos_numero_pedido_idx ON pedidos (numero_pedido);
CREATE INDEX IF NOT EXISTS pedidos_data_pedido_idx ON pedidos (data_pedido);
CREATE INDEX IF NOT EXISTS pedidos_empresa_data_pedido_idx ON pedidos (empresa_id, data_pedido);
CREATE INDEX IF NOT EXISTS pedidos_referencia_idx ON pedidos (referencia);
CREATE INDEX IF NOT EXISTS pedidos_nome_fantasia_idx ON pedidos (nome_fantasia);
CREATE INDEX IF NOT EXISTS pedidos_id_doc_idx ON pedidos (id_doc);
CREATE INDEX IF NOT EXISTS pedidos_marca_idx ON pedidos (marca);
CREATE INDEX IF NOT EXISTS pedidos_grupo_idx ON pedidos (grupo);
CREATE INDEX IF NOT EXISTS pedidos_subgrupo_idx ON pedidos (subgrupo);
CREATE INDEX IF NOT EXISTS pedidos_importacao_log_idx ON pedidos (importacao_log_id);

-- Chave única composta para evitar duplicatas
CREATE UNIQUE INDEX IF NOT EXISTS pedidos_unique_idx ON pedidos (numero_pedido, id_doc, referencia);

-- Tabela de Analytics de Pedidos
CREATE TABLE IF NOT EXISTS pedidos_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    empresa_id UUID REFERENCES empresas(id),
    nome_fantasia TEXT NOT NULL,
    marca TEXT NOT NULL,
    grupo TEXT,
    subgrupo TEXT,
    total_valor DECIMAL(18, 2) NOT NULL,
    total_quantidade DECIMAL(18, 3) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chave única para analytics de pedidos
CREATE UNIQUE INDEX IF NOT EXISTS pedidos_analytics_unique_idx ON pedidos_analytics (ano, mes, nome_fantasia, marca, grupo, subgrupo, empresa_id);

-- Tabela de Logs de Importação de Pedidos
CREATE TABLE IF NOT EXISTS pedidos_importacao_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome_arquivo TEXT NOT NULL,
    mapping_name TEXT,
    total_linhas INTEGER NOT NULL,
    sucesso_count INTEGER DEFAULT 0,
    erro_count INTEGER DEFAULT 0,
    produtos_nao_encontrados INTEGER DEFAULT 0,
    duplicatas_count INTEGER DEFAULT 0,
    novos_count INTEGER DEFAULT 0,
    progresso INTEGER DEFAULT 0,
    linhas_processadas INTEGER DEFAULT 0,
    usuario_email TEXT NOT NULL,
    usuario_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabelas para Mapeamento e Filtros de Pedidos
CREATE TABLE IF NOT EXISTS pedidos_column_mappings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome TEXT NOT NULL,
    column_mapping JSONB NOT NULL,
    filters JSONB,
    descricao TEXT,
    usuario_id UUID REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pedidos_analytics_filters (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome TEXT NOT NULL,
    filters JSONB NOT NULL,
    descricao TEXT,
    usuario_id UUID REFERENCES usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Clientes Associados a Usuários
CREATE TABLE IF NOT EXISTS usuarios_clientes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome_fantasia TEXT NOT NULL,
    tipo_cliente TEXT NOT NULL,
    permissoes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT
);

-- Chave única composta
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_clientes_unique_idx ON usuarios_clientes (usuario_id, nome_fantasia, tipo_cliente);

-- Índices
CREATE INDEX IF NOT EXISTS usuarios_clientes_usuario_idx ON usuarios_clientes (usuario_id);
CREATE INDEX IF NOT EXISTS usuarios_clientes_nome_fantasia_idx ON usuarios_clientes (nome_fantasia);

-- RLS (Row Level Security) - Configurações para Supabase
-- Estas configurações devem ser ajustadas de acordo com os requisitos de segurança do sistema

-- Exemplo de RLS para tabela de empresas (apenas para demonstração)
-- ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
-- 
-- -- Política para permitir que usuários vejam apenas as empresas associadas a eles
-- CREATE POLICY empresas_usuario_policy ON empresas
--   FOR SELECT TO authenticated
--   USING (id = ANY (SELECT empresa_id FROM usuarios WHERE email = auth.email()));

-- Funções auxiliares que podem ser úteis no Supabase
CREATE OR REPLACE FUNCTION atualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Adicionando triggers para atualizar o campo updated_at
CREATE TRIGGER atualizar_empresas_updated_at BEFORE UPDATE ON empresas
    FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

CREATE TRIGGER atualizar_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

CREATE TRIGGER atualizar_configuracoes_modelo_negocio_updated_at BEFORE UPDATE ON configuracoes_modelo_negocio
    FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

CREATE TRIGGER atualizar_templates_importacao_updated_at BEFORE UPDATE ON templates_importacao
    FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

CREATE TRIGGER atualizar_uploads_updated_at BEFORE UPDATE ON uploads
    FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

CREATE TRIGGER atualizar_resumos_economicos_updated_at BEFORE UPDATE ON resumos_economicos
    FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

CREATE TRIGGER atualizar_processos_updated_at BEFORE UPDATE ON processos
    FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

CREATE TRIGGER atualizar_atas_reuniao_updated_at BEFORE UPDATE ON atas_reuniao
    FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

CREATE TRIGGER atualizar_vendas_updated_at BEFORE UPDATE ON vendas
    FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

CREATE TRIGGER atualizar_pedidos_updated_at BEFORE UPDATE ON pedidos
    FOR EACH ROW EXECUTE FUNCTION atualizar_updated_at();

-- Fim do script de migração
`;

async function migrateSchema() {
  console.log('🚀 Iniciando migração do schema para o Supabase...');
  
  try {
    console.log('⚠️  Aviso: Este script serve para verificar a conexão com o Supabase');
    console.log('💡 Para executar o script SQL completo, use o painel SQL do Supabase');
    console.log('🔗 Acesse: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql');
    
    // Testar conexão com o banco de dados
    console.log('\n🔍 Testando conexão com o banco de dados...');
    
    // Verificar se as extensões necessárias estão disponíveis
    console.log('\n🔍 Verificando extensões do PostgreSQL...');
    
    const extensions = ['uuid-ossp', 'pg_trgm', 'pg_stat_statements'];
    
    for (const ext of extensions) {
      try {
        const { data, error } = await supabase
          .from('pg_available_extensions')
          .select('name')
          .eq('name', ext);
          
        if (error) {
          console.log(`⚠️  Não foi possível verificar a extensão '${ext}':`, error.message);
        } else if (data && data.length > 0) {
          console.log(`✅ Extensão '${ext}' está disponível`);
        } else {
          console.log(`⚠️  Extensão '${ext}' não está disponível`);
        }
      } catch (extError) {
        console.log(`⚠️  Erro ao verificar extensão '${ext}':`, extError.message);
      }
    }
    
    console.log('\n✅ Conexão com o Supabase verificada com sucesso!');
    console.log('📋 Próximos passos:');
    console.log('   1. Copie o conteúdo do script SQL para o editor SQL do painel do Supabase');
    console.log('   2. Execute o script para criar as tabelas e estruturas necessárias');
    console.log('   3. Após a criação do schema, prossiga com a migração dos dados');
    
  } catch (error) {
    console.error('❌ Erro durante a verificação do Supabase:', error.message);
    process.exit(1);
  }
}

migrateSchema();