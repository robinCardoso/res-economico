#!/bin/bash
# Script para deploy do frontend na Vercel
set -e

echo "🚀 Iniciando deploy do frontend na Vercel..."

# Verificar se o comando 'vercel' está disponível
if ! command -v vercel &> /dev/null; then
    echo "❌ O comando 'vercel' não está instalado."
    echo "💡 Instale usando: npm install -g vercel"
    exit 1
fi

# Navegar para o diretório do frontend
cd frontend

# Verificar se as variáveis de ambiente estão configuradas
echo "🔍 Verificando variáveis de ambiente..."
if [ -f .env ]; then
    echo "✅ Arquivo .env encontrado no frontend"
else
    echo "⚠️  Arquivo .env não encontrado no frontend"
fi

# Fazer login na Vercel (se necessário)
echo "🔐 Verificando autenticação na Vercel..."
vercel whoami

# Executar o deploy
echo "📦 Fazendo deploy para Vercel..."
vercel --prod --token=$VERCEL_TOKEN

echo "🎉 Deploy na Vercel concluído com sucesso!"
echo "🌐 Seu aplicativo está disponível em:"
vercel --prod --token=$VERCEL_TOKEN | grep -i "deployment complete\|ready\|url\|link" || echo "Verifique a saída acima para a URL do aplicativo"

echo "📋 Próximos passos:"
echo "   1. Verifique se as variáveis de ambiente estão configuradas corretamente na Vercel"
echo "   2. Teste o aplicativo após o deploy"
echo "   3. Atualize o domínio personalizado se necessário"