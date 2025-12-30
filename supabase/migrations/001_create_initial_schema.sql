-- Enums
CREATE TYPE tipo_empresa AS ENUM ('MATRIZ', 'FILIAL');
CREATE TYPE porte_empresa AS ENUM ('MICRO', 'PEQUENA', 'MEDIA', 'GRANDE');
CREATE TYPE modelo_negocio AS ENUM ('ASSOCIACAO', 'COMERCIO', 'INDUSTRIA', 'SERVICOS', 'AGROPECUARIA', 'OUTRO');
CREATE TYPE resumo_status AS ENUM ('PROCESSANDO', 'CONCLUIDO', 'ERRO', 'CANCELADO');
CREATE TYPE upload_status AS ENUM ('PROCESSANDO', 'CONCLUIDO', 'COM_ALERTAS', 'CANCELADO');
CREATE TYPE alerta_tipo AS ENUM ('SALDO_DIVERGENTE', 'CONTA_NOVA', 'DADO_INCONSISTENTE', 'CABECALHO_ALTERADO', 'CONTINUIDADE_TEMPORAL_DIVERGENTE');
CREATE TYPE alerta_severidade AS ENUM ('BAIXA', 'MEDIA', 'ALTA');
CREATE TYPE alerta_status AS ENUM ('ABERTO', 'EM_ANALISE', 'RESOLVIDO');
CREATE TYPE conta_status AS ENUM ('ATIVA', 'NOVA', 'ARQUIVADA');
CREATE TYPE departamento AS ENUM ('FINANCEIRO', 'COMPRAS', 'GESTOR', 'FATURAMENTO');

-- Processos Enums
CREATE TYPE tipo_processo AS ENUM ('GARANTIA', 'DEVOLUCAO', 'RECLAMACAO');
CREATE TYPE situacao_processo AS ENUM ('AGUARDANDO_ANALISE', 'EM_ANALISE', 'APROVADO', 'REJEITADO', 'EM_PROCESSAMENTO', 'CONCLUIDO', 'CANCELADO');
CREATE TYPE categoria_reclamacao AS ENUM ('ATENDIMENTO', 'PRODUTOS', 'LOGISTICA', 'FINANCEIRO', 'TECNICO', 'COMUNICACAO');
CREATE TYPE prioridade_processo AS ENUM ('BAIXA', 'MEDIA', 'ALTA');
CREATE TYPE tipo_arquivo_processo AS ENUM ('IMAGEM', 'VIDEO', 'DOCUMENTO', 'NOTA_FISCAL', 'PROTOCOLO_FABRICA');

-- Atas Enums
CREATE TYPE tipo_reuniao AS ENUM ('ASSEMBLEIA_GERAL', 'CONSELHO_DIRETOR', 'REUNIAO_ORDINARIA', 'REUNIAO_EXTRAORDINARIA', 'COMISSAO', 'OUTRO');
CREATE TYPE status_ata AS ENUM ('RASCUNHO', 'EM_PROCESSO', 'FINALIZADA', 'PUBLICADA', 'ARQUIVADA');
CREATE TYPE tipo_arquivo_ata AS ENUM ('DOCUMENTO', 'IMAGEM', 'PDF', 'PLANILHA', 'OUTRO');
CREATE TYPE tipo_comentario AS ENUM ('COMENTARIO', 'SUGESTAO', 'APROVACAO', 'REPROVACAO');
CREATE TYPE status_prazo AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'VENCIDO', 'CANCELADO');
CREATE TYPE tipo_lembrete AS ENUM ('EMAIL', 'NOTIFICACAO_SISTEMA', 'AMBOS');
CREATE TYPE tipo_alteracao_ata AS ENUM (
    'CRIACAO', 'EDICAO', 'EXCLUSAO', 'MUDANCA_STATUS', 'ADICAO_HISTORICO', 'EDICAO_HISTORICO', 'EXCLUSAO_HISTORICO',
    'ADICAO_PRAZO', 'EDICAO_PRAZO', 'EXCLUSAO_PRAZO', 'CONCLUSAO_PRAZO', 'ADICAO_COMENTARIO', 'EDICAO_COMENTARIO',
    'EXCLUSAO_COMENTARIO', 'UPLOAD_ARQUIVO', 'DOWNLOAD_ARQUIVO'
);

-- Email Enums
CREATE TYPE status_envio_email AS ENUM ('PENDENTE', 'ENVIADO', 'FALHA', 'CANCELADO');

-- Clientes Associados Enums
CREATE TYPE tipo_cliente_associacao AS ENUM ('VENDA', 'PEDIDO', 'AMBOS');

-- Tabelas

-- Empresa
CREATE TABLE empresas (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    cnpj TEXT UNIQUE NOT NULL,
    razao_social TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    filial TEXT,
    tipo tipo_empresa DEFAULT 'MATRIZ',
    uf TEXT,
    setor TEXT,
    porte porte_empresa,
    data_fundacao TIMESTAMP WITH TIME ZONE,
    descricao TEXT,
    website TEXT,
    modelo_negocio modelo_negocio,
    modelo_negocio_detalhes JSONB,
    contas_receita JSONB,
    custos_centralizados BOOLEAN,
    contas_custos JSONB,
    receitas_centralizadas BOOLEAN
);

-- Usuario
CREATE TABLE usuarios (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    nome TEXT NOT NULL,
    roles TEXT[] DEFAULT ARRAY['user']::TEXT[],
    empresa_id TEXT,
    ativo BOOLEAN DEFAULT true,
    ultimo_acesso TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    departamento departamento,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL
);

-- ConfiguracaoModeloNegocio
CREATE TABLE configuracoes_modelo_negocio (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    modelo_negocio modelo_negocio UNIQUE NOT NULL,
    modelo_negocio_detalhes JSONB NOT NULL,
    contas_receita JSONB NOT NULL,
    contas_custos JSONB NOT NULL,
    custos_centralizados BOOLEAN DEFAULT false,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    receitas_centralizadas BOOLEAN DEFAULT false
);

-- TemplateImportacao
CREATE TABLE templates_importacao (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id TEXT,
    nome TEXT NOT NULL,
    descricao TEXT,
    configuracao JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

-- Upload
CREATE TABLE uploads (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id TEXT,
    mes INTEGER NOT NULL,
    ano INTEGER NOT NULL,
    arquivo_url TEXT NOT NULL,
    hash_arquivo TEXT NOT NULL,
    status upload_status DEFAULT 'PROCESSANDO',
    total_linhas INTEGER NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    empresa_id TEXT NOT NULL,
    nome_arquivo TEXT NOT NULL,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES templates_importacao(id) ON DELETE SET NULL
);

CREATE INDEX idx_uploads_status_ano ON uploads(status, ano);
CREATE INDEX idx_uploads_ano_mes ON uploads(ano, mes);
CREATE INDEX idx_uploads_empresa_ano_mes ON uploads(empresa_id, ano, mes);
CREATE INDEX idx_uploads_status_empresa_ano ON uploads(status, empresa_id, ano);

-- LinhaUpload
CREATE TABLE linhas_upload (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id TEXT NOT NULL,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (upload_id) REFERENCES uploads(id) ON DELETE CASCADE
);

-- ContaCatalogo
CREATE TABLE contas_catalogo (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    classificacao TEXT NOT NULL,
    conta TEXT NOT NULL,
    tipo_conta TEXT NOT NULL,
    nivel INTEGER NOT NULL,
    primeira_importacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ultima_importacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status conta_status DEFAULT 'ATIVA',
    sub_conta TEXT DEFAULT '',
    nome_conta TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_contas_catalogo_unique ON contas_catalogo(classificacao, conta, sub_conta);

-- Alerta
CREATE TABLE alertas (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id TEXT NOT NULL,
    linha_id TEXT,
    tipo alerta_tipo NOT NULL,
    severidade alerta_severidade NOT NULL,
    mensagem TEXT NOT NULL,
    status alerta_status DEFAULT 'ABERTO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    FOREIGN KEY (upload_id) REFERENCES uploads(id) ON DELETE CASCADE,
    FOREIGN KEY (linha_id) REFERENCES linhas_upload(id) ON DELETE SET NULL
);

-- LogAuditoria
CREATE TABLE logs_auditoria (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    recurso TEXT NOT NULL,
    acao TEXT NOT NULL,
    usuario_id TEXT NOT NULL,
    dados JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ResumoEconomico
CREATE TABLE resumos_economico (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    periodo TEXT NOT NULL,
    mes INTEGER,
    ano INTEGER NOT NULL,
    empresa_id TEXT,
    upload_id TEXT,
    tipo_analise TEXT NOT NULL,
    parametros JSONB NOT NULL,
    resultado JSONB NOT NULL,
    modelo_ia TEXT NOT NULL,
    status resumo_status DEFAULT 'PROCESSANDO',
    criado_por TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL,
    FOREIGN KEY (upload_id) REFERENCES uploads(id) ON DELETE SET NULL
);

CREATE INDEX idx_resumos_empresa_ano_mes ON resumos_economico(empresa_id, ano, mes);
CREATE INDEX idx_resumos_criado_por_created_at ON resumos_economico(criado_por, created_at);
CREATE INDEX idx_resumos_status ON resumos_economico(status);

-- Processos
CREATE TABLE processos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_controle TEXT UNIQUE NOT NULL,
    protocolo TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    empresa_id TEXT,
    tipo tipo_processo NOT NULL,
    situacao situacao_processo DEFAULT 'AGUARDANDO_ANALISE',
    nome_cliente_associado TEXT NOT NULL,
    razao_social TEXT NOT NULL,
    titulo TEXT,
    descricao TEXT,
    categoria categoria_reclamacao,
    prioridade prioridade_processo,
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL
);

CREATE INDEX idx_processos_user_created_at ON processos(user_id, created_at);
CREATE INDEX idx_processos_empresa_created_at ON processos(empresa_id, created_at);
CREATE INDEX idx_processos_tipo_situacao ON processos(tipo, situacao);
CREATE INDEX idx_processos_situacao_created_at ON processos(situacao, created_at);
CREATE INDEX idx_processos_numero_controle ON processos(numero_controle);
CREATE INDEX idx_processos_protocolo ON processos(protocolo);

-- ProcessoItem
CREATE TABLE processos_itens (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    processo_id TEXT NOT NULL,
    nf TEXT NOT NULL,
    referencia TEXT NOT NULL,
    descricao_produto TEXT,
    qtd INTEGER NOT NULL,
    valor_unit DECIMAL(18, 2) NOT NULL,
    detalhes TEXT NOT NULL,
    marca TEXT,
    data_instalacao TIMESTAMP WITH TIME ZONE,
    data_remocao TIMESTAMP WITH TIME ZONE,
    km_instalacao TEXT,
    km_remocao TEXT,
    modelo_veiculo TEXT,
    ano_veiculo TEXT,
    marca_veiculo TEXT,
    tem_custo_garantia BOOLEAN DEFAULT false,
    valor_custo DECIMAL(18, 2),
    info_pecas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (processo_id) REFERENCES processos(id) ON DELETE CASCADE
);

CREATE INDEX idx_processos_itens_processo_id ON processos_itens(processo_id);

-- ProcessoAnexo
CREATE TABLE processos_anexos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    processo_id TEXT NOT NULL,
    nome_arquivo TEXT NOT NULL,
    url_arquivo TEXT NOT NULL,
    tipo_arquivo tipo_arquivo_processo NOT NULL,
    tamanho_arquivo INTEGER,
    mime_type TEXT,
    uploaded_by TEXT,
    metadata JSONB,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (processo_id) REFERENCES processos(id) ON DELETE CASCADE
);

CREATE INDEX idx_processos_anexos_processo_id ON processos_anexos(processo_id);

-- ProcessoHistorico
CREATE TABLE processos_historico (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    processo_id TEXT NOT NULL,
    acao TEXT NOT NULL,
    descricao TEXT NOT NULL,
    usuario_id TEXT,
    usuario_nome TEXT,
    dados_anteriores JSONB,
    dados_novos JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (processo_id) REFERENCES processos(id) ON DELETE CASCADE
);

CREATE INDEX idx_processos_historico_processo_created_at ON processos_historico(processo_id, created_at);
CREATE INDEX idx_processos_historico_usuario_id ON processos_historico(usuario_id);

-- ModeloAta (DEVE VIR ANTES DE atas_reuniao)
CREATE TABLE modelos_ata (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT,
    tipo_reuniao tipo_reuniao NOT NULL,
    estrutura JSONB NOT NULL,
    exemplo JSONB,
    instrucoes TEXT,
    ativo BOOLEAN DEFAULT true,
    criado_por TEXT NOT NULL,
    empresa_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL
);

CREATE INDEX idx_modelos_ata_tipo_reuniao ON modelos_ata(tipo_reuniao);
CREATE INDEX idx_modelos_ata_empresa_id ON modelos_ata(empresa_id);
CREATE INDEX idx_modelos_ata_ativo ON modelos_ata(ativo);

-- Atas
CREATE TABLE atas_reuniao (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    numero TEXT UNIQUE NOT NULL,
    titulo TEXT NOT NULL,
    tipo tipo_reuniao NOT NULL,
    data_reuniao TIMESTAMP WITH TIME ZONE NOT NULL,
    local TEXT,
    status status_ata DEFAULT 'RASCUNHO',
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
    data_assinatura TIMESTAMP WITH TIME ZONE,
    data_registro TIMESTAMP WITH TIME ZONE,
    cartorio_registro TEXT,
    numero_registro TEXT,
    pendente_assinatura BOOLEAN DEFAULT false,
    pendente_registro BOOLEAN DEFAULT false,
    modelo_ata_id TEXT,
    criado_por TEXT NOT NULL,
    empresa_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL,
    FOREIGN KEY (modelo_ata_id) REFERENCES modelos_ata(id) ON DELETE SET NULL
);

CREATE INDEX idx_atas_data_reuniao ON atas_reuniao(data_reuniao);
CREATE INDEX idx_atas_status ON atas_reuniao(status);
CREATE INDEX idx_atas_empresa_id ON atas_reuniao(empresa_id);
CREATE INDEX idx_atas_criado_por ON atas_reuniao(criado_por);
CREATE INDEX idx_atas_tipo ON atas_reuniao(tipo);

-- AtaParticipante
CREATE TABLE atas_participantes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    ata_id TEXT NOT NULL,
    usuario_id TEXT,
    nome_externo TEXT,
    email TEXT,
    cargo TEXT,
    presente BOOLEAN DEFAULT true,
    observacoes TEXT,
    FOREIGN KEY (ata_id) REFERENCES atas_reuniao(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX idx_atas_participantes_ata_id ON atas_participantes(ata_id);
CREATE INDEX idx_atas_participantes_usuario_id ON atas_participantes(usuario_id);

-- AtaAnexo
CREATE TABLE atas_anexos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    ata_id TEXT NOT NULL,
    nome_arquivo TEXT NOT NULL,
    url_arquivo TEXT NOT NULL,
    tipo_arquivo tipo_arquivo_ata NOT NULL,
    tamanho_arquivo INTEGER,
    mime_type TEXT,
    uploaded_by TEXT,
    descricao TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (ata_id) REFERENCES atas_reuniao(id) ON DELETE CASCADE
);

CREATE INDEX idx_atas_anexos_ata_id ON atas_anexos(ata_id);

-- AtaComentario
CREATE TABLE atas_comentarios (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    ata_id TEXT NOT NULL,
    comentario TEXT NOT NULL,
    tipo tipo_comentario NOT NULL,
    autor_id TEXT NOT NULL,
    comentario_pai_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (ata_id) REFERENCES atas_reuniao(id) ON DELETE CASCADE,
    FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (comentario_pai_id) REFERENCES atas_comentarios(id) ON DELETE CASCADE
);

CREATE INDEX idx_atas_comentarios_ata_id ON atas_comentarios(ata_id);
CREATE INDEX idx_atas_comentarios_autor_id ON atas_comentarios(autor_id);
CREATE INDEX idx_atas_comentarios_comentario_pai_id ON atas_comentarios(comentario_pai_id);

-- HistoricoAndamento
CREATE TABLE historicos_andamento (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    ata_id TEXT NOT NULL,
    data TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acao TEXT NOT NULL,
    descricao TEXT,
    responsavel TEXT,
    criado_por TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (ata_id) REFERENCES atas_reuniao(id) ON DELETE CASCADE,
    FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX idx_historicos_andamento_ata_id ON historicos_andamento(ata_id);
CREATE INDEX idx_historicos_andamento_data ON historicos_andamento(data);

-- PrazoAcao
CREATE TABLE prazos_acao (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    ata_id TEXT NOT NULL,
    acao_id TEXT,
    titulo TEXT NOT NULL,
    descricao TEXT,
    data_prazo TIMESTAMP WITH TIME ZONE NOT NULL,
    data_conclusao TIMESTAMP WITH TIME ZONE,
    status status_prazo DEFAULT 'PENDENTE',
    concluido BOOLEAN DEFAULT false,
    lembretes_enviados INTEGER DEFAULT 0,
    ultimo_lembrete TIMESTAMP WITH TIME ZONE,
    criado_por TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (ata_id) REFERENCES atas_reuniao(id) ON DELETE CASCADE,
    FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX idx_prazos_acao_ata_id ON prazos_acao(ata_id);
CREATE INDEX idx_prazos_acao_data_prazo ON prazos_acao(data_prazo);
CREATE INDEX idx_prazos_acao_status ON prazos_acao(status);
CREATE INDEX idx_prazos_acao_concluido ON prazos_acao(concluido);

-- LembretePrazo
CREATE TABLE lembretes_prazo (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    prazo_id TEXT NOT NULL,
    usuario_id TEXT NOT NULL,
    tipo tipo_lembrete NOT NULL,
    mensagem TEXT NOT NULL,
    enviado BOOLEAN DEFAULT false,
    data_envio TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (prazo_id) REFERENCES prazos_acao(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX idx_lembretes_prazo_prazo_id ON lembretes_prazo(prazo_id);
CREATE INDEX idx_lembretes_prazo_usuario_id ON lembretes_prazo(usuario_id);
CREATE INDEX idx_lembretes_prazo_enviado ON lembretes_prazo(enviado);

-- PreferenciaNotificacao
CREATE TABLE preferencias_notificacao (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id TEXT UNIQUE NOT NULL,
    email_ativo BOOLEAN DEFAULT true,
    sistema_ativo BOOLEAN DEFAULT true,
    push_ativo BOOLEAN DEFAULT false,
    lembrete3_dias BOOLEAN DEFAULT true,
    lembrete1_dia BOOLEAN DEFAULT true,
    lembrete_hoje BOOLEAN DEFAULT true,
    lembrete_vencido BOOLEAN DEFAULT true,
    horario_inicio TEXT DEFAULT '08:00',
    horario_fim TEXT DEFAULT '18:00',
    dias_semana TEXT[] DEFAULT ARRAY['segunda', 'terca', 'quarta', 'quinta', 'sexta']::TEXT[],
    notificar_prazos BOOLEAN DEFAULT true,
    notificar_historico BOOLEAN DEFAULT false,
    notificar_comentarios BOOLEAN DEFAULT false,
    notificar_status BOOLEAN DEFAULT true,
    resumo_diario BOOLEAN DEFAULT false,
    resumo_semanal BOOLEAN DEFAULT true,
    dia_resumo_semanal TEXT DEFAULT 'segunda',
    horario_resumo_semanal TEXT DEFAULT '09:00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- PushSubscription
CREATE TABLE push_subscriptions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_push_subscriptions_usuario_endpoint ON push_subscriptions(usuario_id, endpoint);
CREATE INDEX idx_push_subscriptions_usuario_id ON push_subscriptions(usuario_id);

-- LogAlteracaoAta
CREATE TABLE logs_alteracao_ata (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    ata_id TEXT NOT NULL,
    usuario_id TEXT NOT NULL,
    tipo_alteracao tipo_alteracao_ata NOT NULL,
    campo TEXT,
    valor_anterior TEXT,
    valor_novo TEXT,
    descricao TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (ata_id) REFERENCES atas_reuniao(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX idx_logs_alteracao_ata_ata_id ON logs_alteracao_ata(ata_id);
CREATE INDEX idx_logs_alteracao_ata_usuario_id ON logs_alteracao_ata(usuario_id);
CREATE INDEX idx_logs_alteracao_ata_tipo_alteracao ON logs_alteracao_ata(tipo_alteracao);
CREATE INDEX idx_logs_alteracao_ata_created_at ON logs_alteracao_ata(created_at);

-- ConfiguracaoEmail
CREATE TABLE configuracoes_email (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    host TEXT NOT NULL,
    porta INTEGER NOT NULL,
    autenticar BOOLEAN DEFAULT true,
    usuario TEXT NOT NULL,
    senha TEXT NOT NULL,
    copias_para TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_configuracoes_email_ativo ON configuracoes_email(ativo);

-- LogEnvioEmail
CREATE TABLE logs_envio_email (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    configuracao_id TEXT NOT NULL,
    destinatario TEXT NOT NULL,
    assunto TEXT NOT NULL,
    corpo TEXT,
    status status_envio_email DEFAULT 'PENDENTE',
    erro TEXT,
    tentativas INTEGER DEFAULT 0,
    enviado_em TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (configuracao_id) REFERENCES configuracoes_email(id) ON DELETE CASCADE
);

CREATE INDEX idx_logs_envio_email_configuracao_id ON logs_envio_email(configuracao_id);
CREATE INDEX idx_logs_envio_email_status ON logs_envio_email(status);
CREATE INDEX idx_logs_envio_email_created_at ON logs_envio_email(created_at);
CREATE INDEX idx_logs_envio_email_destinatario ON logs_envio_email(destinatario);

-- BravoSyncConfig
CREATE TABLE bravo_sync_configs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    chave TEXT UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descricao TEXT,
    tipo TEXT DEFAULT 'string',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bravo_sync_configs_chave ON bravo_sync_configs(chave);

-- BravoCampoMapeamento
CREATE TABLE bravo_campos_mapeamento (
    id SERIAL PRIMARY KEY,
    campo_bravo TEXT NOT NULL,
    campo_interno TEXT NOT NULL,
    tipo_transformacao TEXT DEFAULT 'direto',
    ativo BOOLEAN DEFAULT true,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bravo_campos_mapeamento_ativo ON bravo_campos_mapeamento(ativo);
CREATE INDEX idx_bravo_campos_mapeamento_ordem ON bravo_campos_mapeamento(ordem);

-- Produto
CREATE TABLE produtos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    referencia TEXT UNIQUE NOT NULL,
    id_prod TEXT,
    descricao TEXT,
    marca TEXT,
    grupo TEXT,
    subgrupo TEXT,
    ativo BOOLEAN DEFAULT true,
    gtin TEXT,
    ncm TEXT,
    cest TEXT,
    data_ult_modif TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_produtos_referencia ON produtos(referencia);
CREATE INDEX idx_produtos_id_prod ON produtos(id_prod);
CREATE INDEX idx_produtos_ativo ON produtos(ativo);
CREATE INDEX idx_produtos_marca ON produtos(marca);
CREATE INDEX idx_produtos_grupo ON produtos(grupo);
CREATE INDEX idx_produtos_data_ult_modif ON produtos(data_ult_modif);

-- BravoSyncLog
CREATE TABLE bravo_sync_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_type TEXT NOT NULL,
    status TEXT DEFAULT 'running',
    status_detalhado TEXT,
    apenas_ativos BOOLEAN DEFAULT true,
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
    can_resume BOOLEAN DEFAULT false,
    sync_details JSONB,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    last_activity_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_bravo_sync_logs_status ON bravo_sync_logs(status);
CREATE INDEX idx_bravo_sync_logs_sync_type ON bravo_sync_logs(sync_type);
CREATE INDEX idx_bravo_sync_logs_started_at ON bravo_sync_logs(started_at);
CREATE INDEX idx_bravo_sync_logs_can_resume ON bravo_sync_logs(can_resume);
CREATE INDEX idx_bravo_sync_logs_user_id ON bravo_sync_logs(user_id);

-- BravoSyncProgress
CREATE TABLE bravo_sync_progress (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_log_id TEXT UNIQUE NOT NULL,
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (sync_log_id) REFERENCES bravo_sync_logs(id) ON DELETE CASCADE
);

CREATE INDEX idx_bravo_sync_progress_sync_log_id ON bravo_sync_progress(sync_log_id);

-- Marcas, Grupos e Subgrupos
CREATE TABLE marcas (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_marcas_nome ON marcas(nome);

CREATE TABLE grupos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_grupos_nome ON grupos(nome);

CREATE TABLE subgrupos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_subgrupos_nome ON subgrupos(nome);

-- VendaImportacaoLog (DEVE VIR ANTES de vendas)
CREATE TABLE venda_importacao_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX idx_venda_importacao_logs_created_at ON venda_importacao_logs(created_at);
CREATE INDEX idx_venda_importacao_logs_usuario_id ON venda_importacao_logs(usuario_id);

-- PedidoImportacaoLog (DEVE VIR ANTES de pedidos)
CREATE TABLE pedido_importacao_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX idx_pedido_importacao_logs_created_at ON pedido_importacao_logs(created_at);
CREATE INDEX idx_pedido_importacao_logs_usuario_id ON pedido_importacao_logs(usuario_id);

-- Venda
CREATE TABLE vendas (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    nfe TEXT NOT NULL,
    id_doc TEXT,
    data_venda TIMESTAMP WITH TIME ZONE NOT NULL,
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
    empresa_id TEXT,
    produto_id TEXT,
    importacao_log_id TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE SET NULL,
    FOREIGN KEY (importacao_log_id) REFERENCES venda_importacao_logs(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX idx_vendas_unique ON vendas(nfe, id_doc, referencia);
CREATE INDEX idx_vendas_nfe ON vendas(nfe);
CREATE INDEX idx_vendas_data_venda ON vendas(data_venda);
CREATE INDEX idx_vendas_empresa_data_venda ON vendas(empresa_id, data_venda);
CREATE INDEX idx_vendas_referencia ON vendas(referencia);
CREATE INDEX idx_vendas_razao_social ON vendas(razao_social);
CREATE INDEX idx_vendas_id_doc ON vendas(id_doc);
CREATE INDEX idx_vendas_marca ON vendas(marca);
CREATE INDEX idx_vendas_grupo ON vendas(grupo);
CREATE INDEX idx_vendas_subgrupo ON vendas(subgrupo);
CREATE INDEX idx_vendas_prod_cod_mestre ON vendas(prod_cod_mestre);
CREATE INDEX idx_vendas_tipo_operacao ON vendas(tipo_operacao);
CREATE INDEX idx_vendas_importacao_log_id ON vendas(importacao_log_id);
CREATE INDEX idx_vendas_nfe_data_referencia ON vendas(nfe, data_venda, referencia);

-- VendaAnalytics
CREATE TABLE vendas_analytics (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    empresa_id TEXT,
    nome_fantasia TEXT NOT NULL,
    marca TEXT NOT NULL,
    grupo TEXT,
    subgrupo TEXT,
    tipo_operacao TEXT,
    uf TEXT NOT NULL,
    total_valor DECIMAL(18, 2) NOT NULL,
    total_quantidade DECIMAL(18, 3) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX idx_vendas_analytics_unique ON vendas_analytics(ano, mes, nome_fantasia, marca, grupo, subgrupo, tipo_operacao, uf, empresa_id);
CREATE INDEX idx_vendas_analytics_ano_mes ON vendas_analytics(ano, mes);
CREATE INDEX idx_vendas_analytics_empresa_ano_mes ON vendas_analytics(empresa_id, ano, mes);
CREATE INDEX idx_vendas_analytics_marca ON vendas_analytics(marca);
CREATE INDEX idx_vendas_analytics_grupo ON vendas_analytics(grupo);
CREATE INDEX idx_vendas_analytics_subgrupo ON vendas_analytics(subgrupo);
CREATE INDEX idx_vendas_analytics_tipo_operacao ON vendas_analytics(tipo_operacao);
CREATE INDEX idx_vendas_analytics_uf ON vendas_analytics(uf);
CREATE INDEX idx_vendas_analytics_nome_fantasia ON vendas_analytics(nome_fantasia);

-- VendaColumnMapping
CREATE TABLE venda_column_mappings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    column_mapping JSONB NOT NULL,
    filters JSONB,
    descricao TEXT,
    usuario_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX idx_venda_column_mappings_usuario_id ON venda_column_mappings(usuario_id);
CREATE INDEX idx_venda_column_mappings_created_at ON venda_column_mappings(created_at);

-- VendaAnalyticsFilter
CREATE TABLE venda_analytics_filters (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    filters JSONB NOT NULL,
    descricao TEXT,
    usuario_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX idx_venda_analytics_filters_usuario_id ON venda_analytics_filters(usuario_id);
CREATE INDEX idx_venda_analytics_filters_created_at ON venda_analytics_filters(created_at);

-- Pedido
CREATE TABLE pedidos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_pedido TEXT NOT NULL,
    id_doc TEXT,
    data_pedido TIMESTAMP WITH TIME ZONE NOT NULL,
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
    empresa_id TEXT,
    produto_id TEXT,
    importacao_log_id TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE SET NULL,
    FOREIGN KEY (importacao_log_id) REFERENCES pedido_importacao_logs(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX idx_pedidos_unique ON pedidos(numero_pedido, id_doc, referencia);
CREATE INDEX idx_pedidos_numero_pedido ON pedidos(numero_pedido);
CREATE INDEX idx_pedidos_data_pedido ON pedidos(data_pedido);
CREATE INDEX idx_pedidos_empresa_data_pedido ON pedidos(empresa_id, data_pedido);
CREATE INDEX idx_pedidos_referencia ON pedidos(referencia);
CREATE INDEX idx_pedidos_nome_fantasia ON pedidos(nome_fantasia);
CREATE INDEX idx_pedidos_id_doc ON pedidos(id_doc);
CREATE INDEX idx_pedidos_marca ON pedidos(marca);
CREATE INDEX idx_pedidos_grupo ON pedidos(grupo);
CREATE INDEX idx_pedidos_subgrupo ON pedidos(subgrupo);
CREATE INDEX idx_pedidos_importacao_log_id ON pedidos(importacao_log_id);
CREATE INDEX idx_pedidos_numero_data_referencia ON pedidos(numero_pedido, data_pedido, referencia);

-- PedidoAnalytics
CREATE TABLE pedido_analytics (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    empresa_id TEXT,
    nome_fantasia TEXT NOT NULL,
    marca TEXT NOT NULL,
    grupo TEXT,
    subgrupo TEXT,
    total_valor DECIMAL(18, 2) NOT NULL,
    total_quantidade DECIMAL(18, 3) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX idx_pedido_analytics_unique ON pedido_analytics(ano, mes, nome_fantasia, marca, grupo, subgrupo, empresa_id);
CREATE INDEX idx_pedido_analytics_ano_mes ON pedido_analytics(ano, mes);
CREATE INDEX idx_pedido_analytics_empresa_ano_mes ON pedido_analytics(empresa_id, ano, mes);
CREATE INDEX idx_pedido_analytics_marca ON pedido_analytics(marca);
CREATE INDEX idx_pedido_analytics_grupo ON pedido_analytics(grupo);
CREATE INDEX idx_pedido_analytics_subgrupo ON pedido_analytics(subgrupo);
CREATE INDEX idx_pedido_analytics_nome_fantasia ON pedido_analytics(nome_fantasia);

-- PedidoColumnMapping
CREATE TABLE pedido_column_mappings (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    column_mapping JSONB NOT NULL,
    filters JSONB,
    descricao TEXT,
    usuario_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX idx_pedido_column_mappings_usuario_id ON pedido_column_mappings(usuario_id);
CREATE INDEX idx_pedido_column_mappings_created_at ON pedido_column_mappings(created_at);

-- PedidoAnalyticsFilter
CREATE TABLE pedido_analytics_filters (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    filters JSONB NOT NULL,
    descricao TEXT,
    usuario_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

CREATE INDEX idx_pedido_analytics_filters_usuario_id ON pedido_analytics_filters(usuario_id);
CREATE INDEX idx_pedido_analytics_filters_created_at ON pedido_analytics_filters(created_at);

-- UsuarioCliente
CREATE TABLE usuarios_clientes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id TEXT NOT NULL,
    nome_fantasia TEXT NOT NULL,
    tipo_cliente tipo_cliente_associacao NOT NULL,
    permissoes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_usuarios_clientes_unique ON usuarios_clientes(usuario_id, nome_fantasia, tipo_cliente);
CREATE INDEX idx_usuarios_clientes_usuario_id ON usuarios_clientes(usuario_id);
CREATE INDEX idx_usuarios_clientes_nome_fantasia ON usuarios_clientes(nome_fantasia);

-- RLS (Row Level Security) - Desativado por padrão, pode ser ativado conforme necessário
-- ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
-- ... outras tabelas conforme necessário