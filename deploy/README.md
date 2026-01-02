# Documentação dos Scripts de Deploy

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
