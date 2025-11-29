-- Verificar contas mais comuns
SELECT DISTINCT conta, COUNT(*) as total 
FROM "LinhaUpload" 
GROUP BY conta 
ORDER BY total DESC 
LIMIT 10;

-- Verificar linhas que podem ser a conta 745
SELECT conta, "nomeConta", COUNT(*) as total 
FROM "LinhaUpload" 
WHERE conta LIKE '%745%' OR "nomeConta" ILIKE '%resultado%' 
GROUP BY conta, "nomeConta" 
ORDER BY total DESC 
LIMIT 10;

-- Verificar uma linha de exemplo para ver o formato
SELECT conta, "nomeConta", "saldoAtual", "uploadId"
FROM "LinhaUpload" 
LIMIT 5;

