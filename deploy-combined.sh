#!/bin/bash
# Script combinado para deploy do frontend na Vercel e backend no Railway
set -e

echo "🚀 Iniciando deploy combinado (frontend na Vercel + backend no Railway)..."

# Função para verificar se um comando está disponível
command_exists() {
    command -v "$1" &> /dev/null
}

# Verificar se as ferramentas estão instaladas
if ! command_exists vercel; then
    echo "❌ O comando 'vercel' não está instalado."
    echo "💡 Instale usando: npm install -g vercel"
    exit 1
fi

if ! command_exists railway; then
    echo "❌ O comando 'railway' não está instalado."
    echo "💡 Instale usando: npm install -g @railway/cli"
    exit 1
fi

echo "✅ Ferramentas necessárias estão instaladas"

# Confirmar antes de continuar
read -p "Tem certeza que deseja fazer deploy de ambos (frontend e backend)? [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deploy cancelado pelo usuário"
    exit 1
fi

# Fazer deploy do frontend primeiro
echo "📦 Fazendo deploy do frontend na Vercel..."
cd frontend
if [ -f .env ]; then
    echo "✅ Arquivo .env encontrado no frontend"
else
    echo "⚠️  Arquivo .env não encontrado no frontend"
fi

vercel --prod --token=$VERCEL_TOKEN
FRONTEND_URL=$(vercel --prod --token=$VERCEL_TOKEN | grep -i "https://.*vercel.app" | head -n 1 || echo "Verifique a saída acima para a URL do frontend")

echo "✅ Frontend deploy concluído!"
echo "🌐 Frontend disponível em: $FRONTEND_URL"

# Voltar e fazer deploy do backend
echo "📦 Fazendo deploy do backend no Railway..."
cd ../backend
if [ -f .env ]; then
    echo "✅ Arquivo .env encontrado no backend"
else
    echo "⚠️  Arquivo .env não encontrado no backend"
fi

railway up
echo "✅ Backend deploy concluído!"

echo "🎉 Deploy combinado concluído com sucesso!"
echo "🌐 Frontend: $FRONTEND_URL"
echo "🌐 Backend: Verifique o painel do Railway para a URL do backend"

echo "📋 Próximos passos:"
echo "   1. Atualize as configurações de autenticação no Supabase com os domínios do frontend"
echo "   2. Teste a integração completa entre frontend e backend"
echo "   3. Verifique os logs em ambas as plataformas"