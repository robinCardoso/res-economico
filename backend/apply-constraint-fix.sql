-- Script para corrigir o constraint único
-- Remover constraint antigo
ALTER TABLE "VendaAnalytics" DROP CONSTRAINT IF EXISTS "VendaAnalytics_ano_mes_nomeFantasia_marca_uf_key";

-- Adicionar novo constraint incluindo grupo e subgrupo
ALTER TABLE "VendaAnalytics" 
DROP CONSTRAINT IF EXISTS "VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_uf_key";

ALTER TABLE "VendaAnalytics" 
ADD CONSTRAINT "VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_uf_key" 
UNIQUE ("ano", "mes", "nomeFantasia", "marca", "grupo", "subgrupo", "uf");
