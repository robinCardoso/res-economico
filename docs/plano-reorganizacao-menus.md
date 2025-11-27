# Plano de Reorganização de Menus - Plataforma Modular

## 📋 Contexto

### Situação Atual
- Menu linear com todos os itens no mesmo nível
- 9 itens principais: Dashboard, Uploads, Alertas, Templates, Contas, Empresas, Auditoria, Relatórios, Configurações
- Todos focados no módulo "Resultado Econômico"

### Necessidade Futura
- Sistema em expansão com múltiplos módulos
- Novos módulos: Campanhas, Processos, Importação de Produtos, etc.
- Menu atual não suporta bem a expansão
- Necessidade de organização por módulos/funcionalidades

---

## 🎯 Objetivos

1. **Organizar menus por módulos** para melhor navegação
2. **Criar estrutura escalável** que suporte novos módulos
3. **Manter usabilidade** mesmo com muitos itens
4. **Permitir customização** por perfil de usuário (futuro)

---

## 📐 Estrutura Proposta

### Opção 1: Menu Agrupado por Módulos (Recomendado)

```
📊 Dashboard (geral)
├── Visão Geral
└── Métricas Consolidadas

💰 Resultado Econômico
├── 📤 Uploads
├── 📊 Relatórios
│   ├── Resultado Econômico
│   └── Comparativo
├── 🔔 Alertas
├── 📋 Templates
├── 📑 Contas
└── 📈 Análises

🏢 Gestão
├── 🏛️ Empresas
├── 🏪 Filiais
└── 📝 Auditoria

📢 Campanhas (Futuro)
├── Criar Campanha
├── Campanhas Ativas
├── Histórico
└── Relatórios

⚙️ Processos (Futuro)
├── Garantias
├── Devoluções
├── Rastreamento
└── Histórico

📦 Produtos (Futuro)
├── Importação
├── Catálogo
├── Sincronização
└── Estoque

⚙️ Configurações
├── Modelos de Negócio
├── Perfil
└── Sistema
```

### Opção 2: Menu com Seções Colapsáveis

```
📊 Dashboard
💰 Resultado Econômico ▼
   ├── Uploads
   ├── Relatórios
   ├── Alertas
   └── ...
🏢 Gestão ▼
   ├── Empresas
   ├── Filiais
   └── ...
📢 Campanhas ▼ (Futuro)
⚙️ Processos ▼ (Futuro)
📦 Produtos ▼ (Futuro)
⚙️ Configurações
```

### Opção 3: Menu com Tabs/Segmentação

```
[Dashboard] [Resultado Econômico] [Gestão] [Campanhas] [Processos] [Produtos] [Configurações]
```

---

## 🔧 Implementação Técnica

### Estrutura de Dados Proposta

```typescript
type MenuModule = {
  id: string;
  label: string;
  icon: React.ComponentType;
  href?: string; // Se tiver página própria
  items: NavItem[];
  badge?: string; // Para indicar "Novo" ou contador
  enabled: boolean; // Para módulos futuros
};

const menuModules: MenuModule[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    items: [],
    enabled: true,
  },
  {
    id: 'resultado-economico',
    label: 'Resultado Econômico',
    icon: TrendingUp,
    items: [
      { label: 'Uploads', href: '/uploads', icon: UploadCloud },
      { label: 'Relatórios', href: '/relatorios', icon: FileText },
      { label: 'Alertas', href: '/alertas', icon: BellRing },
      { label: 'Templates', href: '/templates', icon: ClipboardList },
      { label: 'Contas', href: '/contas', icon: Layers3 },
      { label: 'Análises', href: '/analises', icon: BarChart },
    ],
    enabled: true,
  },
  {
    id: 'gestao',
    label: 'Gestão',
    icon: Building,
    items: [
      { label: 'Empresas', href: '/empresas', icon: Building },
      { label: 'Filiais', href: '/filiais', icon: Building2 },
      { label: 'Auditoria', href: '/auditoria', icon: FileText },
    ],
    enabled: true,
  },
  {
    id: 'campanhas',
    label: 'Campanhas',
    icon: Megaphone,
    items: [
      { label: 'Criar Campanha', href: '/campanhas/nova', icon: Plus },
      { label: 'Campanhas Ativas', href: '/campanhas', icon: Activity },
      { label: 'Histórico', href: '/campanhas/historico', icon: History },
    ],
    enabled: false, // Futuro
    badge: 'Em breve',
  },
  {
    id: 'processos',
    label: 'Processos',
    icon: Settings,
    items: [
      { label: 'Garantias', href: '/processos/garantias', icon: Shield },
      { label: 'Devoluções', href: '/processos/devolucoes', icon: RotateCcw },
      { label: 'Rastreamento', href: '/processos/rastreamento', icon: MapPin },
    ],
    enabled: false, // Futuro
    badge: 'Em breve',
  },
  {
    id: 'produtos',
    label: 'Produtos',
    icon: Package,
    items: [
      { label: 'Importação', href: '/produtos/importacao', icon: Upload },
      { label: 'Catálogo', href: '/produtos/catalogo', icon: Book },
      { label: 'Sincronização', href: '/produtos/sincronizacao', icon: RefreshCw },
    ],
    enabled: false, // Futuro
    badge: 'Em breve',
  },
  {
    id: 'configuracoes',
    label: 'Configurações',
    icon: Settings2,
    href: '/configuracoes',
    items: [],
    enabled: true,
  },
];
```

### Componente de Menu Agrupado

```typescript
// Componente para renderizar módulos com subitens
const ModuleMenu = ({ module }: { module: MenuModule }) => {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();
  
  // Verificar se algum item do módulo está ativo
  const isActive = module.items.some(item => pathname?.startsWith(item.href));
  
  if (module.items.length === 0) {
    // Módulo sem subitens (ex: Dashboard, Configurações)
    return (
      <Link href={module.href!}>
        <NavItem item={module} />
      </Link>
    );
  }
  
  return (
    <div>
      <button onClick={() => setExpanded(!expanded)}>
        <ModuleHeader module={module} isActive={isActive} expanded={expanded} />
      </button>
      {expanded && (
        <div className="ml-4">
          {module.items.map(item => (
            <NavItem key={item.href} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};
```

---

## 📋 Checklist de Implementação

### Fase 1: Preparação
- [ ] Definir estrutura de dados para módulos
- [ ] Criar tipos TypeScript para MenuModule
- [ ] Mapear menus atuais para nova estrutura

### Fase 2: Componentes
- [ ] Criar componente ModuleMenu
- [ ] Criar componente ModuleHeader
- [ ] Atualizar AppShell para usar nova estrutura
- [ ] Implementar expansão/colapso de módulos
- [ ] Adicionar indicadores visuais (badges, ícones)

### Fase 3: Migração
- [ ] Migrar menus atuais para estrutura modular
- [ ] Testar navegação
- [ ] Ajustar estilos e responsividade
- [ ] Atualizar MobileNav

### Fase 4: Preparação para Futuro
- [ ] Adicionar módulos futuros (desabilitados)
- [ ] Implementar sistema de badges/indicadores
- [ ] Preparar estrutura para customização por perfil

---

## 🎨 Design

### Visual
- Módulos principais com ícone e label
- Subitens com indentação
- Indicador de expansão (chevron)
- Badge para módulos futuros ("Em breve")
- Destaque visual para módulo ativo

### Interação
- Clique no módulo expande/colapsa
- Clique em item navega para página
- Estado persistido (localStorage) para módulos expandidos
- Animações suaves de expansão

### Responsividade
- Desktop: Menu lateral com módulos expandíveis
- Mobile: Drawer com mesma estrutura
- Touch-friendly para mobile

---

## 🚀 Próximos Passos

1. **Revisar estrutura proposta** e validar com equipe
2. **Definir ícones** para cada módulo
3. **Implementar estrutura base** de dados
4. **Criar componentes** de menu modular
5. **Migrar menus atuais** para nova estrutura
6. **Testar e ajustar** usabilidade

---

## 💡 Melhorias Futuras

- **Customização por perfil:** Usuários podem ocultar/mostrar módulos
- **Favoritos:** Marcar itens de menu como favoritos
- **Busca no menu:** Buscar funcionalidades rapidamente
- **Atalhos de teclado:** Navegação rápida por teclado
- **Histórico:** Mostrar últimos acessados
- **Notificações:** Badges com contadores (ex: 3 alertas novos)

---

## 📚 Referências

- Estrutura atual: `frontend/src/components/layout/app-shell.tsx`
- Componentes UI: `frontend/src/components/ui/`
- Projeto referência: `painel-completo/src/components/layout/`

