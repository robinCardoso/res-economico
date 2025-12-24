--
-- PostgreSQL database dump
--

\restrict ivPKcjVnaH2AQLD741jHvoPgXxsg5ikWdbW0BMxGyr3rkuDjTSABuUQsJofh4qX

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public."Venda" DROP CONSTRAINT IF EXISTS "Venda_produtoId_fkey";
ALTER TABLE IF EXISTS ONLY public."Venda" DROP CONSTRAINT IF EXISTS "Venda_importacaoLogId_fkey";
ALTER TABLE IF EXISTS ONLY public."Venda" DROP CONSTRAINT IF EXISTS "Venda_empresaId_fkey";
ALTER TABLE IF EXISTS ONLY public."VendaImportacaoLog" DROP CONSTRAINT IF EXISTS "VendaImportacaoLog_usuarioId_fkey";
ALTER TABLE IF EXISTS ONLY public."VendaColumnMapping" DROP CONSTRAINT IF EXISTS "VendaColumnMapping_usuarioId_fkey";
ALTER TABLE IF EXISTS ONLY public."VendaAnalytics" DROP CONSTRAINT IF EXISTS "VendaAnalytics_empresaId_fkey";
ALTER TABLE IF EXISTS ONLY public."VendaAnalyticsFilter" DROP CONSTRAINT IF EXISTS "VendaAnalyticsFilter_usuarioId_fkey";
ALTER TABLE IF EXISTS ONLY public."Usuario" DROP CONSTRAINT IF EXISTS "Usuario_empresaId_fkey";
ALTER TABLE IF EXISTS ONLY public."UsuarioCliente" DROP CONSTRAINT IF EXISTS "UsuarioCliente_usuarioId_fkey";
ALTER TABLE IF EXISTS ONLY public."Upload" DROP CONSTRAINT IF EXISTS "Upload_templateId_fkey";
ALTER TABLE IF EXISTS ONLY public."Upload" DROP CONSTRAINT IF EXISTS "Upload_empresaId_fkey";
ALTER TABLE IF EXISTS ONLY public."TemplateImportacao" DROP CONSTRAINT IF EXISTS "TemplateImportacao_empresaId_fkey";
ALTER TABLE IF EXISTS ONLY public."ResumoEconomico" DROP CONSTRAINT IF EXISTS "ResumoEconomico_uploadId_fkey";
ALTER TABLE IF EXISTS ONLY public."ResumoEconomico" DROP CONSTRAINT IF EXISTS "ResumoEconomico_empresaId_fkey";
ALTER TABLE IF EXISTS ONLY public."ResumoEconomico" DROP CONSTRAINT IF EXISTS "ResumoEconomico_criadoPor_fkey";
ALTER TABLE IF EXISTS ONLY public."PushSubscription" DROP CONSTRAINT IF EXISTS "PushSubscription_usuarioId_fkey";
ALTER TABLE IF EXISTS ONLY public."Processo" DROP CONSTRAINT IF EXISTS "Processo_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Processo" DROP CONSTRAINT IF EXISTS "Processo_empresaId_fkey";
ALTER TABLE IF EXISTS ONLY public."ProcessoItem" DROP CONSTRAINT IF EXISTS "ProcessoItem_processoId_fkey";
ALTER TABLE IF EXISTS ONLY public."ProcessoHistorico" DROP CONSTRAINT IF EXISTS "ProcessoHistorico_processoId_fkey";
ALTER TABLE IF EXISTS ONLY public."ProcessoAnexo" DROP CONSTRAINT IF EXISTS "ProcessoAnexo_processoId_fkey";
ALTER TABLE IF EXISTS ONLY public."PreferenciaNotificacao" DROP CONSTRAINT IF EXISTS "PreferenciaNotificacao_usuarioId_fkey";
ALTER TABLE IF EXISTS ONLY public."PrazoAcao" DROP CONSTRAINT IF EXISTS "PrazoAcao_criadoPor_fkey";
ALTER TABLE IF EXISTS ONLY public."PrazoAcao" DROP CONSTRAINT IF EXISTS "PrazoAcao_ataId_fkey";
ALTER TABLE IF EXISTS ONLY public."Pedido" DROP CONSTRAINT IF EXISTS "Pedido_produtoId_fkey";
ALTER TABLE IF EXISTS ONLY public."Pedido" DROP CONSTRAINT IF EXISTS "Pedido_importacaoLogId_fkey";
ALTER TABLE IF EXISTS ONLY public."Pedido" DROP CONSTRAINT IF EXISTS "Pedido_empresaId_fkey";
ALTER TABLE IF EXISTS ONLY public."PedidoImportacaoLog" DROP CONSTRAINT IF EXISTS "PedidoImportacaoLog_usuarioId_fkey";
ALTER TABLE IF EXISTS ONLY public."PedidoColumnMapping" DROP CONSTRAINT IF EXISTS "PedidoColumnMapping_usuarioId_fkey";
ALTER TABLE IF EXISTS ONLY public."PedidoAnalytics" DROP CONSTRAINT IF EXISTS "PedidoAnalytics_empresaId_fkey";
ALTER TABLE IF EXISTS ONLY public."PedidoAnalyticsFilter" DROP CONSTRAINT IF EXISTS "PedidoAnalyticsFilter_usuarioId_fkey";
ALTER TABLE IF EXISTS ONLY public."ModeloAta" DROP CONSTRAINT IF EXISTS "ModeloAta_empresaId_fkey";
ALTER TABLE IF EXISTS ONLY public."ModeloAta" DROP CONSTRAINT IF EXISTS "ModeloAta_criadoPor_fkey";
ALTER TABLE IF EXISTS ONLY public."LogEnvioEmail" DROP CONSTRAINT IF EXISTS "LogEnvioEmail_configuracaoId_fkey";
ALTER TABLE IF EXISTS ONLY public."LogAuditoria" DROP CONSTRAINT IF EXISTS "LogAuditoria_usuarioId_fkey";
ALTER TABLE IF EXISTS ONLY public."LogAlteracaoAta" DROP CONSTRAINT IF EXISTS "LogAlteracaoAta_usuarioId_fkey";
ALTER TABLE IF EXISTS ONLY public."LogAlteracaoAta" DROP CONSTRAINT IF EXISTS "LogAlteracaoAta_ataId_fkey";
ALTER TABLE IF EXISTS ONLY public."LinhaUpload" DROP CONSTRAINT IF EXISTS "LinhaUpload_uploadId_fkey";
ALTER TABLE IF EXISTS ONLY public."LembretePrazo" DROP CONSTRAINT IF EXISTS "LembretePrazo_usuarioId_fkey";
ALTER TABLE IF EXISTS ONLY public."LembretePrazo" DROP CONSTRAINT IF EXISTS "LembretePrazo_prazoId_fkey";
ALTER TABLE IF EXISTS ONLY public."HistoricoAndamento" DROP CONSTRAINT IF EXISTS "HistoricoAndamento_criadoPor_fkey";
ALTER TABLE IF EXISTS ONLY public."HistoricoAndamento" DROP CONSTRAINT IF EXISTS "HistoricoAndamento_ataId_fkey";
ALTER TABLE IF EXISTS ONLY public."BravoSyncProgress" DROP CONSTRAINT IF EXISTS "BravoSyncProgress_sync_log_id_fkey";
ALTER TABLE IF EXISTS ONLY public."AtaReuniao" DROP CONSTRAINT IF EXISTS "AtaReuniao_modeloAtaId_fkey";
ALTER TABLE IF EXISTS ONLY public."AtaReuniao" DROP CONSTRAINT IF EXISTS "AtaReuniao_empresaId_fkey";
ALTER TABLE IF EXISTS ONLY public."AtaReuniao" DROP CONSTRAINT IF EXISTS "AtaReuniao_criadoPor_fkey";
ALTER TABLE IF EXISTS ONLY public."AtaParticipante" DROP CONSTRAINT IF EXISTS "AtaParticipante_usuarioId_fkey";
ALTER TABLE IF EXISTS ONLY public."AtaParticipante" DROP CONSTRAINT IF EXISTS "AtaParticipante_ataId_fkey";
ALTER TABLE IF EXISTS ONLY public."AtaComentario" DROP CONSTRAINT IF EXISTS "AtaComentario_comentarioPaiId_fkey";
ALTER TABLE IF EXISTS ONLY public."AtaComentario" DROP CONSTRAINT IF EXISTS "AtaComentario_autorId_fkey";
ALTER TABLE IF EXISTS ONLY public."AtaComentario" DROP CONSTRAINT IF EXISTS "AtaComentario_ataId_fkey";
ALTER TABLE IF EXISTS ONLY public."AtaAnexo" DROP CONSTRAINT IF EXISTS "AtaAnexo_ataId_fkey";
ALTER TABLE IF EXISTS ONLY public."Alerta" DROP CONSTRAINT IF EXISTS "Alerta_uploadId_fkey";
ALTER TABLE IF EXISTS ONLY public."Alerta" DROP CONSTRAINT IF EXISTS "Alerta_linhaId_fkey";
DROP INDEX IF EXISTS public."Venda_tipoOperacao_idx";
DROP INDEX IF EXISTS public."Venda_subgrupo_idx";
DROP INDEX IF EXISTS public."Venda_referencia_idx";
DROP INDEX IF EXISTS public."Venda_razaoSocial_idx";
DROP INDEX IF EXISTS public."Venda_prodCodMestre_idx";
DROP INDEX IF EXISTS public."Venda_nfe_idx";
DROP INDEX IF EXISTS public."Venda_nfe_idDoc_referencia_key";
DROP INDEX IF EXISTS public."Venda_nfe_dataVenda_referencia_idx";
DROP INDEX IF EXISTS public."Venda_marca_idx";
DROP INDEX IF EXISTS public."Venda_importacaoLogId_idx";
DROP INDEX IF EXISTS public."Venda_idDoc_idx";
DROP INDEX IF EXISTS public."Venda_grupo_idx";
DROP INDEX IF EXISTS public."Venda_empresaId_dataVenda_idx";
DROP INDEX IF EXISTS public."Venda_dataVenda_idx";
DROP INDEX IF EXISTS public."VendaImportacaoLog_usuarioId_idx";
DROP INDEX IF EXISTS public."VendaImportacaoLog_createdAt_idx";
DROP INDEX IF EXISTS public."VendaColumnMapping_usuarioId_idx";
DROP INDEX IF EXISTS public."VendaColumnMapping_createdAt_idx";
DROP INDEX IF EXISTS public."VendaAnalytics_uf_idx";
DROP INDEX IF EXISTS public."VendaAnalytics_tipoOperacao_idx";
DROP INDEX IF EXISTS public."VendaAnalytics_subgrupo_idx";
DROP INDEX IF EXISTS public."VendaAnalytics_nomeFantasia_idx";
DROP INDEX IF EXISTS public."VendaAnalytics_marca_idx";
DROP INDEX IF EXISTS public."VendaAnalytics_grupo_idx";
DROP INDEX IF EXISTS public."VendaAnalytics_empresaId_ano_mes_idx";
DROP INDEX IF EXISTS public."VendaAnalytics_ano_mes_nomeFantasia_marca_uf_key";
DROP INDEX IF EXISTS public."VendaAnalytics_ano_mes_idx";
DROP INDEX IF EXISTS public."VendaAnalyticsFilter_usuarioId_idx";
DROP INDEX IF EXISTS public."VendaAnalyticsFilter_createdAt_idx";
DROP INDEX IF EXISTS public."Usuario_email_key";
DROP INDEX IF EXISTS public."UsuarioCliente_usuarioId_nomeFantasia_tipoCliente_key";
DROP INDEX IF EXISTS public."UsuarioCliente_usuarioId_idx";
DROP INDEX IF EXISTS public."UsuarioCliente_nomeFantasia_idx";
DROP INDEX IF EXISTS public."Subgrupo_nome_key";
DROP INDEX IF EXISTS public."Subgrupo_nome_idx";
DROP INDEX IF EXISTS public."ResumoEconomico_status_idx";
DROP INDEX IF EXISTS public."ResumoEconomico_empresaId_ano_mes_idx";
DROP INDEX IF EXISTS public."ResumoEconomico_criadoPor_createdAt_idx";
DROP INDEX IF EXISTS public."PushSubscription_usuarioId_idx";
DROP INDEX IF EXISTS public."PushSubscription_usuarioId_endpoint_key";
DROP INDEX IF EXISTS public."Produto_referencia_key";
DROP INDEX IF EXISTS public."Produto_referencia_idx";
DROP INDEX IF EXISTS public."Produto_marca_idx";
DROP INDEX IF EXISTS public."Produto_id_prod_idx";
DROP INDEX IF EXISTS public."Produto_grupo_idx";
DROP INDEX IF EXISTS public."Produto_dataUltModif_idx";
DROP INDEX IF EXISTS public."Produto_ativo_idx";
DROP INDEX IF EXISTS public."Processo_userId_createdAt_idx";
DROP INDEX IF EXISTS public."Processo_tipo_situacao_idx";
DROP INDEX IF EXISTS public."Processo_situacao_createdAt_idx";
DROP INDEX IF EXISTS public."Processo_protocolo_key";
DROP INDEX IF EXISTS public."Processo_protocolo_idx";
DROP INDEX IF EXISTS public."Processo_numeroControle_key";
DROP INDEX IF EXISTS public."Processo_numeroControle_idx";
DROP INDEX IF EXISTS public."Processo_empresaId_createdAt_idx";
DROP INDEX IF EXISTS public."ProcessoItem_processoId_idx";
DROP INDEX IF EXISTS public."ProcessoHistorico_usuarioId_idx";
DROP INDEX IF EXISTS public."ProcessoHistorico_processoId_createdAt_idx";
DROP INDEX IF EXISTS public."ProcessoAnexo_processoId_idx";
DROP INDEX IF EXISTS public."PreferenciaNotificacao_usuarioId_key";
DROP INDEX IF EXISTS public."PrazoAcao_status_idx";
DROP INDEX IF EXISTS public."PrazoAcao_dataPrazo_idx";
DROP INDEX IF EXISTS public."PrazoAcao_concluido_idx";
DROP INDEX IF EXISTS public."PrazoAcao_ataId_idx";
DROP INDEX IF EXISTS public."Pedido_subgrupo_idx";
DROP INDEX IF EXISTS public."Pedido_referencia_idx";
DROP INDEX IF EXISTS public."Pedido_numeroPedido_idx";
DROP INDEX IF EXISTS public."Pedido_numeroPedido_idDoc_referencia_key";
DROP INDEX IF EXISTS public."Pedido_numeroPedido_dataPedido_referencia_idx";
DROP INDEX IF EXISTS public."Pedido_nomeFantasia_idx";
DROP INDEX IF EXISTS public."Pedido_marca_idx";
DROP INDEX IF EXISTS public."Pedido_importacaoLogId_idx";
DROP INDEX IF EXISTS public."Pedido_idDoc_idx";
DROP INDEX IF EXISTS public."Pedido_grupo_idx";
DROP INDEX IF EXISTS public."Pedido_empresaId_dataPedido_idx";
DROP INDEX IF EXISTS public."Pedido_dataPedido_idx";
DROP INDEX IF EXISTS public."PedidoImportacaoLog_usuarioId_idx";
DROP INDEX IF EXISTS public."PedidoImportacaoLog_createdAt_idx";
DROP INDEX IF EXISTS public."PedidoColumnMapping_usuarioId_idx";
DROP INDEX IF EXISTS public."PedidoColumnMapping_createdAt_idx";
DROP INDEX IF EXISTS public."PedidoAnalytics_subgrupo_idx";
DROP INDEX IF EXISTS public."PedidoAnalytics_nomeFantasia_idx";
DROP INDEX IF EXISTS public."PedidoAnalytics_marca_idx";
DROP INDEX IF EXISTS public."PedidoAnalytics_grupo_idx";
DROP INDEX IF EXISTS public."PedidoAnalytics_empresaId_ano_mes_idx";
DROP INDEX IF EXISTS public."PedidoAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_empre";
DROP INDEX IF EXISTS public."PedidoAnalytics_ano_mes_idx";
DROP INDEX IF EXISTS public."PedidoAnalyticsFilter_usuarioId_idx";
DROP INDEX IF EXISTS public."PedidoAnalyticsFilter_createdAt_idx";
DROP INDEX IF EXISTS public."ModeloAta_tipoReuniao_idx";
DROP INDEX IF EXISTS public."ModeloAta_empresaId_idx";
DROP INDEX IF EXISTS public."ModeloAta_ativo_idx";
DROP INDEX IF EXISTS public."Marca_nome_key";
DROP INDEX IF EXISTS public."Marca_nome_idx";
DROP INDEX IF EXISTS public."LogEnvioEmail_status_idx";
DROP INDEX IF EXISTS public."LogEnvioEmail_destinatario_idx";
DROP INDEX IF EXISTS public."LogEnvioEmail_createdAt_idx";
DROP INDEX IF EXISTS public."LogEnvioEmail_configuracaoId_idx";
DROP INDEX IF EXISTS public."LogAlteracaoAta_usuarioId_idx";
DROP INDEX IF EXISTS public."LogAlteracaoAta_tipoAlteracao_idx";
DROP INDEX IF EXISTS public."LogAlteracaoAta_createdAt_idx";
DROP INDEX IF EXISTS public."LogAlteracaoAta_ataId_idx";
DROP INDEX IF EXISTS public."LembretePrazo_usuarioId_idx";
DROP INDEX IF EXISTS public."LembretePrazo_prazoId_idx";
DROP INDEX IF EXISTS public."LembretePrazo_enviado_idx";
DROP INDEX IF EXISTS public."HistoricoAndamento_data_idx";
DROP INDEX IF EXISTS public."HistoricoAndamento_ataId_idx";
DROP INDEX IF EXISTS public."Grupo_nome_key";
DROP INDEX IF EXISTS public."Grupo_nome_idx";
DROP INDEX IF EXISTS public."Empresa_cnpj_key";
DROP INDEX IF EXISTS public."ContaCatalogo_classificacao_key";
DROP INDEX IF EXISTS public."ContaCatalogo_classificacao_conta_subConta_key";
DROP INDEX IF EXISTS public."ConfiguracaoModeloNegocio_modeloNegocio_key";
DROP INDEX IF EXISTS public."ConfiguracaoEmail_ativo_idx";
DROP INDEX IF EXISTS public."BravoSyncProgress_sync_log_id_key";
DROP INDEX IF EXISTS public."BravoSyncProgress_sync_log_id_idx";
DROP INDEX IF EXISTS public."BravoSyncLog_userId_idx";
DROP INDEX IF EXISTS public."BravoSyncLog_sync_type_idx";
DROP INDEX IF EXISTS public."BravoSyncLog_status_idx";
DROP INDEX IF EXISTS public."BravoSyncLog_started_at_idx";
DROP INDEX IF EXISTS public."BravoSyncLog_can_resume_idx";
DROP INDEX IF EXISTS public."BravoSyncConfig_chave_key";
DROP INDEX IF EXISTS public."BravoSyncConfig_chave_idx";
DROP INDEX IF EXISTS public."BravoCampoMapeamento_ordem_idx";
DROP INDEX IF EXISTS public."BravoCampoMapeamento_ativo_idx";
DROP INDEX IF EXISTS public."AtaReuniao_tipo_idx";
DROP INDEX IF EXISTS public."AtaReuniao_status_idx";
DROP INDEX IF EXISTS public."AtaReuniao_numero_key";
DROP INDEX IF EXISTS public."AtaReuniao_empresaId_idx";
DROP INDEX IF EXISTS public."AtaReuniao_dataReuniao_idx";
DROP INDEX IF EXISTS public."AtaReuniao_criadoPor_idx";
DROP INDEX IF EXISTS public."AtaParticipante_usuarioId_idx";
DROP INDEX IF EXISTS public."AtaParticipante_ataId_idx";
DROP INDEX IF EXISTS public."AtaComentario_comentarioPaiId_idx";
DROP INDEX IF EXISTS public."AtaComentario_autorId_idx";
DROP INDEX IF EXISTS public."AtaComentario_ataId_idx";
DROP INDEX IF EXISTS public."AtaAnexo_ataId_idx";
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public."Venda" DROP CONSTRAINT IF EXISTS "Venda_pkey";
ALTER TABLE IF EXISTS ONLY public."VendaImportacaoLog" DROP CONSTRAINT IF EXISTS "VendaImportacaoLog_pkey";
ALTER TABLE IF EXISTS ONLY public."VendaColumnMapping" DROP CONSTRAINT IF EXISTS "VendaColumnMapping_pkey";
ALTER TABLE IF EXISTS ONLY public."VendaAnalytics" DROP CONSTRAINT IF EXISTS "VendaAnalytics_pkey";
ALTER TABLE IF EXISTS ONLY public."VendaAnalytics" DROP CONSTRAINT IF EXISTS "VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_tipoOp";
ALTER TABLE IF EXISTS ONLY public."VendaAnalyticsFilter" DROP CONSTRAINT IF EXISTS "VendaAnalyticsFilter_pkey";
ALTER TABLE IF EXISTS ONLY public."Usuario" DROP CONSTRAINT IF EXISTS "Usuario_pkey";
ALTER TABLE IF EXISTS ONLY public."UsuarioCliente" DROP CONSTRAINT IF EXISTS "UsuarioCliente_pkey";
ALTER TABLE IF EXISTS ONLY public."Upload" DROP CONSTRAINT IF EXISTS "Upload_pkey";
ALTER TABLE IF EXISTS ONLY public."TemplateImportacao" DROP CONSTRAINT IF EXISTS "TemplateImportacao_pkey";
ALTER TABLE IF EXISTS ONLY public."Subgrupo" DROP CONSTRAINT IF EXISTS "Subgrupo_pkey";
ALTER TABLE IF EXISTS ONLY public."ResumoEconomico" DROP CONSTRAINT IF EXISTS "ResumoEconomico_pkey";
ALTER TABLE IF EXISTS ONLY public."PushSubscription" DROP CONSTRAINT IF EXISTS "PushSubscription_pkey";
ALTER TABLE IF EXISTS ONLY public."Produto" DROP CONSTRAINT IF EXISTS "Produto_pkey";
ALTER TABLE IF EXISTS ONLY public."Processo" DROP CONSTRAINT IF EXISTS "Processo_pkey";
ALTER TABLE IF EXISTS ONLY public."ProcessoItem" DROP CONSTRAINT IF EXISTS "ProcessoItem_pkey";
ALTER TABLE IF EXISTS ONLY public."ProcessoHistorico" DROP CONSTRAINT IF EXISTS "ProcessoHistorico_pkey";
ALTER TABLE IF EXISTS ONLY public."ProcessoAnexo" DROP CONSTRAINT IF EXISTS "ProcessoAnexo_pkey";
ALTER TABLE IF EXISTS ONLY public."PreferenciaNotificacao" DROP CONSTRAINT IF EXISTS "PreferenciaNotificacao_pkey";
ALTER TABLE IF EXISTS ONLY public."PrazoAcao" DROP CONSTRAINT IF EXISTS "PrazoAcao_pkey";
ALTER TABLE IF EXISTS ONLY public."Pedido" DROP CONSTRAINT IF EXISTS "Pedido_pkey";
ALTER TABLE IF EXISTS ONLY public."PedidoImportacaoLog" DROP CONSTRAINT IF EXISTS "PedidoImportacaoLog_pkey";
ALTER TABLE IF EXISTS ONLY public."PedidoColumnMapping" DROP CONSTRAINT IF EXISTS "PedidoColumnMapping_pkey";
ALTER TABLE IF EXISTS ONLY public."PedidoAnalytics" DROP CONSTRAINT IF EXISTS "PedidoAnalytics_pkey";
ALTER TABLE IF EXISTS ONLY public."PedidoAnalyticsFilter" DROP CONSTRAINT IF EXISTS "PedidoAnalyticsFilter_pkey";
ALTER TABLE IF EXISTS ONLY public."ModeloAta" DROP CONSTRAINT IF EXISTS "ModeloAta_pkey";
ALTER TABLE IF EXISTS ONLY public."Marca" DROP CONSTRAINT IF EXISTS "Marca_pkey";
ALTER TABLE IF EXISTS ONLY public."LogEnvioEmail" DROP CONSTRAINT IF EXISTS "LogEnvioEmail_pkey";
ALTER TABLE IF EXISTS ONLY public."LogAuditoria" DROP CONSTRAINT IF EXISTS "LogAuditoria_pkey";
ALTER TABLE IF EXISTS ONLY public."LogAlteracaoAta" DROP CONSTRAINT IF EXISTS "LogAlteracaoAta_pkey";
ALTER TABLE IF EXISTS ONLY public."LinhaUpload" DROP CONSTRAINT IF EXISTS "LinhaUpload_pkey";
ALTER TABLE IF EXISTS ONLY public."LembretePrazo" DROP CONSTRAINT IF EXISTS "LembretePrazo_pkey";
ALTER TABLE IF EXISTS ONLY public."HistoricoAndamento" DROP CONSTRAINT IF EXISTS "HistoricoAndamento_pkey";
ALTER TABLE IF EXISTS ONLY public."Grupo" DROP CONSTRAINT IF EXISTS "Grupo_pkey";
ALTER TABLE IF EXISTS ONLY public."Empresa" DROP CONSTRAINT IF EXISTS "Empresa_pkey";
ALTER TABLE IF EXISTS ONLY public."ContaCatalogo" DROP CONSTRAINT IF EXISTS "ContaCatalogo_pkey";
ALTER TABLE IF EXISTS ONLY public."ConfiguracaoModeloNegocio" DROP CONSTRAINT IF EXISTS "ConfiguracaoModeloNegocio_pkey";
ALTER TABLE IF EXISTS ONLY public."ConfiguracaoEmail" DROP CONSTRAINT IF EXISTS "ConfiguracaoEmail_pkey";
ALTER TABLE IF EXISTS ONLY public."BravoSyncProgress" DROP CONSTRAINT IF EXISTS "BravoSyncProgress_pkey";
ALTER TABLE IF EXISTS ONLY public."BravoSyncLog" DROP CONSTRAINT IF EXISTS "BravoSyncLog_pkey";
ALTER TABLE IF EXISTS ONLY public."BravoSyncConfig" DROP CONSTRAINT IF EXISTS "BravoSyncConfig_pkey";
ALTER TABLE IF EXISTS ONLY public."BravoCampoMapeamento" DROP CONSTRAINT IF EXISTS "BravoCampoMapeamento_pkey";
ALTER TABLE IF EXISTS ONLY public."AtaReuniao" DROP CONSTRAINT IF EXISTS "AtaReuniao_pkey";
ALTER TABLE IF EXISTS ONLY public."AtaParticipante" DROP CONSTRAINT IF EXISTS "AtaParticipante_pkey";
ALTER TABLE IF EXISTS ONLY public."AtaComentario" DROP CONSTRAINT IF EXISTS "AtaComentario_pkey";
ALTER TABLE IF EXISTS ONLY public."AtaAnexo" DROP CONSTRAINT IF EXISTS "AtaAnexo_pkey";
ALTER TABLE IF EXISTS ONLY public."Alerta" DROP CONSTRAINT IF EXISTS "Alerta_pkey";
ALTER TABLE IF EXISTS public."BravoCampoMapeamento" ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public._prisma_migrations;
DROP TABLE IF EXISTS public."VendaImportacaoLog";
DROP TABLE IF EXISTS public."VendaColumnMapping";
DROP TABLE IF EXISTS public."VendaAnalyticsFilter";
DROP TABLE IF EXISTS public."VendaAnalytics";
DROP TABLE IF EXISTS public."Venda";
DROP TABLE IF EXISTS public."UsuarioCliente";
DROP TABLE IF EXISTS public."Usuario";
DROP TABLE IF EXISTS public."Upload";
DROP TABLE IF EXISTS public."TemplateImportacao";
DROP TABLE IF EXISTS public."Subgrupo";
DROP TABLE IF EXISTS public."ResumoEconomico";
DROP TABLE IF EXISTS public."PushSubscription";
DROP TABLE IF EXISTS public."Produto";
DROP TABLE IF EXISTS public."ProcessoItem";
DROP TABLE IF EXISTS public."ProcessoHistorico";
DROP TABLE IF EXISTS public."ProcessoAnexo";
DROP TABLE IF EXISTS public."Processo";
DROP TABLE IF EXISTS public."PreferenciaNotificacao";
DROP TABLE IF EXISTS public."PrazoAcao";
DROP TABLE IF EXISTS public."PedidoImportacaoLog";
DROP TABLE IF EXISTS public."PedidoColumnMapping";
DROP TABLE IF EXISTS public."PedidoAnalyticsFilter";
DROP TABLE IF EXISTS public."PedidoAnalytics";
DROP TABLE IF EXISTS public."Pedido";
DROP TABLE IF EXISTS public."ModeloAta";
DROP TABLE IF EXISTS public."Marca";
DROP TABLE IF EXISTS public."LogEnvioEmail";
DROP TABLE IF EXISTS public."LogAuditoria";
DROP TABLE IF EXISTS public."LogAlteracaoAta";
DROP TABLE IF EXISTS public."LinhaUpload";
DROP TABLE IF EXISTS public."LembretePrazo";
DROP TABLE IF EXISTS public."HistoricoAndamento";
DROP TABLE IF EXISTS public."Grupo";
DROP TABLE IF EXISTS public."Empresa";
DROP TABLE IF EXISTS public."ContaCatalogo";
DROP TABLE IF EXISTS public."ConfiguracaoModeloNegocio";
DROP TABLE IF EXISTS public."ConfiguracaoEmail";
DROP TABLE IF EXISTS public."BravoSyncProgress";
DROP TABLE IF EXISTS public."BravoSyncLog";
DROP TABLE IF EXISTS public."BravoSyncConfig";
DROP SEQUENCE IF EXISTS public."BravoCampoMapeamento_id_seq";
DROP TABLE IF EXISTS public."BravoCampoMapeamento";
DROP TABLE IF EXISTS public."AtaReuniao";
DROP TABLE IF EXISTS public."AtaParticipante";
DROP TABLE IF EXISTS public."AtaComentario";
DROP TABLE IF EXISTS public."AtaAnexo";
DROP TABLE IF EXISTS public."Alerta";
DROP TYPE IF EXISTS public."UploadStatus";
DROP TYPE IF EXISTS public."TipoReuniao";
DROP TYPE IF EXISTS public."TipoProcesso";
DROP TYPE IF EXISTS public."TipoLembrete";
DROP TYPE IF EXISTS public."TipoEmpresa";
DROP TYPE IF EXISTS public."TipoComentario";
DROP TYPE IF EXISTS public."TipoClienteAssociacao";
DROP TYPE IF EXISTS public."TipoArquivoProcesso";
DROP TYPE IF EXISTS public."TipoArquivoAta";
DROP TYPE IF EXISTS public."TipoAlteracaoAta";
DROP TYPE IF EXISTS public."StatusPrazo";
DROP TYPE IF EXISTS public."StatusEnvioEmail";
DROP TYPE IF EXISTS public."StatusAta";
DROP TYPE IF EXISTS public."SituacaoProcesso";
DROP TYPE IF EXISTS public."ResumoStatus";
DROP TYPE IF EXISTS public."PrioridadeProcesso";
DROP TYPE IF EXISTS public."PorteEmpresa";
DROP TYPE IF EXISTS public."ModeloNegocio";
DROP TYPE IF EXISTS public."Departamento";
DROP TYPE IF EXISTS public."ContaStatus";
DROP TYPE IF EXISTS public."CategoriaReclamacao";
DROP TYPE IF EXISTS public."AlertaTipo";
DROP TYPE IF EXISTS public."AlertaStatus";
DROP TYPE IF EXISTS public."AlertaSeveridade";
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AlertaSeveridade; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AlertaSeveridade" AS ENUM (
    'BAIXA',
    'MEDIA',
    'ALTA'
);


--
-- Name: AlertaStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AlertaStatus" AS ENUM (
    'ABERTO',
    'EM_ANALISE',
    'RESOLVIDO'
);


--
-- Name: AlertaTipo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AlertaTipo" AS ENUM (
    'SALDO_DIVERGENTE',
    'CONTA_NOVA',
    'DADO_INCONSISTENTE',
    'CABECALHO_ALTERADO',
    'CONTINUIDADE_TEMPORAL_DIVERGENTE'
);


--
-- Name: CategoriaReclamacao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CategoriaReclamacao" AS ENUM (
    'ATENDIMENTO',
    'PRODUTOS',
    'LOGISTICA',
    'FINANCEIRO',
    'TECNICO',
    'COMUNICACAO'
);


--
-- Name: ContaStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ContaStatus" AS ENUM (
    'ATIVA',
    'NOVA',
    'ARQUIVADA'
);


--
-- Name: Departamento; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Departamento" AS ENUM (
    'FINANCEIRO',
    'COMPRAS',
    'GESTOR',
    'FATURAMENTO'
);


--
-- Name: ModeloNegocio; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ModeloNegocio" AS ENUM (
    'ASSOCIACAO',
    'COMERCIO',
    'INDUSTRIA',
    'SERVICOS',
    'AGROPECUARIA',
    'OUTRO'
);


--
-- Name: PorteEmpresa; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PorteEmpresa" AS ENUM (
    'MICRO',
    'PEQUENA',
    'MEDIA',
    'GRANDE'
);


--
-- Name: PrioridadeProcesso; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PrioridadeProcesso" AS ENUM (
    'BAIXA',
    'MEDIA',
    'ALTA'
);


--
-- Name: ResumoStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ResumoStatus" AS ENUM (
    'PROCESSANDO',
    'CONCLUIDO',
    'ERRO',
    'CANCELADO'
);


--
-- Name: SituacaoProcesso; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SituacaoProcesso" AS ENUM (
    'AGUARDANDO_ANALISE',
    'EM_ANALISE',
    'APROVADO',
    'REJEITADO',
    'EM_PROCESSAMENTO',
    'CONCLUIDO',
    'CANCELADO'
);


--
-- Name: StatusAta; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."StatusAta" AS ENUM (
    'RASCUNHO',
    'EM_PROCESSO',
    'FINALIZADA',
    'PUBLICADA',
    'ARQUIVADA'
);


--
-- Name: StatusEnvioEmail; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."StatusEnvioEmail" AS ENUM (
    'PENDENTE',
    'ENVIADO',
    'FALHA',
    'CANCELADO'
);


--
-- Name: StatusPrazo; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."StatusPrazo" AS ENUM (
    'PENDENTE',
    'EM_ANDAMENTO',
    'CONCLUIDO',
    'VENCIDO',
    'CANCELADO'
);


--
-- Name: TipoAlteracaoAta; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TipoAlteracaoAta" AS ENUM (
    'CRIACAO',
    'EDICAO',
    'EXCLUSAO',
    'MUDANCA_STATUS',
    'ADICAO_HISTORICO',
    'EDICAO_HISTORICO',
    'EXCLUSAO_HISTORICO',
    'ADICAO_PRAZO',
    'EDICAO_PRAZO',
    'EXCLUSAO_PRAZO',
    'CONCLUSAO_PRAZO',
    'ADICAO_COMENTARIO',
    'EDICAO_COMENTARIO',
    'EXCLUSAO_COMENTARIO',
    'UPLOAD_ARQUIVO',
    'DOWNLOAD_ARQUIVO'
);


--
-- Name: TipoArquivoAta; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TipoArquivoAta" AS ENUM (
    'DOCUMENTO',
    'IMAGEM',
    'PDF',
    'PLANILHA',
    'OUTRO'
);


--
-- Name: TipoArquivoProcesso; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TipoArquivoProcesso" AS ENUM (
    'IMAGEM',
    'VIDEO',
    'DOCUMENTO',
    'NOTA_FISCAL',
    'PROTOCOLO_FABRICA'
);


--
-- Name: TipoClienteAssociacao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TipoClienteAssociacao" AS ENUM (
    'VENDA',
    'PEDIDO',
    'AMBOS'
);


--
-- Name: TipoComentario; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TipoComentario" AS ENUM (
    'COMENTARIO',
    'SUGESTAO',
    'APROVACAO',
    'REPROVACAO'
);


--
-- Name: TipoEmpresa; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TipoEmpresa" AS ENUM (
    'MATRIZ',
    'FILIAL'
);


--
-- Name: TipoLembrete; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TipoLembrete" AS ENUM (
    'EMAIL',
    'NOTIFICACAO_SISTEMA',
    'AMBOS'
);


--
-- Name: TipoProcesso; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TipoProcesso" AS ENUM (
    'GARANTIA',
    'DEVOLUCAO',
    'RECLAMACAO'
);


--
-- Name: TipoReuniao; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TipoReuniao" AS ENUM (
    'ASSEMBLEIA_GERAL',
    'CONSELHO_DIRETOR',
    'REUNIAO_ORDINARIA',
    'REUNIAO_EXTRAORDINARIA',
    'COMISSAO',
    'OUTRO'
);


--
-- Name: UploadStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UploadStatus" AS ENUM (
    'PROCESSANDO',
    'CONCLUIDO',
    'COM_ALERTAS',
    'CANCELADO'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Alerta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Alerta" (
    id text NOT NULL,
    "uploadId" text NOT NULL,
    "linhaId" text,
    tipo public."AlertaTipo" NOT NULL,
    severidade public."AlertaSeveridade" NOT NULL,
    mensagem text NOT NULL,
    status public."AlertaStatus" DEFAULT 'ABERTO'::public."AlertaStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "resolvedAt" timestamp(3) without time zone
);


--
-- Name: AtaAnexo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AtaAnexo" (
    id text NOT NULL,
    "ataId" text NOT NULL,
    "nomeArquivo" text NOT NULL,
    "urlArquivo" text NOT NULL,
    "tipoArquivo" public."TipoArquivoAta" NOT NULL,
    "tamanhoArquivo" integer,
    "mimeType" text,
    "uploadedBy" text,
    descricao text,
    "uploadedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: AtaComentario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AtaComentario" (
    id text NOT NULL,
    "ataId" text NOT NULL,
    comentario text NOT NULL,
    tipo public."TipoComentario" NOT NULL,
    "autorId" text NOT NULL,
    "comentarioPaiId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: AtaParticipante; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AtaParticipante" (
    id text NOT NULL,
    "ataId" text NOT NULL,
    "usuarioId" text,
    "nomeExterno" text,
    email text,
    cargo text,
    presente boolean DEFAULT true NOT NULL,
    observacoes text
);


--
-- Name: AtaReuniao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AtaReuniao" (
    id text NOT NULL,
    numero text NOT NULL,
    titulo text NOT NULL,
    tipo public."TipoReuniao" NOT NULL,
    "dataReuniao" timestamp(3) without time zone NOT NULL,
    local text,
    status public."StatusAta" DEFAULT 'RASCUNHO'::public."StatusAta" NOT NULL,
    pauta text,
    conteudo text,
    descricao text,
    resumo text,
    pautas jsonb,
    decisoes jsonb,
    acoes jsonb,
    observacoes text,
    "geradoPorIa" boolean,
    "iaUsada" text,
    "modeloIa" text,
    "custoIa" text,
    "tempoProcessamentoIa" integer,
    "arquivoOriginalUrl" text,
    "arquivoOriginalNome" text,
    "arquivoOriginalTipo" text,
    "dataAssinatura" timestamp(3) without time zone,
    "dataRegistro" timestamp(3) without time zone,
    "cartorioRegistro" text,
    "numeroRegistro" text,
    "pendenteAssinatura" boolean DEFAULT false NOT NULL,
    "pendenteRegistro" boolean DEFAULT false NOT NULL,
    "modeloAtaId" text,
    "criadoPor" text NOT NULL,
    "empresaId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: BravoCampoMapeamento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BravoCampoMapeamento" (
    id integer NOT NULL,
    campo_bravo text NOT NULL,
    campo_interno text NOT NULL,
    tipo_transformacao text DEFAULT 'direto'::text NOT NULL,
    ativo boolean DEFAULT true NOT NULL,
    ordem integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: BravoCampoMapeamento_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."BravoCampoMapeamento_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: BravoCampoMapeamento_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."BravoCampoMapeamento_id_seq" OWNED BY public."BravoCampoMapeamento".id;


--
-- Name: BravoSyncConfig; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BravoSyncConfig" (
    id text NOT NULL,
    chave text NOT NULL,
    valor text NOT NULL,
    descricao text,
    tipo text DEFAULT 'string'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: BravoSyncLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BravoSyncLog" (
    id text NOT NULL,
    sync_type text NOT NULL,
    status text DEFAULT 'running'::text NOT NULL,
    status_detalhado text,
    apenas_ativos boolean DEFAULT true NOT NULL,
    limit_requested integer,
    pages_requested integer,
    effective_limit integer,
    current_page integer DEFAULT 1,
    pages_processed integer,
    total_pages_found integer,
    resume_from_page integer,
    total_produtos_bravo integer DEFAULT 0,
    produtos_filtrados integer DEFAULT 0,
    produtos_analisados integer DEFAULT 0,
    produtos_inseridos integer DEFAULT 0,
    produtos_atualizados integer DEFAULT 0,
    produtos_ignorados integer DEFAULT 0,
    produtos_com_erro integer DEFAULT 0,
    taxa_otimizacao text,
    economia_queries integer DEFAULT 0,
    error_message text,
    error_details jsonb,
    tipos_erro jsonb,
    sugestoes_correcao text[],
    tempo_total_segundos integer,
    percentual_sucesso integer,
    triggered_by text,
    user_agent text,
    "userId" text,
    can_resume boolean DEFAULT false NOT NULL,
    sync_details jsonb,
    started_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at timestamp(3) without time zone,
    last_activity_at timestamp(3) without time zone
);


--
-- Name: BravoSyncProgress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."BravoSyncProgress" (
    id text NOT NULL,
    sync_log_id text NOT NULL,
    progress_percentage numeric(5,2) NOT NULL,
    current_step text,
    current_page integer,
    total_pages integer,
    products_processed integer DEFAULT 0,
    products_inserted_current_page integer DEFAULT 0,
    total_produtos_bravo integer,
    estimated_time_remaining text,
    current_product text,
    status_atual text,
    etapa_atual text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ConfiguracaoEmail; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ConfiguracaoEmail" (
    id text NOT NULL,
    nome text NOT NULL,
    host text NOT NULL,
    porta integer NOT NULL,
    autenticar boolean DEFAULT true NOT NULL,
    usuario text NOT NULL,
    senha text NOT NULL,
    "copiasPara" text,
    ativo boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ConfiguracaoModeloNegocio; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ConfiguracaoModeloNegocio" (
    id text NOT NULL,
    "modeloNegocio" public."ModeloNegocio" NOT NULL,
    "modeloNegocioDetalhes" jsonb NOT NULL,
    "contasReceita" jsonb NOT NULL,
    "contasCustos" jsonb NOT NULL,
    "custosCentralizados" boolean NOT NULL,
    descricao text,
    ativo boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "receitasCentralizadas" boolean DEFAULT false NOT NULL
);


--
-- Name: ContaCatalogo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ContaCatalogo" (
    id text NOT NULL,
    classificacao text NOT NULL,
    "nomeConta" text NOT NULL,
    "tipoConta" text NOT NULL,
    nivel integer NOT NULL,
    "primeiraImportacao" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "ultimaImportacao" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status public."ContaStatus" DEFAULT 'ATIVA'::public."ContaStatus" NOT NULL,
    conta text DEFAULT ''::text NOT NULL,
    "subConta" text DEFAULT ''::text NOT NULL
);


--
-- Name: Empresa; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Empresa" (
    id text NOT NULL,
    cnpj text NOT NULL,
    "razaoSocial" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    filial text,
    tipo public."TipoEmpresa" DEFAULT 'MATRIZ'::public."TipoEmpresa" NOT NULL,
    uf text,
    setor text,
    porte public."PorteEmpresa",
    "dataFundacao" timestamp(3) without time zone,
    descricao text,
    website text,
    "modeloNegocio" public."ModeloNegocio",
    "modeloNegocioDetalhes" jsonb,
    "contasReceita" jsonb,
    "custosCentralizados" boolean,
    "contasCustos" jsonb,
    "receitasCentralizadas" boolean
);


--
-- Name: Grupo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Grupo" (
    id text NOT NULL,
    nome text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: HistoricoAndamento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."HistoricoAndamento" (
    id text NOT NULL,
    "ataId" text NOT NULL,
    data timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    acao text NOT NULL,
    descricao text,
    responsavel text,
    "criadoPor" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: LembretePrazo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LembretePrazo" (
    id text NOT NULL,
    "prazoId" text NOT NULL,
    "usuarioId" text NOT NULL,
    tipo public."TipoLembrete" NOT NULL,
    mensagem text NOT NULL,
    enviado boolean DEFAULT false NOT NULL,
    "dataEnvio" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: LinhaUpload; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LinhaUpload" (
    id text NOT NULL,
    "uploadId" text NOT NULL,
    classificacao text NOT NULL,
    conta text NOT NULL,
    "subConta" text,
    "nomeConta" text NOT NULL,
    "tipoConta" text NOT NULL,
    nivel integer NOT NULL,
    titulo boolean NOT NULL,
    estabelecimento boolean NOT NULL,
    "saldoAnterior" numeric(18,2) NOT NULL,
    debito numeric(18,2) NOT NULL,
    credito numeric(18,2) NOT NULL,
    "saldoAtual" numeric(18,2) NOT NULL,
    "hashLinha" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: LogAlteracaoAta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LogAlteracaoAta" (
    id text NOT NULL,
    "ataId" text NOT NULL,
    "usuarioId" text NOT NULL,
    "tipoAlteracao" public."TipoAlteracaoAta" NOT NULL,
    campo text,
    "valorAnterior" text,
    "valorNovo" text,
    descricao text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: LogAuditoria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LogAuditoria" (
    id text NOT NULL,
    recurso text NOT NULL,
    acao text NOT NULL,
    "usuarioId" text NOT NULL,
    dados jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: LogEnvioEmail; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LogEnvioEmail" (
    id text NOT NULL,
    "configuracaoId" text NOT NULL,
    destinatario text NOT NULL,
    assunto text NOT NULL,
    corpo text,
    status public."StatusEnvioEmail" DEFAULT 'PENDENTE'::public."StatusEnvioEmail" NOT NULL,
    erro text,
    tentativas integer DEFAULT 0 NOT NULL,
    "enviadoEm" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Marca; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Marca" (
    id text NOT NULL,
    nome text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ModeloAta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ModeloAta" (
    id text NOT NULL,
    nome text NOT NULL,
    descricao text,
    "tipoReuniao" public."TipoReuniao" NOT NULL,
    estrutura jsonb NOT NULL,
    exemplo jsonb,
    instrucoes text,
    ativo boolean DEFAULT true NOT NULL,
    "criadoPor" text NOT NULL,
    "empresaId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Pedido; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Pedido" (
    id text NOT NULL,
    "numeroPedido" text NOT NULL,
    "idDoc" text,
    "dataPedido" timestamp(3) without time zone NOT NULL,
    "nomeFantasia" text NOT NULL,
    "idProd" text,
    referencia text,
    "descricaoProduto" text,
    marca text,
    grupo text,
    subgrupo text,
    quantidade numeric(18,3) NOT NULL,
    "valorUnitario" numeric(18,2) NOT NULL,
    "valorTotal" numeric(18,2) NOT NULL,
    "empresaId" text,
    "produtoId" text,
    "importacaoLogId" text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: PedidoAnalytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PedidoAnalytics" (
    id text NOT NULL,
    ano integer NOT NULL,
    mes integer NOT NULL,
    "nomeFantasia" text NOT NULL,
    marca text NOT NULL,
    grupo text,
    subgrupo text,
    "empresaId" text,
    "totalValor" numeric(18,2) NOT NULL,
    "totalQuantidade" numeric(18,3) NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: PedidoAnalyticsFilter; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PedidoAnalyticsFilter" (
    id text NOT NULL,
    nome text NOT NULL,
    filters jsonb NOT NULL,
    descricao text,
    "usuarioId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: PedidoColumnMapping; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PedidoColumnMapping" (
    id text NOT NULL,
    nome text NOT NULL,
    "columnMapping" jsonb NOT NULL,
    filters jsonb,
    descricao text,
    "usuarioId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: PedidoImportacaoLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PedidoImportacaoLog" (
    id text NOT NULL,
    "nomeArquivo" text NOT NULL,
    "mappingName" text,
    "totalLinhas" integer NOT NULL,
    "sucessoCount" integer DEFAULT 0 NOT NULL,
    "erroCount" integer DEFAULT 0 NOT NULL,
    "produtosNaoEncontrados" integer DEFAULT 0 NOT NULL,
    "duplicatasCount" integer DEFAULT 0 NOT NULL,
    "novosCount" integer DEFAULT 0 NOT NULL,
    progresso integer DEFAULT 0 NOT NULL,
    "linhasProcessadas" integer DEFAULT 0 NOT NULL,
    "usuarioEmail" text NOT NULL,
    "usuarioId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: PrazoAcao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PrazoAcao" (
    id text NOT NULL,
    "ataId" text NOT NULL,
    "acaoId" text,
    titulo text NOT NULL,
    descricao text,
    "dataPrazo" timestamp(3) without time zone NOT NULL,
    "dataConclusao" timestamp(3) without time zone,
    status public."StatusPrazo" DEFAULT 'PENDENTE'::public."StatusPrazo" NOT NULL,
    concluido boolean DEFAULT false NOT NULL,
    "lembretesEnviados" integer DEFAULT 0 NOT NULL,
    "ultimoLembrete" timestamp(3) without time zone,
    "criadoPor" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: PreferenciaNotificacao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PreferenciaNotificacao" (
    id text NOT NULL,
    "usuarioId" text NOT NULL,
    "emailAtivo" boolean DEFAULT true NOT NULL,
    "sistemaAtivo" boolean DEFAULT true NOT NULL,
    "pushAtivo" boolean DEFAULT false NOT NULL,
    "lembrete3Dias" boolean DEFAULT true NOT NULL,
    "lembrete1Dia" boolean DEFAULT true NOT NULL,
    "lembreteHoje" boolean DEFAULT true NOT NULL,
    "lembreteVencido" boolean DEFAULT true NOT NULL,
    "horarioInicio" text DEFAULT '08:00'::text NOT NULL,
    "horarioFim" text DEFAULT '18:00'::text NOT NULL,
    "diasSemana" text[] DEFAULT ARRAY['segunda'::text, 'terca'::text, 'quarta'::text, 'quinta'::text, 'sexta'::text],
    "notificarPrazos" boolean DEFAULT true NOT NULL,
    "notificarHistorico" boolean DEFAULT false NOT NULL,
    "notificarComentarios" boolean DEFAULT false NOT NULL,
    "notificarStatus" boolean DEFAULT true NOT NULL,
    "resumoDiario" boolean DEFAULT false NOT NULL,
    "resumoSemanal" boolean DEFAULT true NOT NULL,
    "diaResumoSemanal" text DEFAULT 'segunda'::text NOT NULL,
    "horarioResumoSemanal" text DEFAULT '09:00'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Processo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Processo" (
    id text NOT NULL,
    "numeroControle" text NOT NULL,
    protocolo text NOT NULL,
    "userId" text NOT NULL,
    "empresaId" text,
    tipo public."TipoProcesso" NOT NULL,
    situacao public."SituacaoProcesso" DEFAULT 'AGUARDANDO_ANALISE'::public."SituacaoProcesso" NOT NULL,
    "nomeClienteAssociado" text NOT NULL,
    "razaoSocial" text NOT NULL,
    titulo text,
    descricao text,
    categoria public."CategoriaReclamacao",
    prioridade public."PrioridadeProcesso",
    "contatoRetorno" text,
    uf text,
    cidade text,
    fabrica text,
    importacao text,
    ano text,
    reclamacao text,
    responsavel text,
    "prazoResolucao" timestamp(3) without time zone,
    "dataSolucao" timestamp(3) without time zone,
    comentarios text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ProcessoAnexo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProcessoAnexo" (
    id text NOT NULL,
    "processoId" text NOT NULL,
    "nomeArquivo" text NOT NULL,
    "urlArquivo" text NOT NULL,
    "tipoArquivo" public."TipoArquivoProcesso" NOT NULL,
    "tamanhoArquivo" integer,
    "mimeType" text,
    "uploadedBy" text,
    metadata jsonb,
    "uploadedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ProcessoHistorico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProcessoHistorico" (
    id text NOT NULL,
    "processoId" text NOT NULL,
    acao text NOT NULL,
    descricao text NOT NULL,
    "usuarioId" text,
    "usuarioNome" text,
    "dadosAnteriores" jsonb,
    "dadosNovos" jsonb,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ProcessoItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProcessoItem" (
    id text NOT NULL,
    "processoId" text NOT NULL,
    nf text NOT NULL,
    referencia text NOT NULL,
    "descricaoProduto" text,
    qtd integer NOT NULL,
    "valorUnit" numeric(18,2) NOT NULL,
    detalhes text NOT NULL,
    marca text,
    "dataInstalacao" timestamp(3) without time zone,
    "dataRemocao" timestamp(3) without time zone,
    "kmInstalacao" text,
    "kmRemocao" text,
    "modeloVeiculo" text,
    "anoVeiculo" text,
    "marcaVeiculo" text,
    "temCustoGarantia" boolean DEFAULT false NOT NULL,
    "valorCusto" numeric(18,2),
    "infoPecas" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Produto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Produto" (
    id text NOT NULL,
    referencia text NOT NULL,
    id_prod text,
    descricao text,
    marca text,
    grupo text,
    subgrupo text,
    ativo boolean DEFAULT true NOT NULL,
    gtin text,
    ncm text,
    cest text,
    "dataUltModif" timestamp(3) without time zone,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: PushSubscription; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PushSubscription" (
    id text NOT NULL,
    "usuarioId" text NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    "userAgent" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ResumoEconomico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ResumoEconomico" (
    id text NOT NULL,
    titulo text NOT NULL,
    periodo text NOT NULL,
    mes integer,
    ano integer NOT NULL,
    "empresaId" text,
    "uploadId" text,
    "tipoAnalise" text NOT NULL,
    parametros jsonb NOT NULL,
    resultado jsonb NOT NULL,
    "modeloIA" text NOT NULL,
    status public."ResumoStatus" DEFAULT 'PROCESSANDO'::public."ResumoStatus" NOT NULL,
    "criadoPor" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Subgrupo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Subgrupo" (
    id text NOT NULL,
    nome text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TemplateImportacao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TemplateImportacao" (
    id text NOT NULL,
    "empresaId" text,
    nome text NOT NULL,
    descricao text,
    configuracao jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Upload; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Upload" (
    id text NOT NULL,
    "templateId" text,
    mes integer NOT NULL,
    ano integer NOT NULL,
    "arquivoUrl" text NOT NULL,
    "hashArquivo" text NOT NULL,
    status public."UploadStatus" DEFAULT 'PROCESSANDO'::public."UploadStatus" NOT NULL,
    "totalLinhas" integer NOT NULL,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "empresaId" text NOT NULL,
    "nomeArquivo" text NOT NULL
);


--
-- Name: Usuario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Usuario" (
    id text NOT NULL,
    email text NOT NULL,
    senha text NOT NULL,
    nome text NOT NULL,
    roles text[] DEFAULT ARRAY['user'::text],
    "empresaId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    departamento public."Departamento",
    ativo boolean DEFAULT true NOT NULL,
    "ultimoAcesso" timestamp(3) without time zone
);


--
-- Name: UsuarioCliente; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."UsuarioCliente" (
    id text NOT NULL,
    "usuarioId" text NOT NULL,
    "nomeFantasia" text NOT NULL,
    "tipoCliente" public."TipoClienteAssociacao" NOT NULL,
    permissoes jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdBy" text
);


--
-- Name: Venda; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Venda" (
    id text NOT NULL,
    nfe text NOT NULL,
    "idDoc" text,
    "dataVenda" timestamp(3) without time zone NOT NULL,
    "razaoSocial" text NOT NULL,
    "nomeFantasia" text,
    "cnpjCliente" text,
    "ufDestino" text,
    "ufOrigem" text,
    "idProd" text,
    referencia text,
    "prodCodMestre" text,
    "descricaoProduto" text,
    marca text,
    grupo text,
    subgrupo text,
    "tipoOperacao" text,
    quantidade numeric(18,3) NOT NULL,
    "valorUnitario" numeric(18,2) NOT NULL,
    "valorTotal" numeric(18,2) NOT NULL,
    "empresaId" text,
    "produtoId" text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "importacaoLogId" text
);


--
-- Name: VendaAnalytics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VendaAnalytics" (
    id text NOT NULL,
    ano integer NOT NULL,
    mes integer NOT NULL,
    "nomeFantasia" text NOT NULL,
    marca text NOT NULL,
    grupo text,
    subgrupo text,
    uf text NOT NULL,
    "totalValor" numeric(18,2) NOT NULL,
    "totalQuantidade" numeric(18,3) NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "empresaId" text,
    "tipoOperacao" text
);


--
-- Name: VendaAnalyticsFilter; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VendaAnalyticsFilter" (
    id text NOT NULL,
    nome text NOT NULL,
    filters jsonb NOT NULL,
    descricao text,
    "usuarioId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: VendaColumnMapping; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VendaColumnMapping" (
    id text NOT NULL,
    nome text NOT NULL,
    "columnMapping" jsonb NOT NULL,
    filters jsonb,
    descricao text,
    "usuarioId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: VendaImportacaoLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."VendaImportacaoLog" (
    id text NOT NULL,
    "nomeArquivo" text NOT NULL,
    "mappingName" text,
    "totalLinhas" integer NOT NULL,
    "sucessoCount" integer DEFAULT 0 NOT NULL,
    "erroCount" integer DEFAULT 0 NOT NULL,
    "produtosNaoEncontrados" integer DEFAULT 0 NOT NULL,
    "usuarioEmail" text NOT NULL,
    "usuarioId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "duplicatasCount" integer DEFAULT 0 NOT NULL,
    "novosCount" integer DEFAULT 0 NOT NULL,
    progresso integer DEFAULT 0 NOT NULL,
    "linhasProcessadas" integer DEFAULT 0 NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: BravoCampoMapeamento id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BravoCampoMapeamento" ALTER COLUMN id SET DEFAULT nextval('public."BravoCampoMapeamento_id_seq"'::regclass);


--
-- Data for Name: Alerta; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Alerta" (id, "uploadId", "linhaId", tipo, severidade, mensagem, status, "createdAt", "resolvedAt") FROM stdin;
\.


--
-- Data for Name: AtaAnexo; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AtaAnexo" (id, "ataId", "nomeArquivo", "urlArquivo", "tipoArquivo", "tamanhoArquivo", "mimeType", "uploadedBy", descricao, "uploadedAt") FROM stdin;
\.


--
-- Data for Name: AtaComentario; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AtaComentario" (id, "ataId", comentario, tipo, "autorId", "comentarioPaiId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AtaParticipante; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AtaParticipante" (id, "ataId", "usuarioId", "nomeExterno", email, cargo, presente, observacoes) FROM stdin;
\.


--
-- Data for Name: AtaReuniao; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AtaReuniao" (id, numero, titulo, tipo, "dataReuniao", local, status, pauta, conteudo, descricao, resumo, pautas, decisoes, acoes, observacoes, "geradoPorIa", "iaUsada", "modeloIa", "custoIa", "tempoProcessamentoIa", "arquivoOriginalUrl", "arquivoOriginalNome", "arquivoOriginalTipo", "dataAssinatura", "dataRegistro", "cartorioRegistro", "numeroRegistro", "pendenteAssinatura", "pendenteRegistro", "modeloAtaId", "criadoPor", "empresaId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: BravoCampoMapeamento; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BravoCampoMapeamento" (id, campo_bravo, campo_interno, tipo_transformacao, ativo, ordem, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: BravoSyncConfig; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BravoSyncConfig" (id, chave, valor, descricao, tipo, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: BravoSyncLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BravoSyncLog" (id, sync_type, status, status_detalhado, apenas_ativos, limit_requested, pages_requested, effective_limit, current_page, pages_processed, total_pages_found, resume_from_page, total_produtos_bravo, produtos_filtrados, produtos_analisados, produtos_inseridos, produtos_atualizados, produtos_ignorados, produtos_com_erro, taxa_otimizacao, economia_queries, error_message, error_details, tipos_erro, sugestoes_correcao, tempo_total_segundos, percentual_sucesso, triggered_by, user_agent, "userId", can_resume, sync_details, started_at, completed_at, last_activity_at) FROM stdin;
\.


--
-- Data for Name: BravoSyncProgress; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."BravoSyncProgress" (id, sync_log_id, progress_percentage, current_step, current_page, total_pages, products_processed, products_inserted_current_page, total_produtos_bravo, estimated_time_remaining, current_product, status_atual, etapa_atual, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ConfiguracaoEmail; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ConfiguracaoEmail" (id, nome, host, porta, autenticar, usuario, senha, "copiasPara", ativo, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ConfiguracaoModeloNegocio; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ConfiguracaoModeloNegocio" (id, "modeloNegocio", "modeloNegocioDetalhes", "contasReceita", "contasCustos", "custosCentralizados", descricao, ativo, "createdAt", "updatedAt", "receitasCentralizadas") FROM stdin;
\.


--
-- Data for Name: ContaCatalogo; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ContaCatalogo" (id, classificacao, "nomeConta", "tipoConta", nivel, "primeiraImportacao", "ultimaImportacao", status, conta, "subConta") FROM stdin;
\.


--
-- Data for Name: Empresa; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Empresa" (id, cnpj, "razaoSocial", "createdAt", "updatedAt", filial, tipo, uf, setor, porte, "dataFundacao", descricao, website, "modeloNegocio", "modeloNegocioDetalhes", "contasReceita", "custosCentralizados", "contasCustos", "receitasCentralizadas") FROM stdin;
\.


--
-- Data for Name: Grupo; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Grupo" (id, nome, "createdAt") FROM stdin;
\.


--
-- Data for Name: HistoricoAndamento; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."HistoricoAndamento" (id, "ataId", data, acao, descricao, responsavel, "criadoPor", "createdAt") FROM stdin;
\.


--
-- Data for Name: LembretePrazo; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LembretePrazo" (id, "prazoId", "usuarioId", tipo, mensagem, enviado, "dataEnvio", "createdAt") FROM stdin;
\.


--
-- Data for Name: LinhaUpload; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LinhaUpload" (id, "uploadId", classificacao, conta, "subConta", "nomeConta", "tipoConta", nivel, titulo, estabelecimento, "saldoAnterior", debito, credito, "saldoAtual", "hashLinha", "createdAt") FROM stdin;
\.


--
-- Data for Name: LogAlteracaoAta; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LogAlteracaoAta" (id, "ataId", "usuarioId", "tipoAlteracao", campo, "valorAnterior", "valorNovo", descricao, metadata, "createdAt") FROM stdin;
\.


--
-- Data for Name: LogAuditoria; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LogAuditoria" (id, recurso, acao, "usuarioId", dados, "createdAt") FROM stdin;
\.


--
-- Data for Name: LogEnvioEmail; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LogEnvioEmail" (id, "configuracaoId", destinatario, assunto, corpo, status, erro, tentativas, "enviadoEm", "createdAt") FROM stdin;
\.


--
-- Data for Name: Marca; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Marca" (id, nome, "createdAt") FROM stdin;
\.


--
-- Data for Name: ModeloAta; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ModeloAta" (id, nome, descricao, "tipoReuniao", estrutura, exemplo, instrucoes, ativo, "criadoPor", "empresaId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Pedido; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Pedido" (id, "numeroPedido", "idDoc", "dataPedido", "nomeFantasia", "idProd", referencia, "descricaoProduto", marca, grupo, subgrupo, quantidade, "valorUnitario", "valorTotal", "empresaId", "produtoId", "importacaoLogId", metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PedidoAnalytics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PedidoAnalytics" (id, ano, mes, "nomeFantasia", marca, grupo, subgrupo, "empresaId", "totalValor", "totalQuantidade", "updatedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: PedidoAnalyticsFilter; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PedidoAnalyticsFilter" (id, nome, filters, descricao, "usuarioId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PedidoColumnMapping; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PedidoColumnMapping" (id, nome, "columnMapping", filters, descricao, "usuarioId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PedidoImportacaoLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PedidoImportacaoLog" (id, "nomeArquivo", "mappingName", "totalLinhas", "sucessoCount", "erroCount", "produtosNaoEncontrados", "duplicatasCount", "novosCount", progresso, "linhasProcessadas", "usuarioEmail", "usuarioId", "createdAt") FROM stdin;
\.


--
-- Data for Name: PrazoAcao; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PrazoAcao" (id, "ataId", "acaoId", titulo, descricao, "dataPrazo", "dataConclusao", status, concluido, "lembretesEnviados", "ultimoLembrete", "criadoPor", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PreferenciaNotificacao; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PreferenciaNotificacao" (id, "usuarioId", "emailAtivo", "sistemaAtivo", "pushAtivo", "lembrete3Dias", "lembrete1Dia", "lembreteHoje", "lembreteVencido", "horarioInicio", "horarioFim", "diasSemana", "notificarPrazos", "notificarHistorico", "notificarComentarios", "notificarStatus", "resumoDiario", "resumoSemanal", "diaResumoSemanal", "horarioResumoSemanal", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Processo; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Processo" (id, "numeroControle", protocolo, "userId", "empresaId", tipo, situacao, "nomeClienteAssociado", "razaoSocial", titulo, descricao, categoria, prioridade, "contatoRetorno", uf, cidade, fabrica, importacao, ano, reclamacao, responsavel, "prazoResolucao", "dataSolucao", comentarios, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ProcessoAnexo; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProcessoAnexo" (id, "processoId", "nomeArquivo", "urlArquivo", "tipoArquivo", "tamanhoArquivo", "mimeType", "uploadedBy", metadata, "uploadedAt") FROM stdin;
\.


--
-- Data for Name: ProcessoHistorico; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProcessoHistorico" (id, "processoId", acao, descricao, "usuarioId", "usuarioNome", "dadosAnteriores", "dadosNovos", metadata, "createdAt") FROM stdin;
\.


--
-- Data for Name: ProcessoItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProcessoItem" (id, "processoId", nf, referencia, "descricaoProduto", qtd, "valorUnit", detalhes, marca, "dataInstalacao", "dataRemocao", "kmInstalacao", "kmRemocao", "modeloVeiculo", "anoVeiculo", "marcaVeiculo", "temCustoGarantia", "valorCusto", "infoPecas", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Produto; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Produto" (id, referencia, id_prod, descricao, marca, grupo, subgrupo, ativo, gtin, ncm, cest, "dataUltModif", metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PushSubscription; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PushSubscription" (id, "usuarioId", endpoint, p256dh, auth, "userAgent", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ResumoEconomico; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ResumoEconomico" (id, titulo, periodo, mes, ano, "empresaId", "uploadId", "tipoAnalise", parametros, resultado, "modeloIA", status, "criadoPor", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Subgrupo; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Subgrupo" (id, nome, "createdAt") FROM stdin;
\.


--
-- Data for Name: TemplateImportacao; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TemplateImportacao" (id, "empresaId", nome, descricao, configuracao, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Upload; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Upload" (id, "templateId", mes, ano, "arquivoUrl", "hashArquivo", status, "totalLinhas", "createdBy", "createdAt", "updatedAt", "empresaId", "nomeArquivo") FROM stdin;
\.


--
-- Data for Name: Usuario; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Usuario" (id, email, senha, nome, roles, "empresaId", "createdAt", "updatedAt", departamento, ativo, "ultimoAcesso") FROM stdin;
\.


--
-- Data for Name: UsuarioCliente; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."UsuarioCliente" (id, "usuarioId", "nomeFantasia", "tipoCliente", permissoes, "createdAt", "updatedAt", "createdBy") FROM stdin;
\.


--
-- Data for Name: Venda; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Venda" (id, nfe, "idDoc", "dataVenda", "razaoSocial", "nomeFantasia", "cnpjCliente", "ufDestino", "ufOrigem", "idProd", referencia, "prodCodMestre", "descricaoProduto", marca, grupo, subgrupo, "tipoOperacao", quantidade, "valorUnitario", "valorTotal", "empresaId", "produtoId", metadata, "createdAt", "updatedAt", "importacaoLogId") FROM stdin;
\.


--
-- Data for Name: VendaAnalytics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."VendaAnalytics" (id, ano, mes, "nomeFantasia", marca, grupo, subgrupo, uf, "totalValor", "totalQuantidade", "updatedAt", "createdAt", "empresaId", "tipoOperacao") FROM stdin;
\.


--
-- Data for Name: VendaAnalyticsFilter; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."VendaAnalyticsFilter" (id, nome, filters, descricao, "usuarioId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: VendaColumnMapping; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."VendaColumnMapping" (id, nome, "columnMapping", filters, descricao, "usuarioId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: VendaImportacaoLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."VendaImportacaoLog" (id, "nomeArquivo", "mappingName", "totalLinhas", "sucessoCount", "erroCount", "produtosNaoEncontrados", "usuarioEmail", "usuarioId", "createdAt", "duplicatasCount", "novosCount", progresso, "linhasProcessadas") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
044c6565-7212-4f4f-82c0-2c06015702ba	0e1302d2c213e7329fae7da12dc458c3b12bf61d9f2e6a7da0ea6ebb981cc5af	2025-12-23 16:04:59.623861+00	20251113173742_add_faturamento_departamento	\N	\N	2025-12-23 16:04:59.604662+00	1
223b2acc-6566-4b47-b16d-0e248112ed60	b058fbc3a578f6325e79918eabc4395414d32d7a62be3c2de823198174dad42b	2025-12-23 16:04:59.498656+00	20251112201656_economico	\N	\N	2025-12-23 16:04:59.18576+00	1
8caf3a3f-5f3a-4a38-b034-59d0475083bb	243a3842bdf44189ea14327959f131fe0636b976d76d0bb7bb05de38a8de2d0f	2025-12-23 16:04:59.568816+00	20251113172609_add_usuario_model	\N	\N	2025-12-23 16:04:59.5049+00	1
72441127-e87b-483e-95d7-e61a9ea0a888	0c5177e335d9acfb1acc840a05d2baf30239049b0007aeec90c9b614e1b225f4	2025-12-23 16:04:59.810491+00	20251114120638_add_global_templates	\N	\N	2025-12-23 16:04:59.791182+00	1
9a29e1c7-d361-45b8-bdd4-3fa458f249cd	0ad2dd3c536683510867545599161979c30079e9e6497b8ec9884976c6487ca9	2025-12-23 16:04:59.597445+00	20251113173652_add_departamento_to_usuario	\N	\N	2025-12-23 16:04:59.57615+00	1
5a53cf94-ed7e-436f-b1d1-280c3b690342	36b1d19e1cb7871d74537aebc1a44e5529e6d3bb93ddd3f3917845cefcd41e3b	2025-12-23 16:04:59.66131+00	20251113190828_add_nome_fantasia_and_codigo_int	\N	\N	2025-12-23 16:04:59.631287+00	1
2ebf5b03-9774-46df-8601-f0ddbd0f48f3	2c982b64360f7575c32583e16af0f3ab99fddd6270e0feefc233e2e24fb93399	2025-12-23 16:04:59.692093+00	20251113191625_add_tipo_empresa	\N	\N	2025-12-23 16:04:59.669219+00	1
49c8b591-b9fb-4209-a3fe-0a4da397cee8	1ea369d11250d825b60649623ab47942c935d90fbfff936f5dd3779fad954133	2025-12-23 16:04:59.784578+00	20251113201922_remove_filial_table	\N	\N	2025-12-23 16:04:59.69962+00	1
66d83a34-dfdc-4541-ad5a-2a122c347238	20fee56145d9b68ba4ea39f818e0968323ea2112ba04531851c23059a3e299a2	2025-12-23 16:04:59.837314+00	20251114122046_add_cabecalho_alterado_alert	\N	\N	2025-12-23 16:04:59.818366+00	1
15d5cf0b-2146-40ea-9e43-2c646ac5f083	68f55a969d8752ffb32e78c660113077e748c87a1b1927e59ef757369910dae8	2025-12-23 16:04:59.892604+00	20251114140813_unificar_catalogo_contas	\N	\N	2025-12-23 16:04:59.843817+00	1
bba0c8ec-2548-4180-adf3-eb50faf7d111	370971164a684bf8ed821045ab6286ad15aaceab6fd0c4d55ec6de3aa2fb6e91	\N	20251206000000_add_empresa_id_to_venda_analytics	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20251206000000_add_empresa_id_to_venda_analytics\n\nDatabase error code: 42P01\n\nDatabase error:\nERROR: relation "VendaAnalytics" does not exist\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P01), message: "relation \\"VendaAnalytics\\" does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("namespace.c"), line: Some(434), routine: Some("RangeVarGetRelidExtended") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20251206000000_add_empresa_id_to_venda_analytics"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20251206000000_add_empresa_id_to_venda_analytics"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:260	2025-12-23 16:13:45.322206+00	2025-12-23 16:12:33.800772+00	0
adacad08-7cde-4de4-838e-15a1a61db47b	2ece042a2bf439e1d8d5af7f218975fe53fe34efad32fd61eecafb4e4c7c200a	\N	20251205000000_add_preferencias_push_logs	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20251205000000_add_preferencias_push_logs\n\nDatabase error code: 42P01\n\nDatabase error:\nERROR: relation "AtaReuniao" does not exist\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P01), message: "relation \\"AtaReuniao\\" does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("namespace.c"), line: Some(434), routine: Some("RangeVarGetRelidExtended") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20251205000000_add_preferencias_push_logs"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20251205000000_add_preferencias_push_logs"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:260	2025-12-23 16:12:02.196606+00	2025-12-23 16:11:07.338141+00	0
0f31dd51-b935-4790-ac50-9dc209203066	2ece042a2bf439e1d8d5af7f218975fe53fe34efad32fd61eecafb4e4c7c200a	\N	20251205000000_add_preferencias_push_logs	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20251205000000_add_preferencias_push_logs\n\nDatabase error code: 42P01\n\nDatabase error:\nERROR: relation "AtaReuniao" does not exist\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P01), message: "relation \\"AtaReuniao\\" does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("namespace.c"), line: Some(434), routine: Some("RangeVarGetRelidExtended") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20251205000000_add_preferencias_push_logs"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20251205000000_add_preferencias_push_logs"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:260	2025-12-23 16:10:54.11108+00	2025-12-23 16:07:56.068763+00	0
484df13b-4b83-42ad-bf5b-1d7d1428add2	1494464dd27882a86316e6d407c63dc79727cc383d2d7a59f7a16af8fa2e785b	2025-12-23 16:12:33.775915+00	20251205000000_add_preferencias_push_logs	\N	\N	2025-12-23 16:12:33.571013+00	1
5ae19ba6-4f28-4d70-995d-ac740fc391e0	392257ee255025ceab54f4a6889c3b258dd966432e6259d95b7f20c84016447b	2025-12-23 16:12:33.79632+00	20251205120000_rename_nome_fantasia_to_filial_empresa	\N	\N	2025-12-23 16:12:33.780243+00	1
8ba930b1-cb8a-4b21-b4c6-2eb108d4f890	c897a33a436044a3f0b238c873bb32ca42f3ebef3af269d7512921deb412a823	\N	20251122000000_add_vendas_tables	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20251122000000_add_vendas_tables\n\nDatabase error code: 42P01\n\nDatabase error:\nERROR: relation "Produto" does not exist\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P01), message: "relation \\"Produto\\" does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("namespace.c"), line: Some(434), routine: Some("RangeVarGetRelidExtended") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20251122000000_add_vendas_tables"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20251122000000_add_vendas_tables"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:260	2025-12-23 16:14:40.741102+00	2025-12-23 16:14:03.581328+00	0
f0773283-cf17-435c-b595-2063db7ad00e	370971164a684bf8ed821045ab6286ad15aaceab6fd0c4d55ec6de3aa2fb6e91	\N	20251206000000_add_empresa_id_to_venda_analytics	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20251206000000_add_empresa_id_to_venda_analytics\n\nDatabase error code: 42P01\n\nDatabase error:\nERROR: relation "VendaAnalytics" does not exist\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P01), message: "relation \\"VendaAnalytics\\" does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("namespace.c"), line: Some(434), routine: Some("RangeVarGetRelidExtended") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20251206000000_add_empresa_id_to_venda_analytics"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20251206000000_add_empresa_id_to_venda_analytics"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:260	2025-12-23 16:17:53.031706+00	2025-12-23 16:15:06.386181+00	0
3e8901c8-46c8-4ef1-8f2c-b1cacd5d9bd2	cc0c1050ef574154fa89002fa001eab578033c52dad1f598e564f5513e3319f6	2025-12-23 16:19:01.365863+00	20251218130000_rename_nomeConta_to_nome_in_conta_catalogo	\N	\N	2025-12-23 16:19:01.344836+00	1
19c18e13-2003-4739-b5ea-0ff2e7e43a62	18a1bfb00a9411743cbd5905ec6f7e5b41dfb3d9df799c5cc68fcf69f0e6808d	\N	20251208240000_add_duplicatas_novos_to_import_log	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20251208240000_add_duplicatas_novos_to_import_log\n\nDatabase error code: 42P01\n\nDatabase error:\nERROR: relation "VendaImportacaoLog" does not exist\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P01), message: "relation \\"VendaImportacaoLog\\" does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("namespace.c"), line: Some(434), routine: Some("RangeVarGetRelidExtended") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20251208240000_add_duplicatas_novos_to_import_log"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20251208240000_add_duplicatas_novos_to_import_log"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:260	2025-12-23 16:18:42.070825+00	2025-12-23 16:18:13.782417+00	0
e99e2b8a-ea4a-4ffa-9567-7cf830a6d830	69f2969e385f562148fc02336759557c97cc1d5983a216a38984207e9def4e4e	2025-12-23 16:19:01.193618+00	20251215130000_add_uf_to_empresa	\N	\N	2025-12-23 16:19:01.153182+00	1
07f5892c-1e04-4dc2-9c16-77cae2d01f7a	ae589e4ad0622b9ddee70240398cba25ab1ddc3b7c889b3c4efdcc8febc648ad	2025-12-23 16:19:01.227103+00	20251215140000_add_continuidade_temporal_alerta	\N	\N	2025-12-23 16:19:01.201845+00	1
2a86d3e0-04e3-451f-88b0-a74f98c42027	72242f6e7793ab7a59763932af7b8b6128dec33684bad5d21b5fd8bdce62073b	2025-12-23 16:19:01.41818+00	20251218140000_rename_conta_fields_in_conta_catalogo	\N	\N	2025-12-23 16:19:01.37431+00	1
0d8a5e61-b5a1-45e9-856d-b0e50eb309fb	bc05eae6567acff8ef74dad737aed3f8dd3e8d596fa10c2ec05a5d6664ecf8f9	2025-12-23 16:19:01.267662+00	20251217150000_add_nome_arquivo_to_upload	\N	\N	2025-12-23 16:19:01.235881+00	1
c1c48860-b4bf-4fcf-9eab-1e5d6b407c3b	82c88a16fd01c2912ad4f2968f868779f73ee831f84312d1867d35c719f0abc1	2025-12-23 16:19:01.337474+00	20251218120000_add_composite_key_to_conta_catalogo	\N	\N	2025-12-23 16:19:01.276069+00	1
58cd14d5-5d22-45fd-83c9-c13f06a724f4	a2d47c287490e896e24c24e7ff2cbef5d58d4690a00d72d1b7442d809e0c00bb	2025-12-23 16:19:01.453086+00	20251218150000_migrate_conta_catalogo_data	\N	\N	2025-12-23 16:19:01.425099+00	1
fe01bded-9707-4cce-9a4b-9998edd55331	aac5ba40fcf107a49d5e01a38ec36f9df42a27f3129ef053920ed5ea6da36ec4	\N	20251218160000_rename_conta_catalogo_fields_final	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20251218160000_rename_conta_catalogo_fields_final\n\nDatabase error code: 42701\n\nDatabase error:\nERROR: column "conta" of relation "ContaCatalogo" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42701), message: "column \\"conta\\" of relation \\"ContaCatalogo\\" already exists", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("tablecmds.c"), line: Some(7347), routine: Some("check_for_column_name_collision") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20251218160000_rename_conta_catalogo_fields_final"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20251218160000_rename_conta_catalogo_fields_final"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:260	2025-12-23 16:19:42.291331+00	2025-12-23 16:19:01.460032+00	0
6f188d19-9a9c-4591-a2de-25ce2f6e3840	370971164a684bf8ed821045ab6286ad15aaceab6fd0c4d55ec6de3aa2fb6e91	\N	20251222130000_add_empresa_id_to_venda_analytics	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20251222130000_add_empresa_id_to_venda_analytics\n\nDatabase error code: 42703\n\nDatabase error:\nERROR: column "tipoOperacao" named in key does not exist\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42703), message: "column \\"tipoOperacao\\" named in key does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("indexcmds.c"), line: Some(1886), routine: Some("ComputeIndexAttrs") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20251222130000_add_empresa_id_to_venda_analytics"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20251222130000_add_empresa_id_to_venda_analytics"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:260	2025-12-23 16:23:23.855637+00	2025-12-23 16:22:03.776543+00	0
f8852526-19b3-48d9-8f50-6f04ee1281c5	c6ca19758e16779e1fe3ad696d0d50aae8f40fb5df73f74c0d1c9b080c7b20a1	\N	20251218160000_rename_conta_catalogo_fields_final	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20251218160000_rename_conta_catalogo_fields_final\n\nDatabase error code: 42701\n\nDatabase error:\nERROR: column "conta" of relation "ContaCatalogo" already exists\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42701), message: "column \\"conta\\" of relation \\"ContaCatalogo\\" already exists", detail: None, hint: None, position: None, where_: Some("SQL statement \\"ALTER TABLE \\"ContaCatalogo\\" RENAME COLUMN \\"numeroConta\\" TO \\"conta\\"\\"\\nPL/pgSQL function inline_code_block line 4 at SQL statement"), schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("tablecmds.c"), line: Some(7347), routine: Some("check_for_column_name_collision") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20251218160000_rename_conta_catalogo_fields_final"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20251218160000_rename_conta_catalogo_fields_final"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:260	2025-12-23 16:21:47.688068+00	2025-12-23 16:20:12.048112+00	0
b8c545c5-9967-4c49-97e5-dbeb88a00733	bc1f2c4a264e202f792a4ca62df35d16f74e535d4ead47df23b7b46f458eb5bb	2025-12-23 16:22:03.416746+00	20251222000000_add_bravo_erp_module	\N	\N	2025-12-23 16:22:03.000271+00	1
9832f409-8428-48db-8ef4-3f3b21e76640	a67ac34d486dffa4de243131f5fa7a8ac45cd69b9b48882ecc4970dc13e06d64	2025-12-23 16:22:02.763661+00	20251218160000_rename_conta_catalogo_fields_final	\N	\N	2025-12-23 16:22:02.589916+00	1
a5be8775-7510-4938-9486-bc22dbddd6cb	815f9d183ce33ed7d6add45b2c107f3e8aa28b8c30609dc5bf65fd9e79930fa9	2025-12-23 16:22:02.888363+00	20251219200000_add_resumo_economico	\N	\N	2025-12-23 16:22:02.770406+00	1
3602639d-2ac2-4eae-bb85-edb91970adf0	b93cd5b5285f9fb590bb10b4efef696c71c5551eaf68b73e802bdb5799e6b3f0	2025-12-23 16:22:02.963007+00	20251220000000_add_empresa_contexto_ia	\N	\N	2025-12-23 16:22:02.895354+00	1
e39487aa-379f-4b48-8cb9-2353d1482f63	c897a33a436044a3f0b238c873bb32ca42f3ebef3af269d7512921deb412a823	2025-12-23 16:22:03.738235+00	20251222120000_add_vendas_tables	\N	\N	2025-12-23 16:22:03.424251+00	1
d791b491-025b-4d18-b341-7dd2c2486ce6	740359763bb0a29f5976b21e11705586c3c8c118500e6d44f1ce811ac76ef79a	2025-12-23 16:22:02.993126+00	20251221180000_add_receitas_centralizadas	\N	\N	2025-12-23 16:22:02.970886+00	1
b7c7dbb7-bb0e-42e0-8f23-b74fbb007d1c	18a1bfb00a9411743cbd5905ec6f7e5b41dfb3d9df799c5cc68fcf69f0e6808d	2025-12-23 16:22:03.769106+00	20251222125000_add_duplicatas_novos_to_import_log	\N	\N	2025-12-23 16:22:03.744348+00	1
2802b2ad-4ca2-4d38-b741-3d6a3d88749d	760f9a553a7cc512138329101f46f197b1338db2418502e3e55cde5ab309c22e	2025-12-23 16:24:03.755575+00	20251222130000_add_empresa_id_to_venda_analytics	\N	\N	2025-12-23 16:24:03.652161+00	1
21f18a71-cf6d-4bfc-9327-e2d302480570	cd03a7390928b030b641749cf7f90fcefc4d799f514466ec1a78242c9adfa859	\N	20251222131000_fix_venda_analytics_unique_constraint	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20251222131000_fix_venda_analytics_unique_constraint\n\nDatabase error code: 42703\n\nDatabase error:\nERROR: column "tipoOperacao" named in key does not exist\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42703), message: "column \\"tipoOperacao\\" named in key does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("indexcmds.c"), line: Some(1886), routine: Some("ComputeIndexAttrs") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20251222131000_fix_venda_analytics_unique_constraint"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20251222131000_fix_venda_analytics_unique_constraint"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:260	2025-12-23 16:26:56.238921+00	2025-12-23 16:24:03.762781+00	0
7a96164f-6cdf-47da-8e66-ab46922b5ad6	8acc3bccf74e8115c2a034aed72e323b6b0cf25f6d82049e7d3caed5942712fe	2025-12-23 16:28:47.742427+00	20251222177000_remove_old_index_venda_analytics		\N	2025-12-23 16:28:47.742427+00	0
0fd345db-3a34-49c2-97a0-2864ff10506b	5c51a30b997953c243c252c0bfaf120d59d75173ee5ffe7c6aec49bc4b87d743	2025-12-23 16:27:24.67874+00	20251222170000_add_tipo_operacao_to_venda_analytics	\N	\N	2025-12-23 16:27:24.578871+00	1
0f63a1c6-d2b2-416b-92d0-2e684bde0eec	cd03a7390928b030b641749cf7f90fcefc4d799f514466ec1a78242c9adfa859	\N	20251222171000_fix_venda_analytics_unique_constraint	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20251222171000_fix_venda_analytics_unique_constraint\n\nDatabase error code: 2BP01\n\nDatabase error:\nERROR: cannot drop index "VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_tipoOp" because constraint VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_tipoOp on table "VendaAnalytics" requires it\nHINT: You can drop constraint VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_tipoOp on table "VendaAnalytics" instead.\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E2BP01), message: "cannot drop index \\"VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_tipoOp\\" because constraint VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_tipoOp on table \\"VendaAnalytics\\" requires it", detail: None, hint: Some("You can drop constraint VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_tipoOp on table \\"VendaAnalytics\\" instead."), position: None, where_: Some("SQL statement \\"DROP INDEX IF EXISTS \\"VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_tipoOperacao_uf_empresaId_key\\"\\"\\nPL/pgSQL function inline_code_block line 8 at SQL statement"), schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("dependency.c"), line: Some(843), routine: Some("findDependentObjects") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20251222171000_fix_venda_analytics_unique_constraint"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20251222171000_fix_venda_analytics_unique_constraint"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:260	2025-12-23 16:28:02.584435+00	2025-12-23 16:27:24.684761+00	0
82c93c4c-0013-4295-adbc-2b3fafccec77	cd03a7390928b030b641749cf7f90fcefc4d799f514466ec1a78242c9adfa859	2025-12-23 16:28:02.59966+00	20251222171000_fix_venda_analytics_unique_constraint		\N	2025-12-23 16:28:02.59966+00	0
5d61d402-b247-4dd2-b553-d25ecd91bb32	ef11b6b4a6a694ebbd7e7daa8cb03e7c405c000a38768843c8e332b1e3e22293	2025-12-23 16:28:10.045592+00	20251222172000_update_venda_analytics_unique_constraint		\N	2025-12-23 16:28:10.045592+00	0
10b55cb1-8153-4755-bd53-dcedc4fc485a	06be4464873a64e220504cf0b03b58fdf80edb437ef385551c50ede95f1f251e	2025-12-23 16:28:18.121083+00	20251222173000_fix_venda_analytics_constraint_final		\N	2025-12-23 16:28:18.121083+00	0
35109e3b-57b6-4bd2-a3bb-f23165e8efc7	23543321e02dff15acc36d24804773d0c5fb25364928a0c4afbd5a8ab4e62de3	2025-12-23 16:28:25.874044+00	20251222174000_migrate_venda_analytics_old_records		\N	2025-12-23 16:28:25.874044+00	0
568533eb-4c8f-4c3d-8d91-60defda3c520	ad4ad79952f1d4a419e94bcd8b2f4daa3a98ce845a69215a621149107b6ee166	2025-12-23 16:28:32.992899+00	20251222175000_force_remove_old_venda_analytics_constraint		\N	2025-12-23 16:28:32.992899+00	0
8b1a1fdd-4e41-4e23-9f71-c096e36c7414	676c2ac82a8a567ac63a2d95d87fc9b6eb4d3f88b704b1f109b7ab37e82917f0	2025-12-23 16:28:40.260222+00	20251222176000_force_remove_all_old_constraints_venda_analytics		\N	2025-12-23 16:28:40.260222+00	0
7a6c468f-ae70-4627-ae30-8cf5199d268c	cbfd7bd876c6d0e35a75713e043e1b6b694cbdb2eed7ae8f008fcd0cf4e7fc9a	2025-12-23 16:29:05.110186+00	20251222180000_add_importacao_log_id_to_venda	\N	\N	2025-12-23 16:29:05.008128+00	1
3dd84f41-94b0-403c-a3a1-f1ce66a178cf	75805f505d6d3bedf736a8457311f2bc82f53576d083f6fa35362f81f005ce87	2025-12-23 16:29:05.136943+00	20251222181000_add_progresso_to_import_log	\N	\N	2025-12-23 16:29:05.115926+00	1
1aabcf60-309a-4a77-9351-374d86b25476	1ff9453ab29e160f1328d84da2da9d8e9fbfc7a4002ac1ced953daaa3961568f	2025-12-23 16:29:05.201243+00	20251222190000_add_venda_column_mapping	\N	\N	2025-12-23 16:29:05.142186+00	1
03b65323-b270-42a9-adaf-abff7da9ef26	03b969ebdb8a9901374f6d138034015487139a9cb07e52a6899f4c4ee2fecd7a	2025-12-23 16:29:05.256672+00	20251222200000_add_venda_analytics_filter	\N	\N	2025-12-23 16:29:05.20605+00	1
39acd9cb-746c-4bbc-a61c-271036b3a0c5	b325ca7aee13fe08d72bf445071cae9cbd9b0a279c606760bb6fc72f2aee2e19	2025-12-23 16:29:05.334651+00	20251223000000_add_usuario_cliente_association	\N	\N	2025-12-23 16:29:05.26231+00	1
8951aba3-6289-4b08-8f68-b6aabd88c49a	8b973c9f4aad871d583ed4a278905cad03aeee9dfdbfd03792c969bd58d85607	\N	20251224000000_add_3_linhas_atas_system	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20251224000000_add_3_linhas_atas_system\n\nDatabase error code: 42P01\n\nDatabase error:\nERROR: relation "AtaReuniao" does not exist\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P01), message: "relation \\"AtaReuniao\\" does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("namespace.c"), line: Some(434), routine: Some("RangeVarGetRelidExtended") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20251224000000_add_3_linhas_atas_system"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20251224000000_add_3_linhas_atas_system"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:260	2025-12-23 16:29:30.579564+00	2025-12-23 16:29:05.342921+00	0
97402b9f-87d7-4eae-8ca6-aa2354fd4098	8b973c9f4aad871d583ed4a278905cad03aeee9dfdbfd03792c969bd58d85607	\N	20251224000000_add_3_linhas_atas_system	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20251224000000_add_3_linhas_atas_system\n\nDatabase error code: 42P01\n\nDatabase error:\nERROR: relation "AtaReuniao" does not exist\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42P01), message: "relation \\"AtaReuniao\\" does not exist", detail: None, hint: None, position: None, where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("namespace.c"), line: Some(434), routine: Some("RangeVarGetRelidExtended") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20251224000000_add_3_linhas_atas_system"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20251224000000_add_3_linhas_atas_system"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:260	2025-12-23 16:31:18.070421+00	2025-12-23 16:30:07.003988+00	0
0fc9a7ed-90c8-48a5-b95c-2d90f764b474	8b973c9f4aad871d583ed4a278905cad03aeee9dfdbfd03792c969bd58d85607	2025-12-23 16:31:18.087358+00	20251224000000_add_3_linhas_atas_system		\N	2025-12-23 16:31:18.087358+00	0
c5f4826a-dca0-422d-bdea-57ab99440047	007ff6bab05c59f16dbd67fc2cea66a8f7399f7acc8a0aa3068c4ca5e6a708a7	2025-12-23 16:31:25.287195+00	20251224173928_add_configuracao_email		\N	2025-12-23 16:31:25.287195+00	0
25efb840-6481-412f-9108-9fe3b4ce0a91	1ecea60d21faf4c11cccd3e306a3f4ab70588dddb8c41e17142919a66e8e1e96	2025-12-23 16:31:32.721922+00	convert_decisoes_to_json		\N	2025-12-23 16:31:32.721922+00	0
06e2bbac-9992-4000-8d4c-c615574be8ea	3504ffc688444d7f5c14799e4fd7decf52eb18c3b0901a8cdd7e564b37db4979	\N	20251226000000_create_ata_reuniao_tables	A migration failed to apply. New migrations cannot be applied before the error is recovered from. Read more about how to resolve migration issues in a production database: https://pris.ly/d/migrate-resolve\n\nMigration name: 20251226000000_create_ata_reuniao_tables\n\nDatabase error code: 42704\n\nDatabase error:\nERROR: type "StatusPrazo" does not exist\n\nPosition:\n[1m184[0m     "dataConclusao" TIMESTAMP(3),\n[1m185[0m     "status" "StatusPrazo" NOT NULL DEFAULT 'PENDENTE',\n[1m186[0m     "concluido" BOOLEAN NOT NULL DEFAULT false,\n[1m187[0m     "lembretesEnviados" INTEGER NOT NULL DEFAULT 0,\n[1m188[0m     "ultimoLembrete" TIMESTAMP(3),\n[1m189[1;31m     "criadoPor" TEXT NOT NULL,[0m\n\nDbError { severity: "ERROR", parsed_severity: Some(Error), code: SqlState(E42704), message: "type \\"StatusPrazo\\" does not exist", detail: None, hint: None, position: Some(Original(5897)), where_: None, schema: None, table: None, column: None, datatype: None, constraint: None, file: Some("parse_type.c"), line: Some(270), routine: Some("typenameType") }\n\n   0: sql_schema_connector::apply_migration::apply_script\n           with migration_name="20251226000000_create_ata_reuniao_tables"\n             at schema-engine\\connectors\\sql-schema-connector\\src\\apply_migration.rs:113\n   1: schema_commands::commands::apply_migrations::Applying migration\n           with migration_name="20251226000000_create_ata_reuniao_tables"\n             at schema-engine\\commands\\src\\commands\\apply_migrations.rs:95\n   2: schema_core::state::ApplyMigrations\n             at schema-engine\\core\\src\\state.rs:260	2025-12-23 16:39:09.126751+00	2025-12-23 16:38:34.553071+00	0
679b13b7-dd6b-4467-b1c7-babcbc4e29a1	c979bcf8b6200f651374ba708075d7452ef94d417bf8683e05f4e5b1878fda37	2025-12-23 16:39:47.001793+00	20251226000000_create_ata_reuniao_tables	\N	\N	2025-12-23 16:39:46.387764+00	1
c3d645c1-b478-4ecb-9866-b9115f84231a	6bf9dd9539d33850b0bc5cbab0fee8111ff66502974074eeab7b1df6c3844a1e	2025-12-23 16:44:13.495958+00	20251226000001_create_pedido_tables	\N	\N	2025-12-23 16:44:13.148965+00	1
0712f02b-a17b-45c8-a472-c6955097e1c6	e25bb211a864a0c042453c5bddb6bf36af513e7349d18b4beb8222fed73ab3bf	2025-12-23 16:46:38.227752+00	20251226000002_create_email_config_tables	\N	\N	2025-12-23 16:46:38.050252+00	1
a371d084-ddd1-4ada-abaf-be43f95a6a68	e0b111702ab93b90f65ccaf186ec7fb7e6e53ce1e656fb6c5c5bcc690cac3579	2025-12-23 16:49:50.285107+00	20251226000003_create_column_mapping_and_filter_tables	\N	\N	2025-12-23 16:49:50.114724+00	1
fcc6523b-482a-4403-8346-75351b578279	b0b7d1943b68d5c834bf8029ee9f89091d1eb793612d689711dd48ba939f98a4	2025-12-23 16:57:45.349531+00	20251226000004_create_processo_tables	\N	\N	2025-12-23 16:57:44.946278+00	1
\.


--
-- Name: BravoCampoMapeamento_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."BravoCampoMapeamento_id_seq"', 1, false);


--
-- Name: Alerta Alerta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Alerta"
    ADD CONSTRAINT "Alerta_pkey" PRIMARY KEY (id);


--
-- Name: AtaAnexo AtaAnexo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AtaAnexo"
    ADD CONSTRAINT "AtaAnexo_pkey" PRIMARY KEY (id);


--
-- Name: AtaComentario AtaComentario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AtaComentario"
    ADD CONSTRAINT "AtaComentario_pkey" PRIMARY KEY (id);


--
-- Name: AtaParticipante AtaParticipante_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AtaParticipante"
    ADD CONSTRAINT "AtaParticipante_pkey" PRIMARY KEY (id);


--
-- Name: AtaReuniao AtaReuniao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AtaReuniao"
    ADD CONSTRAINT "AtaReuniao_pkey" PRIMARY KEY (id);


--
-- Name: BravoCampoMapeamento BravoCampoMapeamento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BravoCampoMapeamento"
    ADD CONSTRAINT "BravoCampoMapeamento_pkey" PRIMARY KEY (id);


--
-- Name: BravoSyncConfig BravoSyncConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BravoSyncConfig"
    ADD CONSTRAINT "BravoSyncConfig_pkey" PRIMARY KEY (id);


--
-- Name: BravoSyncLog BravoSyncLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BravoSyncLog"
    ADD CONSTRAINT "BravoSyncLog_pkey" PRIMARY KEY (id);


--
-- Name: BravoSyncProgress BravoSyncProgress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BravoSyncProgress"
    ADD CONSTRAINT "BravoSyncProgress_pkey" PRIMARY KEY (id);


--
-- Name: ConfiguracaoEmail ConfiguracaoEmail_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ConfiguracaoEmail"
    ADD CONSTRAINT "ConfiguracaoEmail_pkey" PRIMARY KEY (id);


--
-- Name: ConfiguracaoModeloNegocio ConfiguracaoModeloNegocio_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ConfiguracaoModeloNegocio"
    ADD CONSTRAINT "ConfiguracaoModeloNegocio_pkey" PRIMARY KEY (id);


--
-- Name: ContaCatalogo ContaCatalogo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ContaCatalogo"
    ADD CONSTRAINT "ContaCatalogo_pkey" PRIMARY KEY (id);


--
-- Name: Empresa Empresa_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Empresa"
    ADD CONSTRAINT "Empresa_pkey" PRIMARY KEY (id);


--
-- Name: Grupo Grupo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Grupo"
    ADD CONSTRAINT "Grupo_pkey" PRIMARY KEY (id);


--
-- Name: HistoricoAndamento HistoricoAndamento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HistoricoAndamento"
    ADD CONSTRAINT "HistoricoAndamento_pkey" PRIMARY KEY (id);


--
-- Name: LembretePrazo LembretePrazo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LembretePrazo"
    ADD CONSTRAINT "LembretePrazo_pkey" PRIMARY KEY (id);


--
-- Name: LinhaUpload LinhaUpload_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LinhaUpload"
    ADD CONSTRAINT "LinhaUpload_pkey" PRIMARY KEY (id);


--
-- Name: LogAlteracaoAta LogAlteracaoAta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LogAlteracaoAta"
    ADD CONSTRAINT "LogAlteracaoAta_pkey" PRIMARY KEY (id);


--
-- Name: LogAuditoria LogAuditoria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LogAuditoria"
    ADD CONSTRAINT "LogAuditoria_pkey" PRIMARY KEY (id);


--
-- Name: LogEnvioEmail LogEnvioEmail_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LogEnvioEmail"
    ADD CONSTRAINT "LogEnvioEmail_pkey" PRIMARY KEY (id);


--
-- Name: Marca Marca_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Marca"
    ADD CONSTRAINT "Marca_pkey" PRIMARY KEY (id);


--
-- Name: ModeloAta ModeloAta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ModeloAta"
    ADD CONSTRAINT "ModeloAta_pkey" PRIMARY KEY (id);


--
-- Name: PedidoAnalyticsFilter PedidoAnalyticsFilter_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PedidoAnalyticsFilter"
    ADD CONSTRAINT "PedidoAnalyticsFilter_pkey" PRIMARY KEY (id);


--
-- Name: PedidoAnalytics PedidoAnalytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PedidoAnalytics"
    ADD CONSTRAINT "PedidoAnalytics_pkey" PRIMARY KEY (id);


--
-- Name: PedidoColumnMapping PedidoColumnMapping_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PedidoColumnMapping"
    ADD CONSTRAINT "PedidoColumnMapping_pkey" PRIMARY KEY (id);


--
-- Name: PedidoImportacaoLog PedidoImportacaoLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PedidoImportacaoLog"
    ADD CONSTRAINT "PedidoImportacaoLog_pkey" PRIMARY KEY (id);


--
-- Name: Pedido Pedido_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Pedido"
    ADD CONSTRAINT "Pedido_pkey" PRIMARY KEY (id);


--
-- Name: PrazoAcao PrazoAcao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PrazoAcao"
    ADD CONSTRAINT "PrazoAcao_pkey" PRIMARY KEY (id);


--
-- Name: PreferenciaNotificacao PreferenciaNotificacao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PreferenciaNotificacao"
    ADD CONSTRAINT "PreferenciaNotificacao_pkey" PRIMARY KEY (id);


--
-- Name: ProcessoAnexo ProcessoAnexo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProcessoAnexo"
    ADD CONSTRAINT "ProcessoAnexo_pkey" PRIMARY KEY (id);


--
-- Name: ProcessoHistorico ProcessoHistorico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProcessoHistorico"
    ADD CONSTRAINT "ProcessoHistorico_pkey" PRIMARY KEY (id);


--
-- Name: ProcessoItem ProcessoItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProcessoItem"
    ADD CONSTRAINT "ProcessoItem_pkey" PRIMARY KEY (id);


--
-- Name: Processo Processo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Processo"
    ADD CONSTRAINT "Processo_pkey" PRIMARY KEY (id);


--
-- Name: Produto Produto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Produto"
    ADD CONSTRAINT "Produto_pkey" PRIMARY KEY (id);


--
-- Name: PushSubscription PushSubscription_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PushSubscription"
    ADD CONSTRAINT "PushSubscription_pkey" PRIMARY KEY (id);


--
-- Name: ResumoEconomico ResumoEconomico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ResumoEconomico"
    ADD CONSTRAINT "ResumoEconomico_pkey" PRIMARY KEY (id);


--
-- Name: Subgrupo Subgrupo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Subgrupo"
    ADD CONSTRAINT "Subgrupo_pkey" PRIMARY KEY (id);


--
-- Name: TemplateImportacao TemplateImportacao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TemplateImportacao"
    ADD CONSTRAINT "TemplateImportacao_pkey" PRIMARY KEY (id);


--
-- Name: Upload Upload_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Upload"
    ADD CONSTRAINT "Upload_pkey" PRIMARY KEY (id);


--
-- Name: UsuarioCliente UsuarioCliente_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UsuarioCliente"
    ADD CONSTRAINT "UsuarioCliente_pkey" PRIMARY KEY (id);


--
-- Name: Usuario Usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Usuario"
    ADD CONSTRAINT "Usuario_pkey" PRIMARY KEY (id);


--
-- Name: VendaAnalyticsFilter VendaAnalyticsFilter_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VendaAnalyticsFilter"
    ADD CONSTRAINT "VendaAnalyticsFilter_pkey" PRIMARY KEY (id);


--
-- Name: VendaAnalytics VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_tipoOp; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VendaAnalytics"
    ADD CONSTRAINT "VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_tipoOp" UNIQUE (ano, mes, "nomeFantasia", marca, grupo, subgrupo, "tipoOperacao", uf, "empresaId");


--
-- Name: VendaAnalytics VendaAnalytics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VendaAnalytics"
    ADD CONSTRAINT "VendaAnalytics_pkey" PRIMARY KEY (id);


--
-- Name: VendaColumnMapping VendaColumnMapping_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VendaColumnMapping"
    ADD CONSTRAINT "VendaColumnMapping_pkey" PRIMARY KEY (id);


--
-- Name: VendaImportacaoLog VendaImportacaoLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VendaImportacaoLog"
    ADD CONSTRAINT "VendaImportacaoLog_pkey" PRIMARY KEY (id);


--
-- Name: Venda Venda_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Venda"
    ADD CONSTRAINT "Venda_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: AtaAnexo_ataId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AtaAnexo_ataId_idx" ON public."AtaAnexo" USING btree ("ataId");


--
-- Name: AtaComentario_ataId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AtaComentario_ataId_idx" ON public."AtaComentario" USING btree ("ataId");


--
-- Name: AtaComentario_autorId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AtaComentario_autorId_idx" ON public."AtaComentario" USING btree ("autorId");


--
-- Name: AtaComentario_comentarioPaiId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AtaComentario_comentarioPaiId_idx" ON public."AtaComentario" USING btree ("comentarioPaiId");


--
-- Name: AtaParticipante_ataId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AtaParticipante_ataId_idx" ON public."AtaParticipante" USING btree ("ataId");


--
-- Name: AtaParticipante_usuarioId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AtaParticipante_usuarioId_idx" ON public."AtaParticipante" USING btree ("usuarioId");


--
-- Name: AtaReuniao_criadoPor_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AtaReuniao_criadoPor_idx" ON public."AtaReuniao" USING btree ("criadoPor");


--
-- Name: AtaReuniao_dataReuniao_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AtaReuniao_dataReuniao_idx" ON public."AtaReuniao" USING btree ("dataReuniao");


--
-- Name: AtaReuniao_empresaId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AtaReuniao_empresaId_idx" ON public."AtaReuniao" USING btree ("empresaId");


--
-- Name: AtaReuniao_numero_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "AtaReuniao_numero_key" ON public."AtaReuniao" USING btree (numero);


--
-- Name: AtaReuniao_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AtaReuniao_status_idx" ON public."AtaReuniao" USING btree (status);


--
-- Name: AtaReuniao_tipo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AtaReuniao_tipo_idx" ON public."AtaReuniao" USING btree (tipo);


--
-- Name: BravoCampoMapeamento_ativo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BravoCampoMapeamento_ativo_idx" ON public."BravoCampoMapeamento" USING btree (ativo);


--
-- Name: BravoCampoMapeamento_ordem_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BravoCampoMapeamento_ordem_idx" ON public."BravoCampoMapeamento" USING btree (ordem);


--
-- Name: BravoSyncConfig_chave_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BravoSyncConfig_chave_idx" ON public."BravoSyncConfig" USING btree (chave);


--
-- Name: BravoSyncConfig_chave_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "BravoSyncConfig_chave_key" ON public."BravoSyncConfig" USING btree (chave);


--
-- Name: BravoSyncLog_can_resume_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BravoSyncLog_can_resume_idx" ON public."BravoSyncLog" USING btree (can_resume);


--
-- Name: BravoSyncLog_started_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BravoSyncLog_started_at_idx" ON public."BravoSyncLog" USING btree (started_at);


--
-- Name: BravoSyncLog_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BravoSyncLog_status_idx" ON public."BravoSyncLog" USING btree (status);


--
-- Name: BravoSyncLog_sync_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BravoSyncLog_sync_type_idx" ON public."BravoSyncLog" USING btree (sync_type);


--
-- Name: BravoSyncLog_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BravoSyncLog_userId_idx" ON public."BravoSyncLog" USING btree ("userId");


--
-- Name: BravoSyncProgress_sync_log_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "BravoSyncProgress_sync_log_id_idx" ON public."BravoSyncProgress" USING btree (sync_log_id);


--
-- Name: BravoSyncProgress_sync_log_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "BravoSyncProgress_sync_log_id_key" ON public."BravoSyncProgress" USING btree (sync_log_id);


--
-- Name: ConfiguracaoEmail_ativo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ConfiguracaoEmail_ativo_idx" ON public."ConfiguracaoEmail" USING btree (ativo);


--
-- Name: ConfiguracaoModeloNegocio_modeloNegocio_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ConfiguracaoModeloNegocio_modeloNegocio_key" ON public."ConfiguracaoModeloNegocio" USING btree ("modeloNegocio");


--
-- Name: ContaCatalogo_classificacao_conta_subConta_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ContaCatalogo_classificacao_conta_subConta_key" ON public."ContaCatalogo" USING btree (classificacao, conta, "subConta");


--
-- Name: ContaCatalogo_classificacao_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ContaCatalogo_classificacao_key" ON public."ContaCatalogo" USING btree (classificacao);


--
-- Name: Empresa_cnpj_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Empresa_cnpj_key" ON public."Empresa" USING btree (cnpj);


--
-- Name: Grupo_nome_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Grupo_nome_idx" ON public."Grupo" USING btree (nome);


--
-- Name: Grupo_nome_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Grupo_nome_key" ON public."Grupo" USING btree (nome);


--
-- Name: HistoricoAndamento_ataId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "HistoricoAndamento_ataId_idx" ON public."HistoricoAndamento" USING btree ("ataId");


--
-- Name: HistoricoAndamento_data_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "HistoricoAndamento_data_idx" ON public."HistoricoAndamento" USING btree (data);


--
-- Name: LembretePrazo_enviado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LembretePrazo_enviado_idx" ON public."LembretePrazo" USING btree (enviado);


--
-- Name: LembretePrazo_prazoId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LembretePrazo_prazoId_idx" ON public."LembretePrazo" USING btree ("prazoId");


--
-- Name: LembretePrazo_usuarioId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LembretePrazo_usuarioId_idx" ON public."LembretePrazo" USING btree ("usuarioId");


--
-- Name: LogAlteracaoAta_ataId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LogAlteracaoAta_ataId_idx" ON public."LogAlteracaoAta" USING btree ("ataId");


--
-- Name: LogAlteracaoAta_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LogAlteracaoAta_createdAt_idx" ON public."LogAlteracaoAta" USING btree ("createdAt");


--
-- Name: LogAlteracaoAta_tipoAlteracao_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LogAlteracaoAta_tipoAlteracao_idx" ON public."LogAlteracaoAta" USING btree ("tipoAlteracao");


--
-- Name: LogAlteracaoAta_usuarioId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LogAlteracaoAta_usuarioId_idx" ON public."LogAlteracaoAta" USING btree ("usuarioId");


--
-- Name: LogEnvioEmail_configuracaoId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LogEnvioEmail_configuracaoId_idx" ON public."LogEnvioEmail" USING btree ("configuracaoId");


--
-- Name: LogEnvioEmail_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LogEnvioEmail_createdAt_idx" ON public."LogEnvioEmail" USING btree ("createdAt");


--
-- Name: LogEnvioEmail_destinatario_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LogEnvioEmail_destinatario_idx" ON public."LogEnvioEmail" USING btree (destinatario);


--
-- Name: LogEnvioEmail_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LogEnvioEmail_status_idx" ON public."LogEnvioEmail" USING btree (status);


--
-- Name: Marca_nome_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Marca_nome_idx" ON public."Marca" USING btree (nome);


--
-- Name: Marca_nome_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Marca_nome_key" ON public."Marca" USING btree (nome);


--
-- Name: ModeloAta_ativo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ModeloAta_ativo_idx" ON public."ModeloAta" USING btree (ativo);


--
-- Name: ModeloAta_empresaId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ModeloAta_empresaId_idx" ON public."ModeloAta" USING btree ("empresaId");


--
-- Name: ModeloAta_tipoReuniao_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ModeloAta_tipoReuniao_idx" ON public."ModeloAta" USING btree ("tipoReuniao");


--
-- Name: PedidoAnalyticsFilter_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PedidoAnalyticsFilter_createdAt_idx" ON public."PedidoAnalyticsFilter" USING btree ("createdAt");


--
-- Name: PedidoAnalyticsFilter_usuarioId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PedidoAnalyticsFilter_usuarioId_idx" ON public."PedidoAnalyticsFilter" USING btree ("usuarioId");


--
-- Name: PedidoAnalytics_ano_mes_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PedidoAnalytics_ano_mes_idx" ON public."PedidoAnalytics" USING btree (ano, mes);


--
-- Name: PedidoAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_empre; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PedidoAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_empre" ON public."PedidoAnalytics" USING btree (ano, mes, "nomeFantasia", marca, grupo, subgrupo, "empresaId");


--
-- Name: PedidoAnalytics_empresaId_ano_mes_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PedidoAnalytics_empresaId_ano_mes_idx" ON public."PedidoAnalytics" USING btree ("empresaId", ano, mes);


--
-- Name: PedidoAnalytics_grupo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PedidoAnalytics_grupo_idx" ON public."PedidoAnalytics" USING btree (grupo);


--
-- Name: PedidoAnalytics_marca_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PedidoAnalytics_marca_idx" ON public."PedidoAnalytics" USING btree (marca);


--
-- Name: PedidoAnalytics_nomeFantasia_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PedidoAnalytics_nomeFantasia_idx" ON public."PedidoAnalytics" USING btree ("nomeFantasia");


--
-- Name: PedidoAnalytics_subgrupo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PedidoAnalytics_subgrupo_idx" ON public."PedidoAnalytics" USING btree (subgrupo);


--
-- Name: PedidoColumnMapping_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PedidoColumnMapping_createdAt_idx" ON public."PedidoColumnMapping" USING btree ("createdAt");


--
-- Name: PedidoColumnMapping_usuarioId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PedidoColumnMapping_usuarioId_idx" ON public."PedidoColumnMapping" USING btree ("usuarioId");


--
-- Name: PedidoImportacaoLog_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PedidoImportacaoLog_createdAt_idx" ON public."PedidoImportacaoLog" USING btree ("createdAt");


--
-- Name: PedidoImportacaoLog_usuarioId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PedidoImportacaoLog_usuarioId_idx" ON public."PedidoImportacaoLog" USING btree ("usuarioId");


--
-- Name: Pedido_dataPedido_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Pedido_dataPedido_idx" ON public."Pedido" USING btree ("dataPedido");


--
-- Name: Pedido_empresaId_dataPedido_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Pedido_empresaId_dataPedido_idx" ON public."Pedido" USING btree ("empresaId", "dataPedido");


--
-- Name: Pedido_grupo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Pedido_grupo_idx" ON public."Pedido" USING btree (grupo);


--
-- Name: Pedido_idDoc_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Pedido_idDoc_idx" ON public."Pedido" USING btree ("idDoc");


--
-- Name: Pedido_importacaoLogId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Pedido_importacaoLogId_idx" ON public."Pedido" USING btree ("importacaoLogId");


--
-- Name: Pedido_marca_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Pedido_marca_idx" ON public."Pedido" USING btree (marca);


--
-- Name: Pedido_nomeFantasia_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Pedido_nomeFantasia_idx" ON public."Pedido" USING btree ("nomeFantasia");


--
-- Name: Pedido_numeroPedido_dataPedido_referencia_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Pedido_numeroPedido_dataPedido_referencia_idx" ON public."Pedido" USING btree ("numeroPedido", "dataPedido", referencia);


--
-- Name: Pedido_numeroPedido_idDoc_referencia_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Pedido_numeroPedido_idDoc_referencia_key" ON public."Pedido" USING btree ("numeroPedido", "idDoc", referencia);


--
-- Name: Pedido_numeroPedido_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Pedido_numeroPedido_idx" ON public."Pedido" USING btree ("numeroPedido");


--
-- Name: Pedido_referencia_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Pedido_referencia_idx" ON public."Pedido" USING btree (referencia);


--
-- Name: Pedido_subgrupo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Pedido_subgrupo_idx" ON public."Pedido" USING btree (subgrupo);


--
-- Name: PrazoAcao_ataId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PrazoAcao_ataId_idx" ON public."PrazoAcao" USING btree ("ataId");


--
-- Name: PrazoAcao_concluido_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PrazoAcao_concluido_idx" ON public."PrazoAcao" USING btree (concluido);


--
-- Name: PrazoAcao_dataPrazo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PrazoAcao_dataPrazo_idx" ON public."PrazoAcao" USING btree ("dataPrazo");


--
-- Name: PrazoAcao_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PrazoAcao_status_idx" ON public."PrazoAcao" USING btree (status);


--
-- Name: PreferenciaNotificacao_usuarioId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PreferenciaNotificacao_usuarioId_key" ON public."PreferenciaNotificacao" USING btree ("usuarioId");


--
-- Name: ProcessoAnexo_processoId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProcessoAnexo_processoId_idx" ON public."ProcessoAnexo" USING btree ("processoId");


--
-- Name: ProcessoHistorico_processoId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProcessoHistorico_processoId_createdAt_idx" ON public."ProcessoHistorico" USING btree ("processoId", "createdAt");


--
-- Name: ProcessoHistorico_usuarioId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProcessoHistorico_usuarioId_idx" ON public."ProcessoHistorico" USING btree ("usuarioId");


--
-- Name: ProcessoItem_processoId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ProcessoItem_processoId_idx" ON public."ProcessoItem" USING btree ("processoId");


--
-- Name: Processo_empresaId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Processo_empresaId_createdAt_idx" ON public."Processo" USING btree ("empresaId", "createdAt");


--
-- Name: Processo_numeroControle_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Processo_numeroControle_idx" ON public."Processo" USING btree ("numeroControle");


--
-- Name: Processo_numeroControle_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Processo_numeroControle_key" ON public."Processo" USING btree ("numeroControle");


--
-- Name: Processo_protocolo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Processo_protocolo_idx" ON public."Processo" USING btree (protocolo);


--
-- Name: Processo_protocolo_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Processo_protocolo_key" ON public."Processo" USING btree (protocolo);


--
-- Name: Processo_situacao_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Processo_situacao_createdAt_idx" ON public."Processo" USING btree (situacao, "createdAt");


--
-- Name: Processo_tipo_situacao_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Processo_tipo_situacao_idx" ON public."Processo" USING btree (tipo, situacao);


--
-- Name: Processo_userId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Processo_userId_createdAt_idx" ON public."Processo" USING btree ("userId", "createdAt");


--
-- Name: Produto_ativo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Produto_ativo_idx" ON public."Produto" USING btree (ativo);


--
-- Name: Produto_dataUltModif_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Produto_dataUltModif_idx" ON public."Produto" USING btree ("dataUltModif");


--
-- Name: Produto_grupo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Produto_grupo_idx" ON public."Produto" USING btree (grupo);


--
-- Name: Produto_id_prod_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Produto_id_prod_idx" ON public."Produto" USING btree (id_prod);


--
-- Name: Produto_marca_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Produto_marca_idx" ON public."Produto" USING btree (marca);


--
-- Name: Produto_referencia_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Produto_referencia_idx" ON public."Produto" USING btree (referencia);


--
-- Name: Produto_referencia_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Produto_referencia_key" ON public."Produto" USING btree (referencia);


--
-- Name: PushSubscription_usuarioId_endpoint_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PushSubscription_usuarioId_endpoint_key" ON public."PushSubscription" USING btree ("usuarioId", endpoint);


--
-- Name: PushSubscription_usuarioId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "PushSubscription_usuarioId_idx" ON public."PushSubscription" USING btree ("usuarioId");


--
-- Name: ResumoEconomico_criadoPor_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ResumoEconomico_criadoPor_createdAt_idx" ON public."ResumoEconomico" USING btree ("criadoPor", "createdAt");


--
-- Name: ResumoEconomico_empresaId_ano_mes_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ResumoEconomico_empresaId_ano_mes_idx" ON public."ResumoEconomico" USING btree ("empresaId", ano, mes);


--
-- Name: ResumoEconomico_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ResumoEconomico_status_idx" ON public."ResumoEconomico" USING btree (status);


--
-- Name: Subgrupo_nome_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Subgrupo_nome_idx" ON public."Subgrupo" USING btree (nome);


--
-- Name: Subgrupo_nome_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Subgrupo_nome_key" ON public."Subgrupo" USING btree (nome);


--
-- Name: UsuarioCliente_nomeFantasia_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UsuarioCliente_nomeFantasia_idx" ON public."UsuarioCliente" USING btree ("nomeFantasia");


--
-- Name: UsuarioCliente_usuarioId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "UsuarioCliente_usuarioId_idx" ON public."UsuarioCliente" USING btree ("usuarioId");


--
-- Name: UsuarioCliente_usuarioId_nomeFantasia_tipoCliente_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "UsuarioCliente_usuarioId_nomeFantasia_tipoCliente_key" ON public."UsuarioCliente" USING btree ("usuarioId", "nomeFantasia", "tipoCliente");


--
-- Name: Usuario_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Usuario_email_key" ON public."Usuario" USING btree (email);


--
-- Name: VendaAnalyticsFilter_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VendaAnalyticsFilter_createdAt_idx" ON public."VendaAnalyticsFilter" USING btree ("createdAt");


--
-- Name: VendaAnalyticsFilter_usuarioId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VendaAnalyticsFilter_usuarioId_idx" ON public."VendaAnalyticsFilter" USING btree ("usuarioId");


--
-- Name: VendaAnalytics_ano_mes_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VendaAnalytics_ano_mes_idx" ON public."VendaAnalytics" USING btree (ano, mes);


--
-- Name: VendaAnalytics_ano_mes_nomeFantasia_marca_uf_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "VendaAnalytics_ano_mes_nomeFantasia_marca_uf_key" ON public."VendaAnalytics" USING btree (ano, mes, "nomeFantasia", marca, uf);


--
-- Name: VendaAnalytics_empresaId_ano_mes_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VendaAnalytics_empresaId_ano_mes_idx" ON public."VendaAnalytics" USING btree ("empresaId", ano, mes);


--
-- Name: VendaAnalytics_grupo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VendaAnalytics_grupo_idx" ON public."VendaAnalytics" USING btree (grupo);


--
-- Name: VendaAnalytics_marca_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VendaAnalytics_marca_idx" ON public."VendaAnalytics" USING btree (marca);


--
-- Name: VendaAnalytics_nomeFantasia_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VendaAnalytics_nomeFantasia_idx" ON public."VendaAnalytics" USING btree ("nomeFantasia");


--
-- Name: VendaAnalytics_subgrupo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VendaAnalytics_subgrupo_idx" ON public."VendaAnalytics" USING btree (subgrupo);


--
-- Name: VendaAnalytics_tipoOperacao_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VendaAnalytics_tipoOperacao_idx" ON public."VendaAnalytics" USING btree ("tipoOperacao");


--
-- Name: VendaAnalytics_uf_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VendaAnalytics_uf_idx" ON public."VendaAnalytics" USING btree (uf);


--
-- Name: VendaColumnMapping_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VendaColumnMapping_createdAt_idx" ON public."VendaColumnMapping" USING btree ("createdAt");


--
-- Name: VendaColumnMapping_usuarioId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VendaColumnMapping_usuarioId_idx" ON public."VendaColumnMapping" USING btree ("usuarioId");


--
-- Name: VendaImportacaoLog_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VendaImportacaoLog_createdAt_idx" ON public."VendaImportacaoLog" USING btree ("createdAt");


--
-- Name: VendaImportacaoLog_usuarioId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "VendaImportacaoLog_usuarioId_idx" ON public."VendaImportacaoLog" USING btree ("usuarioId");


--
-- Name: Venda_dataVenda_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Venda_dataVenda_idx" ON public."Venda" USING btree ("dataVenda");


--
-- Name: Venda_empresaId_dataVenda_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Venda_empresaId_dataVenda_idx" ON public."Venda" USING btree ("empresaId", "dataVenda");


--
-- Name: Venda_grupo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Venda_grupo_idx" ON public."Venda" USING btree (grupo);


--
-- Name: Venda_idDoc_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Venda_idDoc_idx" ON public."Venda" USING btree ("idDoc");


--
-- Name: Venda_importacaoLogId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Venda_importacaoLogId_idx" ON public."Venda" USING btree ("importacaoLogId");


--
-- Name: Venda_marca_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Venda_marca_idx" ON public."Venda" USING btree (marca);


--
-- Name: Venda_nfe_dataVenda_referencia_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Venda_nfe_dataVenda_referencia_idx" ON public."Venda" USING btree (nfe, "dataVenda", referencia);


--
-- Name: Venda_nfe_idDoc_referencia_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Venda_nfe_idDoc_referencia_key" ON public."Venda" USING btree (nfe, "idDoc", referencia);


--
-- Name: Venda_nfe_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Venda_nfe_idx" ON public."Venda" USING btree (nfe);


--
-- Name: Venda_prodCodMestre_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Venda_prodCodMestre_idx" ON public."Venda" USING btree ("prodCodMestre");


--
-- Name: Venda_razaoSocial_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Venda_razaoSocial_idx" ON public."Venda" USING btree ("razaoSocial");


--
-- Name: Venda_referencia_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Venda_referencia_idx" ON public."Venda" USING btree (referencia);


--
-- Name: Venda_subgrupo_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Venda_subgrupo_idx" ON public."Venda" USING btree (subgrupo);


--
-- Name: Venda_tipoOperacao_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Venda_tipoOperacao_idx" ON public."Venda" USING btree ("tipoOperacao");


--
-- Name: Alerta Alerta_linhaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Alerta"
    ADD CONSTRAINT "Alerta_linhaId_fkey" FOREIGN KEY ("linhaId") REFERENCES public."LinhaUpload"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Alerta Alerta_uploadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Alerta"
    ADD CONSTRAINT "Alerta_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES public."Upload"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AtaAnexo AtaAnexo_ataId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AtaAnexo"
    ADD CONSTRAINT "AtaAnexo_ataId_fkey" FOREIGN KEY ("ataId") REFERENCES public."AtaReuniao"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AtaComentario AtaComentario_ataId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AtaComentario"
    ADD CONSTRAINT "AtaComentario_ataId_fkey" FOREIGN KEY ("ataId") REFERENCES public."AtaReuniao"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AtaComentario AtaComentario_autorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AtaComentario"
    ADD CONSTRAINT "AtaComentario_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AtaComentario AtaComentario_comentarioPaiId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AtaComentario"
    ADD CONSTRAINT "AtaComentario_comentarioPaiId_fkey" FOREIGN KEY ("comentarioPaiId") REFERENCES public."AtaComentario"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AtaParticipante AtaParticipante_ataId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AtaParticipante"
    ADD CONSTRAINT "AtaParticipante_ataId_fkey" FOREIGN KEY ("ataId") REFERENCES public."AtaReuniao"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AtaParticipante AtaParticipante_usuarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AtaParticipante"
    ADD CONSTRAINT "AtaParticipante_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AtaReuniao AtaReuniao_criadoPor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AtaReuniao"
    ADD CONSTRAINT "AtaReuniao_criadoPor_fkey" FOREIGN KEY ("criadoPor") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: AtaReuniao AtaReuniao_empresaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AtaReuniao"
    ADD CONSTRAINT "AtaReuniao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES public."Empresa"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AtaReuniao AtaReuniao_modeloAtaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AtaReuniao"
    ADD CONSTRAINT "AtaReuniao_modeloAtaId_fkey" FOREIGN KEY ("modeloAtaId") REFERENCES public."ModeloAta"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BravoSyncProgress BravoSyncProgress_sync_log_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."BravoSyncProgress"
    ADD CONSTRAINT "BravoSyncProgress_sync_log_id_fkey" FOREIGN KEY (sync_log_id) REFERENCES public."BravoSyncLog"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HistoricoAndamento HistoricoAndamento_ataId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HistoricoAndamento"
    ADD CONSTRAINT "HistoricoAndamento_ataId_fkey" FOREIGN KEY ("ataId") REFERENCES public."AtaReuniao"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HistoricoAndamento HistoricoAndamento_criadoPor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HistoricoAndamento"
    ADD CONSTRAINT "HistoricoAndamento_criadoPor_fkey" FOREIGN KEY ("criadoPor") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LembretePrazo LembretePrazo_prazoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LembretePrazo"
    ADD CONSTRAINT "LembretePrazo_prazoId_fkey" FOREIGN KEY ("prazoId") REFERENCES public."PrazoAcao"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LembretePrazo LembretePrazo_usuarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LembretePrazo"
    ADD CONSTRAINT "LembretePrazo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LinhaUpload LinhaUpload_uploadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LinhaUpload"
    ADD CONSTRAINT "LinhaUpload_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES public."Upload"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LogAlteracaoAta LogAlteracaoAta_ataId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LogAlteracaoAta"
    ADD CONSTRAINT "LogAlteracaoAta_ataId_fkey" FOREIGN KEY ("ataId") REFERENCES public."AtaReuniao"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LogAlteracaoAta LogAlteracaoAta_usuarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LogAlteracaoAta"
    ADD CONSTRAINT "LogAlteracaoAta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LogAuditoria LogAuditoria_usuarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LogAuditoria"
    ADD CONSTRAINT "LogAuditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LogEnvioEmail LogEnvioEmail_configuracaoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LogEnvioEmail"
    ADD CONSTRAINT "LogEnvioEmail_configuracaoId_fkey" FOREIGN KEY ("configuracaoId") REFERENCES public."ConfiguracaoEmail"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ModeloAta ModeloAta_criadoPor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ModeloAta"
    ADD CONSTRAINT "ModeloAta_criadoPor_fkey" FOREIGN KEY ("criadoPor") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ModeloAta ModeloAta_empresaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ModeloAta"
    ADD CONSTRAINT "ModeloAta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES public."Empresa"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PedidoAnalyticsFilter PedidoAnalyticsFilter_usuarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PedidoAnalyticsFilter"
    ADD CONSTRAINT "PedidoAnalyticsFilter_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PedidoAnalytics PedidoAnalytics_empresaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PedidoAnalytics"
    ADD CONSTRAINT "PedidoAnalytics_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES public."Empresa"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PedidoColumnMapping PedidoColumnMapping_usuarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PedidoColumnMapping"
    ADD CONSTRAINT "PedidoColumnMapping_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PedidoImportacaoLog PedidoImportacaoLog_usuarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PedidoImportacaoLog"
    ADD CONSTRAINT "PedidoImportacaoLog_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Pedido Pedido_empresaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Pedido"
    ADD CONSTRAINT "Pedido_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES public."Empresa"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Pedido Pedido_importacaoLogId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Pedido"
    ADD CONSTRAINT "Pedido_importacaoLogId_fkey" FOREIGN KEY ("importacaoLogId") REFERENCES public."PedidoImportacaoLog"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Pedido Pedido_produtoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Pedido"
    ADD CONSTRAINT "Pedido_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES public."Produto"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PrazoAcao PrazoAcao_ataId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PrazoAcao"
    ADD CONSTRAINT "PrazoAcao_ataId_fkey" FOREIGN KEY ("ataId") REFERENCES public."AtaReuniao"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PrazoAcao PrazoAcao_criadoPor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PrazoAcao"
    ADD CONSTRAINT "PrazoAcao_criadoPor_fkey" FOREIGN KEY ("criadoPor") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PreferenciaNotificacao PreferenciaNotificacao_usuarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PreferenciaNotificacao"
    ADD CONSTRAINT "PreferenciaNotificacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProcessoAnexo ProcessoAnexo_processoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProcessoAnexo"
    ADD CONSTRAINT "ProcessoAnexo_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES public."Processo"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProcessoHistorico ProcessoHistorico_processoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProcessoHistorico"
    ADD CONSTRAINT "ProcessoHistorico_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES public."Processo"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ProcessoItem ProcessoItem_processoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProcessoItem"
    ADD CONSTRAINT "ProcessoItem_processoId_fkey" FOREIGN KEY ("processoId") REFERENCES public."Processo"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Processo Processo_empresaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Processo"
    ADD CONSTRAINT "Processo_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES public."Empresa"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Processo Processo_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Processo"
    ADD CONSTRAINT "Processo_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PushSubscription PushSubscription_usuarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PushSubscription"
    ADD CONSTRAINT "PushSubscription_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ResumoEconomico ResumoEconomico_criadoPor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ResumoEconomico"
    ADD CONSTRAINT "ResumoEconomico_criadoPor_fkey" FOREIGN KEY ("criadoPor") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ResumoEconomico ResumoEconomico_empresaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ResumoEconomico"
    ADD CONSTRAINT "ResumoEconomico_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES public."Empresa"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ResumoEconomico ResumoEconomico_uploadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ResumoEconomico"
    ADD CONSTRAINT "ResumoEconomico_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES public."Upload"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: TemplateImportacao TemplateImportacao_empresaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TemplateImportacao"
    ADD CONSTRAINT "TemplateImportacao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES public."Empresa"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Upload Upload_empresaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Upload"
    ADD CONSTRAINT "Upload_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES public."Empresa"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Upload Upload_templateId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Upload"
    ADD CONSTRAINT "Upload_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES public."TemplateImportacao"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UsuarioCliente UsuarioCliente_usuarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."UsuarioCliente"
    ADD CONSTRAINT "UsuarioCliente_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Usuario Usuario_empresaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Usuario"
    ADD CONSTRAINT "Usuario_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES public."Empresa"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: VendaAnalyticsFilter VendaAnalyticsFilter_usuarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VendaAnalyticsFilter"
    ADD CONSTRAINT "VendaAnalyticsFilter_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: VendaAnalytics VendaAnalytics_empresaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VendaAnalytics"
    ADD CONSTRAINT "VendaAnalytics_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES public."Empresa"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: VendaColumnMapping VendaColumnMapping_usuarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VendaColumnMapping"
    ADD CONSTRAINT "VendaColumnMapping_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: VendaImportacaoLog VendaImportacaoLog_usuarioId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."VendaImportacaoLog"
    ADD CONSTRAINT "VendaImportacaoLog_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Venda Venda_empresaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Venda"
    ADD CONSTRAINT "Venda_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES public."Empresa"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Venda Venda_importacaoLogId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Venda"
    ADD CONSTRAINT "Venda_importacaoLogId_fkey" FOREIGN KEY ("importacaoLogId") REFERENCES public."VendaImportacaoLog"(id) ON DELETE SET NULL;


--
-- Name: Venda Venda_produtoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Venda"
    ADD CONSTRAINT "Venda_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES public."Produto"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict ivPKcjVnaH2AQLD741jHvoPgXxsg5ikWdbW0BMxGyr3rkuDjTSABuUQsJofh4qX

