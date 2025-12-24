# API de Deleção Segura de Empresas

## Endpoints

### 1. Validar se Empresa Pode Ser Deletada

**Endpoint:** `GET /empresas/:id/validar-delecao`

**Descrição:** Valida se uma empresa pode ser deletada sem afetar dados críticos.

**Parâmetros:**
- `id` (path): ID da empresa

**Resposta (Sucesso):**
```json
{
  "podeDeleter": true,
  "mensagem": "Empresa pode ser deletada com segurança",
  "bloqueios": {
    "vendas": 0,
    "pedidos": 0,
    "uploads": 0,
    "outrosDados": 0
  }
}
```

**Resposta (Com Bloqueios):**
```json
{
  "podeDeleter": false,
  "mensagem": "Empresa não pode ser deletada. Existem 45 registro(s) associado(s).",
  "bloqueios": {
    "vendas": 30,
    "pedidos": 10,
    "uploads": 5,
    "outrosDados": 0
  }
}
```

---

### 2. Deletar Empresa (Seguro)

**Endpoint:** `DELETE /empresas/:id/deletar-seguro`

**Descrição:** Deleta uma empresa com validações de segurança.

**Parâmetros:**
- `id` (path): ID da empresa
- `forceDelete` (body, opcional): Se `true`, deleta automaticamente dados associados antes de deletar a empresa

**Request Body (Sem Force Delete):**
```json
{
  "forceDelete": false
}
```

**Request Body (Com Force Delete):**
```json
{
  "forceDelete": true
}
```

**Resposta (Sucesso - Sem Dados Associados):**
```json
{
  "sucesso": true,
  "mensagem": "Empresa REDE UNIAO - SC deletada com sucesso",
  "empresaId": "empresa-id-123",
  "empresaNome": "REDE UNIAO - SC",
  "deletado": true
}
```

**Resposta (Com Bloqueios e forceDelete=false):**
```json
{
  "sucesso": false,
  "mensagem": "Empresa não pode ser deletada. Existem 45 registro(s) associado(s).",
  "empresaId": "empresa-id-123",
  "empresaNome": "REDE UNIAO - SC",
  "deletado": false,
  "avisos": [
    "Vendas: 30",
    "Pedidos: 10",
    "Uploads: 5",
    "Outros dados: 0"
  ]
}
```

**Resposta (Com Force Delete=true):**
```json
{
  "sucesso": true,
  "mensagem": "Empresa REDE UNIAO - SC deletada com sucesso",
  "empresaId": "empresa-id-123",
  "empresaNome": "REDE UNIAO - SC",
  "deletado": true,
  "dadosDeletados": {
    "vendas": 30,
    "pedidos": 10,
    "uploads": 5,
    "outros": 0
  }
}
```

---

## Exemplos de Uso

### Exemplo 1: Verificar se pode deletar

```bash
curl -X GET http://localhost:3000/empresas/empresa-id-123/validar-delecao \
  -H "Authorization: Bearer seu-token-jwt"
```

### Exemplo 2: Tentar deletar (vai bloquear se houver dados)

```bash
curl -X DELETE http://localhost:3000/empresas/empresa-id-123/deletar-seguro \
  -H "Authorization: Bearer seu-token-jwt" \
  -H "Content-Type: application/json" \
  -d '{"forceDelete": false}'
```

### Exemplo 3: Deletar com força (deleta dados automaticamente)

```bash
curl -X DELETE http://localhost:3000/empresas/empresa-id-123/deletar-seguro \
  -H "Authorization: Bearer seu-token-jwt" \
  -H "Content-Type: application/json" \
  -d '{"forceDelete": true}'
```

---

## Fluxo de Deleção Recomendado

### Opção 1: Deleção Segura (Sem Dados)

1. Chamar `GET /empresas/:id/validar-delecao`
2. Se `podeDeleter === true`, chamar `DELETE /empresas/:id/deletar-seguro` com `forceDelete: false`
3. ✅ Empresa deletada

### Opção 2: Deleção com Força (Com Dados)

1. Chamar `GET /empresas/:id/validar-delecao`
2. Se `podeDeleter === false`, chamar `DELETE /empresas/:id/deletar-seguro` com `forceDelete: true`
3. ✅ Dados deletados automaticamente + Empresa deletada

### Opção 3: Confirmação Manual

1. Chamar `GET /empresas/:id/validar-delecao`
2. Se houver dados, solicitar confirmação do usuário
3. Se confirmado, chamar `DELETE /empresas/:id/deletar-seguro` com `forceDelete: true`
4. ✅ Empresa deletada

---

## Dados Que São Protegidos

As seguintes tabelas têm relacionamento com Empresa e bloqueiam a deleção:

- **Venda** - Registros de vendas
- **Pedido** - Pedidos de compra
- **Upload** - Arquivos enviados
- **Processo** - Processos de reclamação/garantia
- **AtaReuniao** - Atas de reunião

## Dados Que NÃO Bloqueiam a Deleção

- **Usuario** - Usuários podem existir sem empresa associada (empresaId = NULL)

---

## Notas Importantes

⚠️ **CUIDADO COM FORCE DELETE!**

Quando você usa `forceDelete: true`, todos os dados associados serão **permanentemente deletados**:
- Vendas
- Pedidos
- Uploads
- E seus dados relacionados

Use apenas se tiver certeza que deseja remover esses dados.

---

## Status HTTP

- `200` - Sucesso
- `400` - Empresa não encontrada ou erro na validação
- `401` - Não autenticado
- `403` - Sem permissão

