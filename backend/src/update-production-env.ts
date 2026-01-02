import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

async function updateProductionEnv() {
  console.log('🔐 Iniciando atualização das variáveis de ambiente para produção...');
  
  try {
    // Caminhos dos arquivos .env
    const backendEnvPath = join(__dirname, '..', '..', '.env');
    const frontendEnvPath = join(__dirname, '..', '..', 'frontend', '.env');
    
    console.log('\n📋 Atualizando variáveis de ambiente para produção...');
    
    // Variáveis de ambiente para produção
    const productionBackendEnv = `# Variáveis de ambiente para produção
NODE_ENV=production

# Supabase
SUPABASE_URL=seu_url_do_supabase_aqui
SUPABASE_ANON_KEY=sua_chave_anonima_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui

# Supabase Auth
SUPABASE_JWT_SECRET=seu_segredo_jwt_aqui

# Google Generative AI
GOOGLE_GENERATIVE_AI_API_KEY=sua_chave_api_google_aqui

# Groq
GROQ_API_KEY=sua_chave_api_groq_aqui

# SMTP (para envio de e-mails)
SMTP_HOST=seu_host_smtp_aqui
SMTP_PORT=587
SMTP_USER=seu_usuario_smtp_aqui
SMTP_PASS=sua_senha_smtp_aqui
SMTP_FROM=seu_email_aqui

# Configurações de sincronização
BRAVO_ERP_SYNC_ENABLED=false
BRAVO_ERP_CONNECTION_STRING=conexao_bravo_erp_aqui

# Configurações de IA
AI_ENABLED=true
AI_PROVIDER=google # ou groq
AI_MODEL=gemini-pro # ou llama2

# Configurações de segurança
JWT_SECRET=seu_segredo_jwt_aqui
JWT_EXPIRES_IN=24h

# Configurações de API
API_RATE_LIMIT=100
API_TIMEOUT=30000

# Configurações de log
LOG_LEVEL=info
LOG_FILE_PATH=logs/app.log
`;
    
    const productionFrontendEnv = `# Variáveis de ambiente para produção do frontend
NODE_ENV=production

# Supabase
NEXT_PUBLIC_SUPABASE_URL=seu_url_do_supabase_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui

# Configurações de API
NEXT_PUBLIC_API_BASE_URL=sua_url_api_aqui

# Google Analytics (opcional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=seu_id_analytics_aqui

# Configurações de IA
NEXT_PUBLIC_AI_ENABLED=true
`;
    
    // Atualizar arquivo .env do backend
    console.log('\n🔧 Atualizando .env do backend...');
    writeFileSync(backendEnvPath, productionBackendEnv);
    console.log('✅ Arquivo .env do backend atualizado para produção');
    
    // Atualizar arquivo .env do frontend
    console.log('\n🔧 Atualizando .env do frontend...');
    writeFileSync(frontendEnvPath, productionFrontendEnv);
    console.log('✅ Arquivo .env do frontend atualizado para produção');
    
    // Criar arquivo de documentação das variáveis
    console.log('\n📝 Criando documentação das variáveis de ambiente...');
    const envDocumentation = `# Documentação das Variáveis de Ambiente

## Backend (.env)
- NODE_ENV: Ambiente de execução (production, development)
- SUPABASE_URL: URL do projeto Supabase
- SUPABASE_ANON_KEY: Chave anônima do Supabase (client-side)
- SUPABASE_SERVICE_ROLE_KEY: Chave de serviço do Supabase (server-side, acesso total)
- SUPABASE_JWT_SECRET: Segredo JWT para autenticação
- GOOGLE_GENERATIVE_AI_API_KEY: Chave da API do Google Generative AI
- GROQ_API_KEY: Chave da API do Groq
- SMTP_*: Configurações para envio de e-mails
- BRAVO_ERP_*: Configurações de sincronização com Bravo ERP
- JWT_*: Configurações de autenticação JWT
- API_*: Configurações de API
- LOG_*: Configurações de log

## Frontend (.env)
- NEXT_PUBLIC_SUPABASE_URL: URL do projeto Supabase (pública)
- NEXT_PUBLIC_SUPABASE_ANON_KEY: Chave anônima do Supabase (pública)
- NEXT_PUBLIC_API_BASE_URL: URL base da API
- NEXT_PUBLIC_GA_MEASUREMENT_ID: ID do Google Analytics (opcional)

## Valores de Exemplo para Produção
- URL do Supabase: https://[project-ref].supabase.co
- Chaves do Supabase: Obtidas no painel do Supabase > Project Settings > API
- Chaves de API: Obtidas nos respectivos painéis de serviço
- SMTP: Configurações do provedor de e-mail (Gmail, SendGrid, etc.)
`;
    
    const docsPath = join(__dirname, '..', '..', 'docs', 'variaveis-ambiente.md');
    writeFileSync(docsPath, envDocumentation);
    console.log('✅ Documentação das variáveis de ambiente criada');
    
    console.log('\n✅ Atualização das variáveis de ambiente para produção concluída!');
    console.log('📋 Próximos passos:');
    console.log('   1. Substituir os placeholders com valores reais para produção');
    console.log('   2. Manter as chaves de API em segredo e segurança');
    console.log('   3. Testar as configurações em ambiente de staging antes de produção');
    console.log('   4. Configurar variáveis de ambiente no serviço de deploy (Vercel, etc.)');
    
  } catch (error) {
    console.error('❌ Erro durante a atualização das variáveis de ambiente para produção:', error.message);
    process.exit(1);
  }
}

// Executar a função principal se este arquivo for executado diretamente
if (require.main === module) {
  updateProductionEnv();
}

export { updateProductionEnv };