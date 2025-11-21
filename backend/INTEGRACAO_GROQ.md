# Integração Groq AI

## Configuração

Para usar as funcionalidades de análise inteligente com Groq AI, você precisa configurar a chave de API do Groq.

### 1. Obter chave de API do Groq

1. Acesse [https://console.groq.com/](https://console.groq.com/)
2. Crie uma conta ou faça login
3. Navegue até a seção de API Keys
4. Crie uma nova chave de API

### 2. Configurar no backend

Adicione a seguinte variável de ambiente no arquivo `.env` do backend:

```env
GROQ_API_KEY=sua_chave_aqui
```

### 3. Reiniciar o servidor

Após adicionar a variável de ambiente, reinicie o servidor backend:

```bash
npm run start:dev
```

## Funcionalidades

A integração com Groq AI oferece:

- **Análises automáticas dos dados**: Análise inteligente de uploads, alertas, relatórios e dados comparativos
- **Insights e recomendações**: Geração automática de insights sobre a saúde financeira e recomendações de ações
- **Detecção de padrões anômalos**: Identificação automática de padrões incomuns ou suspeitos nos dados
- **Sugestões de correções**: Sugestões de correções para alertas baseadas em padrões históricos

## Endpoints

### POST /ai/analisar

Analisa dados financeiros e gera insights.

**Body:**
```json
{
  "tipo": "GERAL" | "UPLOAD" | "ALERTAS" | "RELATORIO" | "COMPARATIVO",
  "uploadId": "string (opcional)",
  "empresaId": "string (opcional)",
  "empresaIds": ["string"] (opcional),
  "mes": number (opcional),
  "ano": number (opcional),
  "descricao": "string (opcional)"
}
```

**Resposta:**
```json
{
  "id": "string",
  "tipo": "string",
  "dataAnalise": "ISO date string",
  "insights": [
    {
      "tipo": "POSITIVO" | "ATENCAO" | "CRITICO" | "INFORMATIVO",
      "titulo": "string",
      "descricao": "string",
      "recomendacao": "string (opcional)",
      "dados": {},
      "confianca": number
    }
  ],
  "padroesAnomalos": [
    {
      "tipo": "string",
      "descricao": "string",
      "severidade": "BAIXA" | "MEDIA" | "ALTA",
      "dados": {}
    }
  ],
  "sugestoesCorrecao": [
    {
      "alertaId": "string (opcional)",
      "problema": "string",
      "solucao": "string",
      "confianca": number
    }
  ],
  "resumo": "string"
}
```

## Modelo Utilizado

O sistema utiliza o modelo `llama-3.1-8b-instant` do Groq, que oferece:
- Respostas rápidas (inferência acelerada)
- Análise contextual de dados financeiros
- Geração de insights em português brasileiro

**Nota:** O modelo `llama-3.1-70b-versatile` foi descontinuado pelo Groq. O sistema foi atualizado para usar `llama-3.1-8b-instant`, que é mais rápido e eficiente para análises financeiras.

Outros modelos disponíveis que podem ser configurados no código:
- `mixtral-8x7b-32768`: Para análises mais complexas
- `gemma-7b-it`: Alternativa leve

## Notas

- Se a `GROQ_API_KEY` não estiver configurada, o sistema continuará funcionando normalmente, mas as funcionalidades de AI estarão desabilitadas
- As análises são executadas sob demanda (não são agendadas automaticamente)
- O sistema limita a quantidade de dados enviados para o Groq para evitar custos excessivos

