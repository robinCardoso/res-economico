# Plano de Correção: JSON Truncado e Limites da API Gemini

## Problemas Identificados

### 1. JSON Truncado
- **Sintoma**: JSON incompleto com "Unterminated string" na posição 30925
- **Causa**: `maxOutputTokens: 16000` pode não ser suficiente para documentos muito grandes (20+ folhas)
- **Impacto**: Falha na importação de atas grandes

### 2. Limite da API Gemini
- **Sintoma**: Possível limite diário gratuito atingido
- **Causa**: Não há detecção de erros específicos da API (quota, rate limit)
- **Impacto**: Usuário não sabe o motivo da falha

### 3. Falta de Feedback ao Usuário
- **Sintoma**: Erro genérico sem contexto
- **Causa**: Não há aviso sobre documentos muito grandes
- **Impacto**: UX ruim, usuário não sabe o que fazer

## Soluções Propostas

### Fase 1: Detecção e Tratamento de JSON Truncado

#### 1.1 Detectar JSON Incompleto
- ✅ Já implementado: função `encontrarJsonCompleto` detecta profundidade > 0
- ⚠️ Melhorar: Detectar quando JSON foi truncado no meio de uma string

#### 1.2 Tratamento de JSON Truncado
- **Opção A**: Tentar recuperar JSON parcial (salvar o que foi possível extrair)
- **Opção B**: Avisar usuário e sugerir dividir documento
- **Opção C**: Implementar processamento em chunks (futuro)

#### 1.3 Aumentar Limite de Tokens
- Verificar limite máximo do modelo `gemini-2.0-flash`
- Aumentar `maxOutputTokens` para o máximo permitido (32k ou 1M dependendo do modelo)

### Fase 2: Detecção de Erros da API Gemini

#### 2.1 Erros de Quota/Limite
- Detectar status HTTP 429 (Too Many Requests)
- Detectar status HTTP 403 (Forbidden - quota excedida)
- Detectar mensagens específicas do Gemini sobre limites

#### 2.2 Mensagens ao Usuário
- "Limite diário da API Gemini atingido. Tente novamente amanhã."
- "Quota da API excedida. Entre em contato com o administrador."
- "Erro temporário na API. Tente novamente em alguns minutos."

### Fase 3: Avisos sobre Documentos Grandes

#### 3.1 Validação Pré-Upload
- Estimar tamanho do documento (número de páginas, tamanho do arquivo)
- Avisar se documento pode ser muito grande (>15 folhas)

#### 3.2 Aviso Durante Processamento
- Se JSON truncado detectado, avisar:
  - "O documento é muito grande e foi processado parcialmente."
  - "Apenas as primeiras X folhas foram processadas."
  - "Considere dividir o documento em partes menores."

#### 3.3 Salvamento Parcial
- Se JSON truncado mas parcialmente válido:
  - Salvar o que foi possível extrair
  - Marcar como "processamento parcial"
  - Permitir edição manual

### Fase 4: Melhorias na Extração de JSON

#### 4.1 Tentar Recuperar JSON Truncado
- Se string não terminada, tentar fechar automaticamente
- Se objeto incompleto, tentar completar com `}` faltante
- Validar JSON recuperado antes de usar

#### 4.2 Fallback para Processamento Manual
- Se JSON não puder ser recuperado:
  - Salvar texto extraído (sem estrutura)
  - Permitir edição manual completa
  - Marcar como "requer revisão manual"

## Implementação Prioritária

### Prioridade ALTA (Implementar Agora) - ✅ CONCLUÍDO
1. ✅ Aumentar `maxOutputTokens` para máximo permitido (32k tokens)
2. ✅ Detectar erros específicos da API Gemini (429, 403)
3. ✅ Mensagens de erro mais específicas
4. ✅ Tentar recuperar JSON truncado (fechar strings/objetos)
5. ✅ Melhorar tratamento de erros HTTP da API

### Prioridade MÉDIA (Próxima Sprint)
1. ⚠️ Aviso sobre documentos grandes (>15 folhas)
2. ⚠️ Salvamento parcial quando possível
3. ⚠️ Marcar atas com "processamento parcial"

### Prioridade BAIXA (Futuro)
1. 📋 Processamento em chunks
2. 📋 Divisão automática de documentos grandes
3. 📋 Cache de respostas da API

## Código a Implementar

### 1. Aumentar Limite de Tokens
```typescript
generationConfig: {
  temperature: 0.3,
  maxOutputTokens: 32000, // Máximo para gemini-2.0-flash
}
```

### 2. Detectar Erros da API
```typescript
if (response.status === 429) {
  throw new BadRequestException(
    'Limite de requisições da API Gemini atingido. Tente novamente em alguns minutos.'
  );
}
if (response.status === 403) {
  throw new BadRequestException(
    'Quota diária da API Gemini excedida. Tente novamente amanhã ou entre em contato com o administrador.'
  );
}
```

### 3. Recuperar JSON Truncado
```typescript
const recuperarJsonTruncado = (jsonIncompleto: string): string | null => {
  // Tentar fechar string não terminada
  // Tentar fechar objeto não terminado
  // Validar JSON recuperado
}
```

### 4. Aviso sobre Documento Grande
```typescript
if (arquivo.size > 5 * 1024 * 1024) { // > 5MB
  this.logger.warn('Documento grande detectado, pode ser truncado');
  // Avisar usuário
}
```

## Testes Necessários

1. ✅ Testar com documento de 20 folhas
2. ✅ Testar com documento de 50+ folhas
3. ✅ Testar quando quota excedida
4. ✅ Testar quando rate limit atingido
5. ✅ Testar recuperação de JSON truncado

## Métricas de Sucesso

- ✅ Taxa de sucesso de importação > 95%
- ✅ Tempo médio de processamento < 60s
- ✅ Usuários conseguem importar documentos de até 30 folhas
- ✅ Mensagens de erro claras e acionáveis

