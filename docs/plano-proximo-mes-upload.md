# 📋 Plano de Implementação: Detecção Automática do Próximo Mês para Upload

## 🎯 Objetivo

Quando o usuário selecionar uma empresa no formulário de upload (`/admin/resultado-economico/uploads/novo`), o sistema deve automaticamente identificar e preencher o campo "Mês" com o próximo mês que falta ser importado para aquela empresa no ano atual.

## 📊 Requisitos

1. **Ano sempre será o ano atual**: O campo "Ano" deve sempre carregar com o ano atual e não pode ser alterado (ou pode ser alterado, mas a lógica sempre usa o ano atual para buscar o próximo mês).

2. **Lógica de detecção**:
   - Buscar **todos os uploads** da empresa no **ano atual** (independente do status)
   - Identificar quais meses (1-12) já possuem uploads cadastrados
   - Encontrar o **primeiro mês que falta** (de janeiro a dezembro)
   - Se todos os meses estiverem com uploads, sugerir o **próximo mês** (mês atual + 1, ou janeiro se for dezembro)

3. **Comportamento no frontend**:
   - Quando a empresa for selecionada, fazer uma chamada ao backend
   - Preencher automaticamente o campo "Mês" com o valor retornado
   - Mostrar feedback visual (opcional) indicando que o mês foi sugerido automaticamente

## 🏗️ Arquitetura

### Backend

#### 1. Método no Service (`uploads.service.ts`)

Criar método `findProximoMesParaUpload(empresaId: string, ano: number): Promise<number>`:

```typescript
/**
 * Encontra o próximo mês que falta ser importado para uma empresa em um ano específico
 * @param empresaId ID da empresa
 * @param ano Ano para verificar (geralmente o ano atual)
 * @returns Número do mês (1-12) que deve ser importado
 */
async findProximoMesParaUpload(empresaId: string, ano: number): Promise<number> {
  // 1. Buscar todos os uploads da empresa no ano (independente do status)
  const uploads = await this.prisma.upload.findMany({
    where: {
      empresaId,
      ano,
    },
    select: {
      mes: true,
    },
  });

  // 2. Extrair lista de meses que já possuem uploads cadastrados
  const mesesComUpload = new Set(uploads.map(u => u.mes));

  // 3. Encontrar o primeiro mês que falta (de 1 a 12)
  for (let mes = 1; mes <= 12; mes++) {
    if (!mesesComUpload.has(mes)) {
      return mes;
    }
  }

  // 4. Se todos os meses já possuem uploads, retornar o próximo mês
  const mesAtual = new Date().getMonth() + 1; // getMonth() retorna 0-11
  const proximoMes = mesAtual === 12 ? 1 : mesAtual + 1;
  return proximoMes;
}
```

#### 2. Endpoint no Controller (`uploads.controller.ts`)

Criar endpoint `GET /uploads/proximo-mes`:

```typescript
@Get('proximo-mes')
async getProximoMes(
  @Query('empresaId') empresaId: string,
  @Query('ano') ano?: string,
) {
  if (!empresaId) {
    throw new BadRequestException('empresaId é obrigatório');
  }

  // Se ano não for fornecido, usar ano atual
  const anoNum = ano ? parseInt(ano, 10) : new Date().getFullYear();
  
  if (isNaN(anoNum)) {
    throw new BadRequestException('ano deve ser um número válido');
  }

  const proximoMes = await this.uploadsService.findProximoMesParaUpload(
    empresaId,
    anoNum,
  );

  return { mes: proximoMes };
}
```

**Importante**: Esta rota deve ser adicionada **ANTES** da rota `@Get(':id')` para evitar conflitos de roteamento.

### Frontend

#### 1. Serviço (`uploads.service.ts`)

Adicionar método para buscar o próximo mês:

```typescript
async getProximoMes(empresaId: string, ano?: number): Promise<number> {
  const anoAtual = ano || new Date().getFullYear();
  const response = await api.get<{ mes: number }>('/uploads/proximo-mes', {
    params: {
      empresaId,
      ano: anoAtual,
    },
  });
  return response.data.mes;
}
```

#### 2. Página de Upload (`novo/page.tsx`)

Modificações necessárias:

1. **Adicionar estado para controlar se o mês foi sugerido automaticamente**:
   ```typescript
   const [mesSugerido, setMesSugerido] = useState(false);
   ```

2. **Adicionar `useEffect` para detectar mudança na empresa**:
   ```typescript
   useEffect(() => {
     if (empresaId && ano) {
       // Buscar próximo mês
       uploadsService
         .getProximoMes(empresaId, ano)
         .then((proximoMes) => {
           // Atualizar o campo de mês usando setValue do react-hook-form
           setValue('mes', proximoMes);
           setMesSugerido(true);
         })
         .catch((err) => {
           console.error('Erro ao buscar próximo mês:', err);
           setMesSugerido(false);
         });
     } else {
       setMesSugerido(false);
     }
   }, [empresaId, ano, setValue]);
   ```

3. **Importar `setValue` do `useForm`**:
   ```typescript
   const {
     register,
     handleSubmit,
     formState: { errors },
     watch,
     setValue, // Adicionar aqui
   } = useForm<UploadFormData>({...});
   ```

4. **Adicionar feedback visual (opcional)**:
   - Mostrar um badge ou texto indicando que o mês foi sugerido automaticamente
   - Pode ser um tooltip ou um texto pequeno abaixo do campo de mês

## 📝 Passos de Implementação

### Fase 1: Backend ✅ CONCLUÍDA
- [x] Criar método `findProximoMesParaUpload` em `uploads.service.ts`
- [x] Adicionar endpoint `GET /uploads/proximo-mes` em `uploads.controller.ts`
- [x] Backend compilando sem erros

### Fase 2: Frontend - Serviço ✅ CONCLUÍDA
- [x] Adicionar método `getProximoMes` em `frontend/src/services/uploads.service.ts`
- [x] Integração com API implementada

### Fase 3: Frontend - Página ✅ CONCLUÍDA
- [x] Adicionar estado `mesSugerido` e `mesSugeridoRef`
- [x] Adicionar `setValue` ao `useForm`
- [x] Implementar `useEffect` para detectar mudança na empresa
- [x] Adicionar feedback visual com mensagem informativa
- [x] Implementar detecção de alteração manual do mês (melhoria adicional)

### Fase 4: Testes ⏳ PENDENTE (Testes Manuais)
- [ ] Testar com empresa sem uploads (deve sugerir mês 1 - Janeiro)
- [ ] Testar com empresa com alguns meses importados (deve sugerir o primeiro mês faltante)
- [ ] Testar com empresa com todos os meses importados (deve sugerir o próximo mês)
- [ ] Testar mudança de empresa (deve atualizar o mês automaticamente)
- [ ] Testar alteração manual do mês (mensagem deve desaparecer)
- [ ] Testar mudança de ano (se o campo de ano for editável)

## 🔍 Considerações Técnicas

1. **Performance**: A query no backend é simples e usa índices existentes (`empresaId`, `ano`), então deve ser rápida.

2. **Cache**: Pode ser útil adicionar cache para evitar múltiplas chamadas quando o usuário trocar de empresa rapidamente.

3. **Tratamento de Erros**: 
   - Se a empresa não existir, o backend deve retornar erro apropriado
   - Se não houver uploads, retornar mês 1 (Janeiro)
   - Frontend deve tratar erros graciosamente

4. **Status dos Uploads**: 
   - Consideramos **todos os uploads**, independente do status (`PROCESSANDO`, `CONCLUIDO`, `COM_ALERTAS`, `CANCELADO`)
   - Se já existe um upload para aquele mês/ano/empresa, não sugerimos aquele mês novamente
   - Isso evita duplicatas e permite que o usuário veja qual mês realmente falta importar

5. **UX**: 
   - O usuário ainda pode alterar o mês manualmente após a sugestão automática
   - Mostrar feedback visual de que o mês foi sugerido pode melhorar a experiência

6. **Ano Editável**: 
   - Se o campo de ano for editável, a lógica deve considerar o ano selecionado
   - Se o campo de ano não for editável, sempre usar o ano atual

## 🎨 Melhorias Futuras (Opcional)

1. **Indicador Visual**: Mostrar um ícone ou badge indicando que o mês foi sugerido automaticamente
2. **Tooltip**: Explicar ao usuário que o mês foi sugerido com base nos uploads existentes
3. **Histórico**: Mostrar quais meses já foram importados para aquela empresa/ano
4. **Validação**: Alertar se o usuário tentar importar um mês que já foi importado (já existe com `verificarDuplicataPeriodo`)

## 📌 Notas

- O campo "Ano" já está configurado para carregar com o ano atual por padrão
- A verificação de duplicata de período já existe e continuará funcionando normalmente
- Esta funcionalidade é complementar à verificação de duplicata existente

## ✅ Status da Implementação

**Data de Conclusão**: Implementação concluída

### Resumo do que foi implementado:

1. **Backend**:
   - ✅ Método `findProximoMesParaUpload()` em `uploads.service.ts`
   - ✅ Endpoint `GET /uploads/proximo-mes` em `uploads.controller.ts`
   - ✅ Lógica considera todos os uploads (independente do status)
   - ✅ Retorna o primeiro mês faltante ou o próximo mês se todos estiverem preenchidos

2. **Frontend**:
   - ✅ Método `getProximoMes()` em `uploads.service.ts`
   - ✅ Integração na página de upload (`novo/page.tsx`)
   - ✅ Preenchimento automático do campo "Mês" ao selecionar empresa
   - ✅ Feedback visual com mensagem informativa
   - ✅ Detecção de alteração manual (mensagem desaparece quando usuário altera o mês)

3. **Melhorias Adicionais**:
   - ✅ Uso de `useRef` para rastrear o último mês sugerido
   - ✅ `useEffect` adicional para detectar alterações manuais do mês
   - ✅ Tratamento de erros implementado

### Próximos Passos:
- ⏳ **Testes manuais** conforme checklist da Fase 4
- ⏳ Validação em ambiente de desenvolvimento/produção

