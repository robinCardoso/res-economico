#!/bin/bash
# Script para deploy do backend no Railway
set -e

echo "🚀 Iniciando deploy do backend no Railway..."

# Verificar se o comando 'railway' está disponível
if ! command -v railway &> /dev/null; then
    echo "❌ O comando 'railway' não está instalado."
    echo "💡 Instale usando: npm install -g @railway/cli"
    exit 1
fi

# Navegar para o diretório do backend
cd backend

# Verificar se as variáveis de ambiente estão configuradas
echo "🔍 Verificando variáveis de ambiente..."
if [ -f .env ]; then
    echo "✅ Arquivo .env encontrado no backend"
else
    echo "⚠️  Arquivo .env não encontrado no backend"
fi

# Fazer login no Railway (se necessário)
echo "🔐 Verificando autenticação no Railway..."
railway whoami || echo "💡 Faça login com: railway login"

# Verificar se estamos em um projeto Railway
if [ ! -f "railway.json" ] && [ ! -f ".railway.json" ]; then
    echo "⚠️  Nenhum projeto Railway associado a este diretório."
    echo "💡 Crie um novo projeto com: railway init"
fi

# Executar o deploy
echo "📦 Fazendo deploy para Railway..."
railway up

echo "🎉 Deploy no Railway concluído com sucesso!"
echo "🌐 Seu backend está disponível em:"
railway up | grep -i "url\|link\|endpoint" || echo "Verifique o painel do Railway para a URL do backend"

echo "📋 Próximos passos:"
echo "   1. Verifique se as variáveis de ambiente estão configuradas corretamente no Railway"
echo "   2. Verifique os logs com: railway logs"
echo "   3. Teste as APIs do backend"