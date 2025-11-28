# Plano de Implementação - Sistema de Tema

## 📋 Situação Atual

### Problema
- O projeto atual não tem sistema de tema (dark/light mode)
- As cores estão configuradas apenas no `globals.css` sem suporte a alternância
- Não há componente para o usuário alternar entre temas

### Oportunidade
- O projeto `painel-completo` usa `next-themes` para gerenciar temas
- Sistema já testado e funcionando
- Cores definidas: **Amarelo** (`48 96% 53%`), **Preto** (`0 0% 0%`), **Branco** (`0 0% 100%`)

---

## 🎯 Objetivos

1. **Implementar sistema de tema** usando `next-themes`
2. **Criar ThemeProvider** para gerenciar estado do tema
3. **Adicionar componente ThemeToggle** para alternar entre light/dark
4. **Configurar cores** conforme painel-completo (amarelo, preto, branco)
5. **Integrar com layout existente** sem quebrar funcionalidades

---

## 🎨 Cores Identificadas

### Light Mode (Claro)
- **Background:** `0 0% 100%` (Branco)
- **Foreground:** `240 10% 3.9%` (Quase preto)
- **Primary:** `48 96% 53%` (Amarelo)
- **Primary Foreground:** `240 5.9% 10%` (Preto para contraste)

### Dark Mode (Escuro)
- **Background:** `0 0% 0%` (Preto)
- **Foreground:** `0 0% 98%` (Quase branco)
- **Primary:** `48 96% 53%` (Amarelo - mantém)
- **Primary Foreground:** `240 5.9% 10%` (Preto para contraste)

### Paleta Completa
- **Amarelo:** `48 96% 53%` (Primary, Accent, Ring)
- **Preto:** `0 0% 0%` (Background dark)
- **Branco:** `0 0% 100%` (Background light)
- **Cinza Escuro:** `240 3.7% 15.9%` (Cards dark)
- **Cinza Claro:** `240 4.8% 95.9%` (Secondary light)

---

## 🔧 Implementação

### Fase 1: Instalar Dependências

#### 1.1. Instalar next-themes
```bash
cd frontend
npm install next-themes
```

**Arquivo:** `frontend/package.json`
- Adicionar `next-themes` às dependências

---

### Fase 2: Criar ThemeProvider

#### 2.1. Criar componente ThemeProvider

**Arquivo:** `frontend/src/components/layout/theme-provider.tsx`

```typescript
"use client"

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

**Características:**
- Wrapper simples para `next-themes`
- Permite passar props customizadas
- Client component (necessário para gerenciar estado)

---

### Fase 3: Criar ThemeToggle

#### 3.1. Criar componente ThemeToggle

**Arquivo:** `frontend/src/components/layout/theme-toggle.tsx`

```typescript
"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Evitar flash de conteúdo incorreto (hydration mismatch)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9">
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="h-9 w-9"
      aria-label="Alternar tema"
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  )
}
```

**Características:**
- Botão com ícone de Sol/Lua
- Alterna entre light e dark
- Evita hydration mismatch
- Acessível (aria-label)

---

### Fase 4: Atualizar Layout Principal

#### 4.1. Integrar ThemeProvider no layout

**Arquivo:** `frontend/src/app/layout.tsx`

**Mudanças:**
1. Importar `ThemeProvider`
2. Envolver `children` com `ThemeProvider`
3. Configurar props:
   - `attribute="class"` - Usa classe CSS para tema
   - `defaultTheme="light"` - Tema padrão
   - `enableSystem={false}` - Não detecta preferência do sistema
   - `disableTransitionOnChange` - Remove transição ao mudar tema

**Antes:**
```typescript
<AppProviders>
  {children}
  <OfflineBanner />
  <PwaUpdater />
  <Toaster />
</AppProviders>
```

**Depois:**
```typescript
<ThemeProvider
  attribute="class"
  defaultTheme="light"
  enableSystem={false}
  disableTransitionOnChange
>
  <AppProviders>
    {children}
    <OfflineBanner />
    <PwaUpdater />
    <Toaster />
  </AppProviders>
</ThemeProvider>
```

---

### Fase 5: Atualizar globals.css

#### 5.1. Verificar e ajustar variáveis CSS

**Arquivo:** `frontend/src/app/globals.css`

**Verificar:**
- ✅ Cores já estão configuradas (amarelo, preto, branco)
- ✅ Variáveis para light e dark mode já existem
- ⚠️ Garantir que todas as variáveis estão corretas

**Cores a confirmar:**
- Primary: `48 96% 53%` (Amarelo) ✅
- Background light: `0 0% 100%` (Branco) ✅
- Background dark: `0 0% 0%` (Preto) ✅
- Foreground light: `240 10% 3.9%` (Quase preto) ✅
- Foreground dark: `0 0% 98%` (Quase branco) ✅

---

### Fase 6: Adicionar ThemeToggle ao Header

#### 6.1. Adicionar botão de tema no AppShell

**Arquivo:** `frontend/src/components/layout/app-shell.tsx`

**Onde adicionar:**
- No header (junto com botão de logout)
- Ou no sidebar (se preferir)

**Exemplo:**
```typescript
import { ThemeToggle } from './theme-toggle';

// No header, junto com outros botões
<div className="flex items-center gap-2">
  <ThemeToggle />
  {/* outros botões */}
</div>
```

#### 6.2. Adicionar ThemeToggle no Header da Landing

**Arquivo:** `frontend/src/components/landing/header.tsx`

**Onde adicionar:**
- No lado direito, junto com botão de Login

---

### Fase 7: Testar e Ajustar

#### 7.1. Testes Necessários

- [ ] Alternar tema funciona (light ↔ dark)
- [ ] Cores aplicadas corretamente em ambos os temas
- [ ] Preferência persiste após reload
- [ ] Não há flash de conteúdo incorreto (FOUC)
- [ ] Funciona em todas as páginas
- [ ] Componentes UI respondem ao tema
- [ ] Landing page responde ao tema
- [ ] Dashboard responde ao tema

#### 7.2. Ajustes de Cores (se necessário)

Verificar se algum componente precisa de ajustes:
- Cards
- Botões
- Inputs
- Bordas
- Sombras

---

## 📦 Arquivos a Criar/Modificar

### Novos Arquivos
1. `frontend/src/components/layout/theme-provider.tsx` - Provider do tema
2. `frontend/src/components/layout/theme-toggle.tsx` - Botão de alternância

### Arquivos a Modificar
1. `frontend/package.json` - Adicionar `next-themes`
2. `frontend/src/app/layout.tsx` - Integrar ThemeProvider
3. `frontend/src/components/layout/app-shell.tsx` - Adicionar ThemeToggle
4. `frontend/src/components/landing/header.tsx` - Adicionar ThemeToggle (opcional)
5. `frontend/src/app/globals.css` - Verificar/ajustar cores (se necessário)

---

## 📝 Checklist de Implementação

### Dependências
- [ ] Instalar `next-themes`

### Componentes
- [ ] Criar `ThemeProvider`
- [ ] Criar `ThemeToggle`

### Integração
- [ ] Adicionar `ThemeProvider` ao layout principal
- [ ] Adicionar `ThemeToggle` ao AppShell
- [ ] Adicionar `ThemeToggle` ao Header da landing (opcional)

### Configuração
- [ ] Verificar cores no `globals.css`
- [ ] Testar alternância de tema
- [ ] Verificar persistência da preferência
- [ ] Testar em todas as páginas

### Ajustes
- [ ] Ajustar cores de componentes se necessário
- [ ] Verificar contraste em ambos os temas
- [ ] Testar responsividade com tema

---

## 🎨 Detalhes de Cores

### Light Mode
```css
--background: 0 0% 100%;           /* Branco */
--foreground: 240 10% 3.9%;        /* Quase preto */
--primary: 48 96% 53%;             /* Amarelo */
--primary-foreground: 240 5.9% 10%; /* Preto */
--card: 0 0% 100%;                 /* Branco */
--border: 240 5.9% 90%;            /* Cinza claro */
```

### Dark Mode
```css
--background: 0 0% 0%;             /* Preto */
--foreground: 0 0% 98%;            /* Quase branco */
--primary: 48 96% 53%;             /* Amarelo (mantém) */
--primary-foreground: 240 5.9% 10%; /* Preto */
--card: 240 3.7% 15.9%;            /* Cinza escuro */
--border: 240 3.7% 15.9%;          /* Cinza escuro */
```

---

## 🚀 Próximos Passos

1. **Instalar dependência** `next-themes`
2. **Criar ThemeProvider** e ThemeToggle
3. **Integrar no layout** principal
4. **Adicionar botão** de alternância nos headers
5. **Testar** funcionamento completo
6. **Ajustar cores** se necessário

---

## 💡 Melhorias Futuras (Opcional)

- Adicionar mais temas (ex: "auto" que detecta preferência do sistema)
- Adicionar animação suave na transição de tema
- Salvar preferência no backend (por usuário)
- Adicionar atalho de teclado para alternar tema
- Criar seletor de tema com mais opções (dropdown)

---

## 📚 Referências

- **Biblioteca:** `next-themes` - https://github.com/pacocoursey/next-themes
- **Projeto base:** `painel-completo/src/components/layout/theme-provider.tsx`
- **Cores:** `painel-completo/src/app/globals.css`

---

## ⚠️ Considerações Importantes

1. **Hydration Mismatch:** Usar `mounted` state no ThemeToggle para evitar erro de hidratação
2. **suppressHydrationWarning:** Adicionar no `<html>` tag se necessário
3. **Transições:** `disableTransitionOnChange` remove animação (mais rápido, menos suave)
4. **Sistema:** `enableSystem={false}` desabilita detecção automática (mais controle)
5. **Persistência:** `next-themes` salva preferência automaticamente no localStorage

