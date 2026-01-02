#!/bin/bash
# Script de deploy para o backend do sistema de painel de rede
set -e

echo "🚀 Iniciando deploy do backend..."

# Instalar dependências
echo "📦 Instalando dependências..."
npm ci --only=production

# Compilar o código (se necessário)
echo "🔨 Compilando código..."
npm run build

# Executar migrações (se necessário)
echo "🔄 Executando migrações..."
npm run migrate

# Iniciar a aplicação
echo "✅ Iniciando aplicação..."
npm start

echo "🎉 Backend deploy concluído com sucesso!"
