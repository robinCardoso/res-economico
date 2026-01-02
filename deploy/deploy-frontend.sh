#!/bin/bash
# Script de deploy para o frontend do sistema de painel de rede
set -e

echo "🚀 Iniciando deploy do frontend..."

# Navegar para o diretório do frontend
cd frontend

# Instalar dependências
echo "📦 Instalando dependências..."
npm ci --only=production

# Compilar o código para produção
echo "🔨 Compilando código para produção..."
npm run build

# Iniciar o servidor de produção
echo "✅ Iniciando servidor de produção..."
npm run start

echo "🎉 Frontend deploy concluído com sucesso!"
