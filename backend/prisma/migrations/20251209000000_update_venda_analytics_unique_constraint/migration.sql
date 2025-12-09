-- Remover constraint único antigo
ALTER TABLE "VendaAnalytics" DROP CONSTRAINT IF EXISTS "VendaAnalytics_ano_mes_nomeFantasia_marca_uf_key";

-- Adicionar novo constraint único incluindo grupo e subgrupo
ALTER TABLE "VendaAnalytics" ADD CONSTRAINT "VendaAnalytics_ano_mes_nomeFantasia_marca_grupo_subgrupo_uf_key" 
  UNIQUE ("ano", "mes", "nomeFantasia", "marca", "grupo", "subgrupo", "uf");
