import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

async function prepareDeployScripts() {
  console.log('🚀 Iniciando preparação dos scripts de deploy...');
  
  try {
    // Criar diretório de scripts de deploy se não existir
    const deployDir = join(__dirname, '..', '..', 'deploy');
    mkdirSync(deployDir, { recursive: true });
    
    // Script de deploy para o backend
    const backendDeployScript = `#!/bin/bash
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
`;
    
    // Script de deploy para o frontend
    const frontendDeployScript = `#!/bin/bash
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
`;
    
    // Script de deploy combinado
    const combinedDeployScript = `#!/bin/bash
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
`;
    
    // Arquivo de configuração para Vercel (frontend)
    const vercelConfig = `{
  "version": 2,
  "name": "painel-rede-frontend",
  "framework": "nextjs",
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "frontend/\$1"
    }
  ]
}
`;
    
    // Arquivo de configuração para Railway (backend)
    const railwayConfig = `# Variables
NODE_ENV=production
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key
GROQ_API_KEY=your_groq_api_key
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_pass
SMTP_FROM=your_smtp_from

# Build command
npm run build

# Start command
npm start

# Root directory
.
`;
    
    // Escrever os scripts
    writeFileSync(join(deployDir, 'deploy-backend.sh'), backendDeployScript);
    writeFileSync(join(deployDir, 'deploy-frontend.sh'), frontendDeployScript);
    writeFileSync(join(deployDir, 'deploy-combined.sh'), combinedDeployScript);
    writeFileSync(join(deployDir, 'vercel.json'), vercelConfig);
    writeFileSync(join(deployDir, 'railway.txt'), railwayConfig);
    
    // Criar arquivo de documentação
    const deployDocumentation = `# Documentação dos Scripts de Deploy

## Scripts Disponíveis

### 1. deploy-backend.sh
- Faz deploy apenas do backend
- Instala dependências de produção
- Compila o código
- Executa migrações (se necessário)
- Inicia a aplicação

### 2. deploy-frontend.sh
- Faz deploy apenas do frontend
- Instala dependências de produção
- Compila o código para produção
- Inicia o servidor de produção

### 3. deploy-combined.sh
- Faz deploy combinado do backend e frontend
- Executa os dois scripts anteriores em sequência

## Configurações de Deploy

### Vercel (Frontend)
- Arquivo: vercel.json
- Configuração pronta para deploy no Vercel
- Framework: Next.js

### Railway (Backend)
- Arquivo: railway.txt
- Configurações de variáveis de ambiente
- Comandos de build e start

## Variáveis de Ambiente
- As variáveis de ambiente devem ser configuradas nos serviços de deploy
- Verifique o arquivo docs/variaveis-ambiente.md para detalhes

## Procedimento de Deploy
1. Atualize as variáveis de ambiente com os valores de produção
2. Execute o script apropriado para seu ambiente
3. Monitore os logs para verificar sucesso do deploy
4. Teste a aplicação após o deploy

## Rollback
- Em caso de problemas, mantenha uma cópia do build anterior
- Use as ferramentas de rollback dos serviços de deploy
- Verifique logs para identificar problemas
`;
    
    writeFileSync(join(deployDir, 'README.md'), deployDocumentation);
    
    console.log('✅ Scripts de deploy criados com sucesso!');
    console.log('📋 Arquivos criados:');
    console.log('   - deploy-backend.sh: Script para deploy do backend');
    console.log('   - deploy-frontend.sh: Script para deploy do frontend');
    console.log('   - deploy-combined.sh: Script para deploy combinado');
    console.log('   - vercel.json: Configuração para deploy no Vercel');
    console.log('   - railway.txt: Configuração para deploy no Railway');
    console.log('   - README.md: Documentação dos scripts de deploy');
    
    console.log('\n💡 Dicas para deploy:');
    console.log('   - Configure as variáveis de ambiente nos serviços de deploy');
    console.log('   - Teste os scripts em ambiente de staging primeiro');
    console.log('   - Monitore os logs após o deploy');
    console.log('   - Planeje o deploy durante janelas de baixo uso');
    
  } catch (error) {
    console.error('❌ Erro durante a preparação dos scripts de deploy:', error.message);
    process.exit(1);
  }
}

// Executar a função principal se este arquivo for executado diretamente
if (require.main === module) {
  prepareDeployScripts();
}

export { prepareDeployScripts };