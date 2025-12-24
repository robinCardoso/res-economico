-- CreateEnum
CREATE TYPE "TipoClienteAssociacao" AS ENUM ('VENDA', 'PEDIDO', 'AMBOS');

-- AlterTable Usuario - Adicionar novos campos
ALTER TABLE "Usuario" 
  ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "ultimoAcesso" TIMESTAMP(3);

-- CreateTable UsuarioCliente
CREATE TABLE "UsuarioCliente" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "nomeFantasia" TEXT NOT NULL,
    "tipoCliente" "TipoClienteAssociacao" NOT NULL,
    "permissoes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "UsuarioCliente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UsuarioCliente_usuarioId_idx" ON "UsuarioCliente"("usuarioId");

-- CreateIndex
CREATE INDEX "UsuarioCliente_nomeFantasia_idx" ON "UsuarioCliente"("nomeFantasia");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioCliente_usuarioId_nomeFantasia_tipoCliente_key" ON "UsuarioCliente"("usuarioId", "nomeFantasia", "tipoCliente");

-- AddForeignKey
ALTER TABLE "UsuarioCliente" ADD CONSTRAINT "UsuarioCliente_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
