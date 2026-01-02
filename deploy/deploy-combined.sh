#!/bin/bash
# Script de deploy combinado para o sistema de painel de rede
set -e

echo "🚀 Iniciando deploy combinado (backend + frontend)..."

# Fazer deploy do backend
echo "📦 Fazendo deploy do backend..."
cd backend
chmod +x deploy-backend.sh
./deploy-backend.sh

# Fazer deploy do frontend
echo "📦 Fazendo deploy do frontend..."
cd ../frontend
chmod +x deploy-frontend.sh
./deploy-frontend.sh

echo "🎉 Deploy combinado concluído com sucesso!"
