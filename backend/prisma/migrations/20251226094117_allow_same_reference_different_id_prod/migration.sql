/*
  Warnings:

  - You are about to drop the `AtaAnexo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AtaComentario` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AtaParticipante` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AtaReuniao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ConfiguracaoEmail` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HistoricoAndamento` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LembretePrazo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LogEnvioEmail` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ModeloAta` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Pedido` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PedidoAnalytics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PedidoAnalyticsFilter` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PedidoColumnMapping` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PedidoImportacaoLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PrazoAcao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Processo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProcessoAnexo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProcessoHistorico` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProcessoItem` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[referencia,id_prod]` on the table `Produto` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "AtaAnexo" DROP CONSTRAINT "AtaAnexo_ataId_fkey";

-- DropForeignKey
ALTER TABLE "AtaComentario" DROP CONSTRAINT "AtaComentario_ataId_fkey";

-- DropForeignKey
ALTER TABLE "AtaComentario" DROP CONSTRAINT "AtaComentario_autorId_fkey";

-- DropForeignKey
ALTER TABLE "AtaComentario" DROP CONSTRAINT "AtaComentario_comentarioPaiId_fkey";

-- DropForeignKey
ALTER TABLE "AtaParticipante" DROP CONSTRAINT "AtaParticipante_ataId_fkey";

-- DropForeignKey
ALTER TABLE "AtaParticipante" DROP CONSTRAINT "AtaParticipante_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "AtaReuniao" DROP CONSTRAINT "AtaReuniao_criadoPor_fkey";

-- DropForeignKey
ALTER TABLE "AtaReuniao" DROP CONSTRAINT "AtaReuniao_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "AtaReuniao" DROP CONSTRAINT "AtaReuniao_modeloAtaId_fkey";

-- DropForeignKey
ALTER TABLE "HistoricoAndamento" DROP CONSTRAINT "HistoricoAndamento_ataId_fkey";

-- DropForeignKey
ALTER TABLE "HistoricoAndamento" DROP CONSTRAINT "HistoricoAndamento_criadoPor_fkey";

-- DropForeignKey
ALTER TABLE "LembretePrazo" DROP CONSTRAINT "LembretePrazo_prazoId_fkey";

-- DropForeignKey
ALTER TABLE "LembretePrazo" DROP CONSTRAINT "LembretePrazo_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "LogAlteracaoAta" DROP CONSTRAINT "LogAlteracaoAta_ataId_fkey";

-- DropForeignKey
ALTER TABLE "LogEnvioEmail" DROP CONSTRAINT "LogEnvioEmail_configuracaoId_fkey";

-- DropForeignKey
ALTER TABLE "ModeloAta" DROP CONSTRAINT "ModeloAta_criadoPor_fkey";

-- DropForeignKey
ALTER TABLE "ModeloAta" DROP CONSTRAINT "ModeloAta_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "Pedido" DROP CONSTRAINT "Pedido_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "Pedido" DROP CONSTRAINT "Pedido_importacaoLogId_fkey";

-- DropForeignKey
ALTER TABLE "Pedido" DROP CONSTRAINT "Pedido_produtoId_fkey";

-- DropForeignKey
ALTER TABLE "PedidoAnalytics" DROP CONSTRAINT "PedidoAnalytics_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "PedidoAnalyticsFilter" DROP CONSTRAINT "PedidoAnalyticsFilter_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "PedidoColumnMapping" DROP CONSTRAINT "PedidoColumnMapping_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "PedidoImportacaoLog" DROP CONSTRAINT "PedidoImportacaoLog_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "PrazoAcao" DROP CONSTRAINT "PrazoAcao_ataId_fkey";

-- DropForeignKey
ALTER TABLE "PrazoAcao" DROP CONSTRAINT "PrazoAcao_criadoPor_fkey";

-- DropForeignKey
ALTER TABLE "Processo" DROP CONSTRAINT "Processo_empresaId_fkey";

-- DropForeignKey
ALTER TABLE "Processo" DROP CONSTRAINT "Processo_userId_fkey";

-- DropForeignKey
ALTER TABLE "ProcessoAnexo" DROP CONSTRAINT "ProcessoAnexo_processoId_fkey";

-- DropForeignKey
ALTER TABLE "ProcessoHistorico" DROP CONSTRAINT "ProcessoHistorico_processoId_fkey";

-- DropForeignKey
ALTER TABLE "ProcessoItem" DROP CONSTRAINT "ProcessoItem_processoId_fkey";

-- DropIndex
DROP INDEX "Produto_referencia_key";

-- DropTable
DROP TABLE "AtaAnexo";

-- DropTable
DROP TABLE "AtaComentario";

-- DropTable
DROP TABLE "AtaParticipante";

-- DropTable
DROP TABLE "AtaReuniao";

-- DropTable
DROP TABLE "ConfiguracaoEmail";

-- DropTable
DROP TABLE "HistoricoAndamento";

-- DropTable
DROP TABLE "LembretePrazo";

-- DropTable
DROP TABLE "LogEnvioEmail";

-- DropTable
DROP TABLE "ModeloAta";

-- DropTable
DROP TABLE "Pedido";

-- DropTable
DROP TABLE "PedidoAnalytics";

-- DropTable
DROP TABLE "PedidoAnalyticsFilter";

-- DropTable
DROP TABLE "PedidoColumnMapping";

-- DropTable
DROP TABLE "PedidoImportacaoLog";

-- DropTable
DROP TABLE "PrazoAcao";

-- DropTable
DROP TABLE "Processo";

-- DropTable
DROP TABLE "ProcessoAnexo";

-- DropTable
DROP TABLE "ProcessoHistorico";

-- DropTable
DROP TABLE "ProcessoItem";

-- DropEnum
DROP TYPE "CategoriaReclamacao";

-- DropEnum
DROP TYPE "PrioridadeProcesso";

-- DropEnum
DROP TYPE "SituacaoProcesso";

-- DropEnum
DROP TYPE "StatusAta";

-- DropEnum
DROP TYPE "StatusEnvioEmail";

-- DropEnum
DROP TYPE "StatusPrazo";

-- DropEnum
DROP TYPE "TipoArquivoAta";

-- DropEnum
DROP TYPE "TipoArquivoProcesso";

-- DropEnum
DROP TYPE "TipoComentario";

-- DropEnum
DROP TYPE "TipoLembrete";

-- DropEnum
DROP TYPE "TipoProcesso";

-- DropEnum
DROP TYPE "TipoReuniao";

-- CreateIndex
CREATE UNIQUE INDEX "Produto_referencia_id_prod_key" ON "Produto"("referencia", "id_prod");
