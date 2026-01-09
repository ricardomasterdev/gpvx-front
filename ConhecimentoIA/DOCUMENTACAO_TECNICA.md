# GPVx Frontend - Documentacao Tecnica Completa

## Indice

1. [Visao Geral](#visao-geral)
2. [Stack Tecnologica](#stack-tecnologica)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Arquitetura da Aplicacao](#arquitetura-da-aplicacao)
5. [Sistema de Autenticacao](#sistema-de-autenticacao)
6. [Gerenciamento de Estado](#gerenciamento-de-estado)
7. [Roteamento e Navegacao](#roteamento-e-navegacao)
8. [Comunicacao com API](#comunicacao-com-api)
9. [Componentes UI](#componentes-ui)
10. [Services (Camada de Servicos)](#services-camada-de-servicos)
11. [Sistema de Tipos](#sistema-de-tipos)
12. [Funcionalidades Principais](#funcionalidades-principais)
13. [Integracao WhatsApp](#integracao-whatsapp)
14. [Guia de Desenvolvimento](#guia-de-desenvolvimento)

---

## Visao Geral

O **GPVx Frontend** e uma aplicacao Single Page Application (SPA) desenvolvida em React para gerenciamento de gabinetes politicos. O sistema oferece:

- **Gestao de Pessoas**: Cadastro e gerenciamento de cidadaos/liderancas
- **Gestao de Demandas**: Controle de solicitacoes e acompanhamento
- **Dashboard**: Visualizacao de metricas e estatisticas
- **Integracao WhatsApp**: Envio de mensagens e notificacoes
- **Multi-Gabinete**: Suporte a multiplos gabinetes e subgabinetes
- **Controle de Acesso**: Sistema de perfis e permissoes

### Hierarquia de Usuarios

```
Super Administrador
    |
    +-- Gabinete Principal
    |       |
    |       +-- Subgabinete 1
    |       +-- Subgabinete 2
    |
    +-- Outro Gabinete
            |
            +-- Subgabinete A
```

---

## Stack Tecnologica

### Core
| Tecnologia | Versao | Descricao |
|------------|--------|-----------|
| React | 19.2.0 | Biblioteca UI |
| TypeScript | 5.9.3 | Tipagem estatica |
| Vite | 7.2.4 | Build tool e dev server |

### Estado e Data Fetching
| Tecnologia | Versao | Descricao |
|------------|--------|-----------|
| Zustand | 5.0.9 | Gerenciamento de estado global |
| TanStack React Query | 5.90.16 | Cache e sincronizacao de dados |

### Roteamento e Formularios
| Tecnologia | Versao | Descricao |
|------------|--------|-----------|
| React Router DOM | 6.30.2 | Roteamento SPA |
| React Hook Form | 7.69.0 | Gerenciamento de formularios |
| Zod | 4.3.4 | Validacao de schemas |

### UI e Estilizacao
| Tecnologia | Versao | Descricao |
|------------|--------|-----------|
| Tailwind CSS | 3.4.19 | Framework CSS utilitario |
| Headless UI | 2.2.9 | Componentes acessiveis |
| Framer Motion | 12.23.26 | Animacoes |
| Lucide React | 0.562.0 | Biblioteca de icones |
| Recharts | 3.6.0 | Graficos e visualizacoes |

### Comunicacao
| Tecnologia | Versao | Descricao |
|------------|--------|-----------|
| Axios | 1.13.2 | Cliente HTTP |
| Socket.IO Client | 4.8.3 | WebSocket para real-time |

### Utilitarios
| Tecnologia | Versao | Descricao |
|------------|--------|-----------|
| date-fns | 4.1.0 | Manipulacao de datas |
| clsx | 2.1.1 | Utilitario para classes CSS |
| tailwind-merge | 3.4.0 | Merge de classes Tailwind |
| react-hot-toast | 2.6.0 | Notificacoes toast |

---

## Estrutura do Projeto

```
gpvx-front/
├── src/
│   ├── components/           # Componentes reutilizaveis
│   │   ├── admin/           # Componentes administrativos
│   │   │   ├── GabineteFormModal.tsx
│   │   │   ├── SubgabineteFormModal.tsx
│   │   │   ├── UsuarioFormModal.tsx
│   │   │   └── WhatsAppAdminFormModal.tsx
│   │   ├── demandas/        # Componentes de demandas
│   │   │   ├── CategoriaFormModal.tsx
│   │   │   ├── DemandaFormModal.tsx
│   │   │   └── DemandaViewModal.tsx
│   │   ├── layout/          # Componentes de layout
│   │   │   ├── AuthLayout.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── MainLayout.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── pessoas/         # Componentes de pessoas
│   │   │   └── PessoaFormModal.tsx
│   │   ├── regioes/         # Componentes de regioes
│   │   │   ├── RegiaoFormModal.tsx
│   │   │   └── RegiaoViewModal.tsx
│   │   ├── tags/            # Componentes de tags
│   │   │   └── TagFormModal.tsx
│   │   ├── ui/              # Componentes UI base
│   │   │   ├── Avatar.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── ConfirmModal.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── DateInput.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── SearchableSelect.tsx
│   │   │   ├── SearchFilter.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── Textarea.tsx
│   │   ├── usuarios/        # Componentes de usuarios
│   │   │   └── UsuarioGabineteFormModal.tsx
│   │   └── whatsapp/        # Componentes de WhatsApp
│   │       ├── WhatsAppFormModal.tsx
│   │       ├── WhatsAppHistoryModal.tsx
│   │       ├── WhatsAppQRCodeModal.tsx
│   │       ├── WhatsAppSendMessageModal.tsx
│   │       └── WhatsAppSendTestModal.tsx
│   │
│   ├── pages/               # Paginas da aplicacao
│   │   ├── admin/          # Paginas administrativas
│   │   │   ├── GabinetesListPage.tsx
│   │   │   ├── SubgabinetesListPage.tsx
│   │   │   ├── UsuariosListPage.tsx
│   │   │   └── WhatsAppSessionsPage.tsx
│   │   ├── aniversariantes/
│   │   │   └── AniversariantesListPage.tsx
│   │   ├── auth/
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   └── LoginPage.tsx
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx
│   │   ├── demandas/
│   │   │   └── DemandasListPage.tsx
│   │   ├── pessoas/
│   │   │   └── PessoasListPage.tsx
│   │   ├── regioes/
│   │   │   └── RegioesListPage.tsx
│   │   ├── tags/
│   │   │   └── TagsListPage.tsx
│   │   ├── usuarios/
│   │   │   └── UsuariosGabineteListPage.tsx
│   │   └── whatsapp/
│   │       └── WhatsAppListPage.tsx
│   │
│   ├── services/            # Camada de servicos (API)
│   │   ├── admin.service.ts
│   │   ├── aniversariantes.service.ts
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   ├── auxiliar.service.ts
│   │   ├── dashboard.service.ts
│   │   ├── demandas.service.ts
│   │   ├── pessoas.service.ts
│   │   ├── regioes.service.ts
│   │   ├── tags.service.ts
│   │   ├── usuarios.service.ts
│   │   └── whatsapp.service.ts
│   │
│   ├── stores/              # Estado global (Zustand)
│   │   ├── authStore.ts
│   │   └── uiStore.ts
│   │
│   ├── types/               # Definicoes de tipos TypeScript
│   │   └── index.ts
│   │
│   ├── utils/               # Funcoes utilitarias
│   │   ├── cn.ts
│   │   └── masks.ts
│   │
│   ├── App.tsx              # Componente raiz
│   └── main.tsx             # Entry point
│
├── public/                  # Arquivos estaticos
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## Arquitetura da Aplicacao

### Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    React App                         │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │              Pages (Views)                   │    │    │
│  │  │  Dashboard | Pessoas | Demandas | WhatsApp   │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  │                       │                              │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │           Components (UI)                    │    │    │
│  │  │  Modal | Button | Card | DataTable | etc     │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  │                       │                              │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │    │
│  │  │   Zustand   │ │ React Query │ │  Services   │   │    │
│  │  │   Stores    │ │   Cache     │ │   (API)     │   │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘   │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│  ┌─────────────────────┐    ┌─────────────────────┐         │
│  │    Python/FastAPI   │    │   Node.js/Express   │         │
│  │    (API Principal)  │◄──►│   (WhatsApp)        │         │
│  └─────────────────────┘    └─────────────────────┘         │
│              │                        │                      │
│              ▼                        ▼                      │
│  ┌─────────────────────────────────────────────────┐        │
│  │              PostgreSQL Database                 │        │
│  └─────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo de Dados

```
Usuario Interage
       │
       ▼
  Componente React
       │
       ├──► React Query (Cache)
       │         │
       │         ▼
       │    Service Layer
       │         │
       │         ▼
       │    Axios (HTTP)
       │         │
       │         ▼
       │    Backend API
       │
       └──► Zustand Store (Estado Global)
                 │
                 ▼
            Re-render UI
```

---

## Sistema de Autenticacao

### Fluxo de Login

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Login  │───►│ authSvc │───►│   API   │───►│  JWT    │
│  Page   │    │ .login()│    │ /login  │    │ Token   │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
                                                  │
                                                  ▼
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Redirect│◄───│authStore│◄───│ setAuth │◄───│Response │
│ /dashbd │    │ .login()│    │  State  │    │  Data   │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
```

### AuthStore (Zustand)

```typescript
// src/stores/authStore.ts

interface AuthState {
  usuario: Usuario | null;          // Dados do usuario logado
  gabinete: GabineteSimples | null; // Gabinete selecionado
  gabinetes: GabineteSimples[];     // Lista de gabinetes (super user)
  subgabinete: GabineteSimples | null; // Subgabinete selecionado
  subgabinetes: GabineteSimples[]; // Lista de subgabinetes
  token: string | null;            // JWT Access Token
  refreshToken: string | null;     // JWT Refresh Token
  isAuthenticated: boolean;        // Flag de autenticacao
  isLoading: boolean;              // Loading state
}

interface AuthStore extends AuthState {
  login: (usuario, gabinete, token, refreshToken) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  updateUsuario: (usuario: Partial<Usuario>) => void;
  setTokens: (token, refreshToken) => void;
  setGabinete: (gabinete) => void;
  setGabinetes: (gabinetes) => void;
  setSubgabinete: (subgabinete) => void;
  setSubgabinetes: (subgabinetes) => void;
}
```

### Persistencia

O estado de autenticacao e persistido no `localStorage` atraves do middleware `persist` do Zustand:

```typescript
persist(
  (set) => ({ /* ... */ }),
  {
    name: 'gpvx-auth', // Chave no localStorage
    partialize: (state) => ({
      usuario: state.usuario,
      gabinete: state.gabinete,
      gabinetes: state.gabinetes,
      subgabinete: state.subgabinete,
      subgabinetes: state.subgabinetes,
      token: state.token,
      refreshToken: state.refreshToken,
      isAuthenticated: state.isAuthenticated,
    }),
  }
)
```

### Interceptor de Requisicoes

```typescript
// src/services/api.ts

// Adiciona token em todas as requisicoes
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }
);

// Trata erros de autenticacao
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Tipos de Usuario

| Tipo | Descricao | Permissoes |
|------|-----------|------------|
| **Super Usuario** | Administrador do sistema | Acesso total, gerencia gabinetes |
| **Admin Gabinete** | Administrador do gabinete | Gerencia usuarios e subgabinetes |
| **Operador** | Usuario padrao | Acesso completo ao gabinete |
| **Atendente** | Usuario limitado | Apenas visualiza e cria registros |

---

## Gerenciamento de Estado

### Zustand Stores

#### 1. AuthStore (`src/stores/authStore.ts`)

Gerencia estado de autenticacao e contexto do usuario.

**Estados:**
- `usuario`: Dados do usuario logado
- `gabinete`: Gabinete atualmente selecionado
- `gabinetes`: Lista de gabinetes disponiveis (super user)
- `subgabinete`: Subgabinete atualmente selecionado
- `subgabinetes`: Lista de subgabinetes disponiveis
- `token`: JWT access token
- `refreshToken`: JWT refresh token
- `isAuthenticated`: Flag de autenticacao
- `isLoading`: Estado de carregamento

**Acoes:**
- `login()`: Realiza login e configura estado
- `logout()`: Limpa estado de autenticacao
- `setGabinete()`: Altera gabinete selecionado
- `setSubgabinete()`: Altera subgabinete selecionado
- `setTokens()`: Atualiza tokens JWT

#### 2. UIStore (`src/stores/uiStore.ts`)

Gerencia estado da interface.

```typescript
interface UIStore {
  sidebarOpen: boolean;      // Sidebar visivel (mobile)
  sidebarCollapsed: boolean; // Sidebar recolhida
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
}
```

### React Query

Configuracao global:

```typescript
// src/App.tsx

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,                    // Tenta 1 vez em caso de erro
      refetchOnWindowFocus: false, // Nao refetch ao focar janela
      staleTime: 5 * 60 * 1000,   // Dados ficam "frescos" por 5 min
    },
  },
});
```

**Exemplo de uso:**

```typescript
// Buscar dados
const { data, isLoading, isError } = useQuery({
  queryKey: ['pessoas', page, filters],
  queryFn: () => pessoasService.listar(page, filters),
});

// Invalidar cache apos mutacao
const mutation = useMutation({
  mutationFn: (data) => pessoasService.criar(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['pessoas'] });
  },
});
```

---

## Roteamento e Navegacao

### Estrutura de Rotas

```typescript
// src/App.tsx

<Routes>
  {/* Rotas Publicas */}
  <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
  </Route>

  {/* Rotas Protegidas */}
  <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
    {/* Principal */}
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/pessoas" element={<PessoasListPage />} />
    <Route path="/demandas" element={<DemandasListPage />} />
    <Route path="/aniversariantes" element={<AniversariantesListPage />} />

    {/* Gestao */}
    <Route path="/subgabinetes" element={<SubgabinetesListPage />} />
    <Route path="/usuarios" element={<UsuariosGabineteListPage />} />
    <Route path="/tags" element={<TagsListPage />} />
    <Route path="/regioes" element={<RegioesListPage />} />
    <Route path="/whatsapp" element={<WhatsAppListPage />} />

    {/* Administracao (Super Usuario) */}
    <Route path="/admin/gabinetes" element={<GabinetesListPage />} />
    <Route path="/admin/usuarios" element={<UsuariosListPage />} />
    <Route path="/admin/whatsapp" element={<WhatsAppSessionsPage />} />
  </Route>

  {/* Redirecionamentos */}
  <Route path="/" element={<Navigate to="/dashboard" replace />} />
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

### Route Guards

```typescript
// Rota Protegida - Requer autenticacao
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

// Rota Publica - Redireciona se autenticado
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};
```

### Menu de Navegacao (Sidebar)

O menu e dinamico baseado no tipo de usuario:

```typescript
// Menu para usuarios normais
const menuItems = [
  {
    title: 'Principal',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: Users, label: 'Pessoas', path: '/pessoas' },
      { icon: ClipboardList, label: 'Demandas', path: '/demandas' },
      { icon: Cake, label: 'Aniversariantes', path: '/aniversariantes' },
    ],
  },
  {
    title: 'Gestao',
    items: [
      { icon: Layers, label: 'Subgabinetes', path: '/subgabinetes', hideForSubgabinete: true },
      { icon: UserCog, label: 'Usuarios', path: '/usuarios' },
      { icon: Tags, label: 'Tags', path: '/tags' },
      { icon: MapPin, label: 'Regioes', path: '/regioes', hideForSubgabinete: true },
      { icon: MessageSquare, label: 'WhatsApp', path: '/whatsapp' },
    ],
  },
];

// Menu adicional para Super Usuario
const adminMenuItems = [
  {
    title: 'Administracao',
    items: [
      { icon: Building2, label: 'Gabinetes', path: '/admin/gabinetes' },
      { icon: UserCog, label: 'Usuarios', path: '/admin/usuarios' },
      { icon: MessageSquare, label: 'WhatsApp', path: '/admin/whatsapp' },
    ],
  },
];
```

---

## Comunicacao com API

### Configuracao Base

```typescript
// src/services/api.ts

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Padrao de Mapeamento (snake_case <-> camelCase)

A API Python usa `snake_case`, o frontend usa `camelCase`:

```typescript
// Exemplo de mapeamento
function mapUsuarioFromApi(apiUsuario: any): Usuario {
  return {
    id: apiUsuario.id,
    nome: apiUsuario.nome,
    email: apiUsuario.email,
    gabineteId: apiUsuario.gabinete_id,       // snake_case -> camelCase
    perfilId: apiUsuario.perfil_id,
    perfilNome: apiUsuario.perfil_nome,
    fotoUrl: apiUsuario.foto_url,
    superUsuario: apiUsuario.super_usuario,
    isAdminGabinete: apiUsuario.is_admin_gabinete,
    // ...
  };
}

function mapUsuarioToApi(usuario: Usuario): any {
  return {
    nome: usuario.nome,
    email: usuario.email,
    gabinete_id: usuario.gabineteId,          // camelCase -> snake_case
    perfil_id: usuario.perfilId,
    // ...
  };
}
```

### Estrutura de Service

```typescript
// src/services/pessoas.service.ts

export const pessoasService = {
  // Listar com paginacao
  async listar(page = 1, pageSize = 10, filtros?: PessoaFiltros) {
    const { data } = await api.get<any>('/pessoas', {
      params: { page, page_size: pageSize, ...mapFiltrosToApi(filtros) }
    });
    return mapPaginatedResponse(data);
  },

  // Obter por ID
  async obter(id: string) {
    const { data } = await api.get<any>(`/pessoas/${id}`);
    return mapPessoaFromApi(data);
  },

  // Criar
  async criar(pessoa: PessoaCreate) {
    const { data } = await api.post<any>('/pessoas', mapPessoaToApi(pessoa));
    return mapPessoaFromApi(data);
  },

  // Atualizar
  async atualizar(id: string, pessoa: PessoaUpdate) {
    const { data } = await api.put<any>(`/pessoas/${id}`, mapPessoaToApi(pessoa));
    return mapPessoaFromApi(data);
  },

  // Deletar
  async deletar(id: string) {
    await api.delete(`/pessoas/${id}`);
  },
};
```

---

## Componentes UI

### Biblioteca de Componentes

O sistema possui uma biblioteca de componentes reutilizaveis em `src/components/ui/`:

| Componente | Descricao |
|------------|-----------|
| `Button` | Botao com variantes (primary, secondary, outline, ghost) |
| `Input` | Campo de entrada de texto |
| `DateInput` | Campo de data |
| `Textarea` | Area de texto |
| `Select` | Seletor dropdown |
| `SearchableSelect` | Seletor com busca |
| `Card` | Container card com header e content |
| `Badge` | Etiqueta de status |
| `Avatar` | Imagem de perfil com fallback |
| `Modal` | Dialog modal |
| `ConfirmModal` | Modal de confirmacao |
| `DataTable` | Tabela de dados |
| `Pagination` | Controle de paginacao |
| `SearchFilter` | Barra de busca com filtros |
| `Spinner` | Indicador de loading |
| `EmptyState` | Estado vazio |

### Utilitario de Classes CSS

```typescript
// src/utils/cn.ts

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Uso
<div className={cn(
  'base-classes',
  condition && 'conditional-class',
  variant === 'primary' ? 'primary-classes' : 'default-classes'
)} />
```

### Exemplo de Componente Button

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-xl transition-all',
        variantStyles[variant],
        sizeStyles[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Spinner size="sm" className="mr-2" />}
      {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};
```

---

## Services (Camada de Servicos)

### Lista de Services

| Service | Arquivo | Descricao |
|---------|---------|-----------|
| `api` | `api.ts` | Configuracao Axios base |
| `authService` | `auth.service.ts` | Autenticacao e tokens |
| `adminService` | `admin.service.ts` | Funcoes administrativas |
| `pessoasService` | `pessoas.service.ts` | CRUD de pessoas |
| `demandasService` | `demandas.service.ts` | CRUD de demandas |
| `dashboardService` | `dashboard.service.ts` | Dados do dashboard |
| `tagsService` | `tags.service.ts` | CRUD de tags |
| `regioesService` | `regioes.service.ts` | CRUD de regioes |
| `usuariosService` | `usuarios.service.ts` | CRUD de usuarios |
| `whatsappService` | `whatsapp.service.ts` | Integracao WhatsApp |
| `aniversariantesService` | `aniversariantes.service.ts` | Listagem de aniversariantes |
| `auxiliarService` | `auxiliar.service.ts` | Dados auxiliares (estados, cidades) |

### AuthService

```typescript
export const authService = {
  // Login
  async login(credentials: LoginRequest): Promise<LoginResponse>,

  // Logout
  async logout(): Promise<void>,

  // Dados do usuario logado
  async me(): Promise<Usuario>,

  // Refresh token
  async refreshToken(refreshToken: string): Promise<TokenResponse>,

  // Trocar gabinete (super usuario)
  async switchGabinete(gabineteId: string): Promise<TokenResponse>,

  // Trocar subgabinete
  async switchSubgabinete(subgabineteId: string | null): Promise<TokenResponse>,

  // Recuperacao de senha
  async forgotPassword(email: string): Promise<void>,
  async resetPassword(token: string, senha: string): Promise<void>,

  // Listar subgabinetes
  async listarSubgabinetes(): Promise<GabineteSimples[]>,
};
```

### AdminService

```typescript
export const adminService = {
  // Dashboard
  getDashboardStats(): Promise<DashboardStats>,

  // Gabinetes
  listarGabinetes(): Promise<Gabinete[]>,
  obterGabinete(id: string): Promise<Gabinete>,
  criarGabinete(data: GabineteCreate): Promise<Gabinete>,
  atualizarGabinete(id: string, data: GabineteUpdate): Promise<Gabinete>,

  // Usuarios
  listarUsuarios(): Promise<Usuario[]>,
  obterUsuario(id: string): Promise<Usuario>,
  criarUsuario(data: UsuarioCreate): Promise<Usuario>,
  atualizarUsuario(id: string, data: UsuarioUpdate): Promise<Usuario>,

  // Perfis
  listarPerfis(): Promise<Perfil[]>,

  // WhatsApp Sessions (Super Admin)
  listarSessoesWhatsApp(): Promise<WhatsAppSessionItem[]>,
  obterSessaoWhatsApp(id: string): Promise<WhatsAppSessionDetail>,
  criarSessaoWhatsApp(data: WhatsAppSessionCreate): Promise<WhatsAppSessionItem>,
  atualizarSessaoWhatsApp(id: string, data: WhatsAppSessionUpdate): Promise<WhatsAppSessionItem>,
  conectarSessaoWhatsApp(id: string): Promise<ConnectSessionResponse>,
  desconectarSessaoWhatsApp(id: string): Promise<DisconnectSessionResponse>,
  deletarSessaoWhatsApp(id: string): Promise<DeleteSessionResponse>,
};
```

### WhatsAppService

```typescript
export const whatsappService = {
  // Instancias (por gabinete)
  listar(): Promise<WhatsAppInstanciaListItem[]>,
  obter(id: string): Promise<WhatsAppInstanciaResponse>,
  criar(data: WhatsAppInstanciaCreate): Promise<WhatsAppInstanciaResponse>,
  atualizar(id: string, data: WhatsAppInstanciaUpdate): Promise<WhatsAppInstanciaResponse>,
  excluir(id: string): Promise<void>,
  ativar(id: string): Promise<WhatsAppInstanciaResponse>,
  desativar(id: string): Promise<WhatsAppInstanciaResponse>,

  // Conexao
  conectar(sessionId: string): Promise<ConnectResponse>,
  desconectar(sessionId: string): Promise<{ success: boolean; message: string }>,

  // Mensagens
  enviarMensagem(sessionId: string, data: SendMessageRequest): Promise<SendMessageResponse>,
  enviarMensagemParaPessoa(sessionId: string, pessoaId: string, mensagem: string): Promise<SendMessageResponse>,
  listarMensagens(instanciaId: string, page?: number, pageSize?: number, filters?: any): Promise<MensagensListResponse>,
  listarConversas(instanciaId: string): Promise<ConversaResumo[]>,

  // Status
  getStatus(sessionId: string): Promise<SessionStatus>,
  getQRCode(sessionId: string): Promise<QRCodeResponse>,
};
```

---

## Sistema de Tipos

### Tipos Principais

```typescript
// src/types/index.ts

// Enums
export enum StatusDemanda {
  ABERTA = 'aberta',
  EM_ANDAMENTO = 'em_andamento',
  AGUARDANDO = 'aguardando',
  CONCLUIDA = 'concluida',
  CANCELADA = 'cancelada'
}

export enum PrioridadeDemanda {
  BAIXA = 'baixa',
  NORMAL = 'normal',
  ALTA = 'alta',
  URGENTE = 'urgente',
  CRITICA = 'critica'
}

export enum StatusUsuario {
  ATIVO = 'ativo',
  INATIVO = 'inativo',
  BLOQUEADO = 'bloqueado',
  PENDENTE = 'pendente'
}

export enum Genero {
  MASCULINO = 'masculino',
  FEMININO = 'feminino',
  OUTRO = 'outro',
  NAO_INFORMADO = 'nao_informado'
}

// Entidades
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  gabineteId?: string;
  perfilId?: string;
  perfilNome?: string;
  perfilCodigo?: string;
  fotoUrl?: string;
  status: StatusUsuario;
  superUsuario: boolean;
  isAdminGabinete?: boolean;
  pertenceSubgabinete?: boolean;
  gabinetePrincipal?: GabineteSimples;
  subgabineteAtual?: GabineteSimples;
  gabinetes?: GabineteSimples[];
  subgabinetes?: GabineteSimples[];
}

export interface Pessoa {
  id: string;
  gabineteId: string;
  subgabineteId?: string;
  nome: string;
  nomeSocial?: string;
  cpf?: string;
  dataNascimento?: string;
  genero: Genero;
  email?: string;
  telefone?: string;
  celular?: string;
  whatsapp?: string;
  cep?: string;
  logradouro?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  tags?: Tag[];
  ativo: boolean;
}

export interface Demanda {
  id: string;
  gabineteId: string;
  numeroProtocolo: string;
  pessoaId?: string;
  pessoa?: Pessoa;
  categoriaId?: string;
  categoria?: DemandaCategoria;
  status: StatusDemanda;
  prioridade: PrioridadeDemanda;
  titulo: string;
  descricao: string;
  dataAbertura: string;
  dataPrazo?: string;
  dataConclusao?: string;
  responsavelId?: string;
  responsavel?: Usuario;
  tags?: Tag[];
}

export interface Tag {
  id: string;
  gabineteId: string;
  nome: string;
  slug: string;
  cor: string;
  ativo: boolean;
}

// Gabinetes
export interface Gabinete {
  id: string;
  codigo: string;
  nome: string;
  nomeParlamentar: string;
  partido?: string;
  uf?: string;
  logoUrl?: string;
  corPrimaria: string;
  corSecundaria: string;
  ativo: boolean;
}

export interface GabineteSimples {
  id: string;
  codigo: string;
  nome: string;
  nomeParlamentar?: string;
  uf?: string;
  logoUrl?: string;
  gabinetePrincipalId?: string | null;
}

// API Response
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

---

## Funcionalidades Principais

### 1. Dashboard

**Arquivo:** `src/pages/dashboard/DashboardPage.tsx`

O dashboard possui duas visualizacoes:

#### Super Usuario (sem gabinete selecionado)
- Total de gabinetes
- Total de usuarios
- Total de pessoas
- Total de demandas
- Acesso rapido a administracao

#### Gabinete/Subgabinete
- Estatisticas do gabinete
- Demandas abertas/atrasadas/concluidas
- Aniversariantes do dia
- Ultimos cadastros
- Demandas recentes

### 2. Gestao de Pessoas

**Arquivo:** `src/pages/pessoas/PessoasListPage.tsx`

Funcionalidades:
- Listagem paginada
- Busca por nome/CPF/email
- Filtros por cidade, bairro, tags
- Cadastro/edicao via modal
- Vinculo com liderancas
- Gestao de tags
- Ativar/desativar
- Envio de WhatsApp

### 3. Gestao de Demandas

**Arquivo:** `src/pages/demandas/DemandasListPage.tsx`

Funcionalidades:
- Listagem com filtros de status/prioridade
- Busca por protocolo/titulo
- Cadastro/edicao via modal
- Vinculo com pessoas
- Categorias personalizaveis
- Andamentos e historico
- SLA e alertas de atraso

### 4. Aniversariantes

**Arquivo:** `src/pages/aniversariantes/AniversariantesListPage.tsx`

Funcionalidades:
- Listagem de aniversariantes do dia/semana/mes
- Filtro por periodo
- Envio de mensagens de felicitacao
- Integracao com WhatsApp

### 5. Tags e Regioes

Modulos para classificacao e organizacao:
- Tags com cores personalizaveis
- Regioes geograficas
- Vinculo com pessoas e demandas

---

## Integracao WhatsApp

### Arquitetura

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│    Frontend React   │────►│   Backend Python    │────►│  Node.js WhatsApp   │
│                     │     │     (FastAPI)       │     │   (whatsapp-web.js) │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
                                     │                           │
                                     ▼                           ▼
                            ┌─────────────────────────────────────────────┐
                            │              PostgreSQL Database            │
                            │  (whatsapp_instancias, whatsapp_mensagens)  │
                            └─────────────────────────────────────────────┘
```

### Fluxo de Conexao

1. Usuario cria instancia de WhatsApp
2. Sistema gera QR Code via Node.js
3. Usuario escaneia QR Code
4. Sessao e persistida para reconexao automatica
5. Mensagens sao sincronizadas em tempo real

### WebSocket (Socket.IO)

```typescript
// Conexao WebSocket para eventos em tempo real
const socket = io(WHATSAPP_API_URL, {
  auth: { token: getToken() }
});

// Eventos
socket.on('session:qr', ({ sessionId, qrCode }) => { /* ... */ });
socket.on('session:status', (status) => { /* ... */ });
socket.on('message:received', (message) => { /* ... */ });
socket.on('message:sent', (message) => { /* ... */ });
```

### Componentes WhatsApp

| Componente | Descricao |
|------------|-----------|
| `WhatsAppListPage` | Lista de instancias do gabinete |
| `WhatsAppFormModal` | Criar/editar instancia |
| `WhatsAppQRCodeModal` | Exibir QR Code para conexao |
| `WhatsAppSendMessageModal` | Enviar mensagem individual |
| `WhatsAppSendTestModal` | Testar envio de mensagem |
| `WhatsAppHistoryModal` | Historico de mensagens |
| `WhatsAppAdminFormModal` | Gerenciamento admin (super user) |
| `WhatsAppSessionsPage` | Todas as sessoes (super user) |

---

## Guia de Desenvolvimento

### Comandos

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para producao
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
```

### Variaveis de Ambiente

```env
# .env
VITE_API_URL=http://localhost:8000/api/v1
VITE_WHATSAPP_API_URL=http://localhost:3001/api/whatsapp
```

### Convenções de Código

1. **Nomenclatura:**
   - Componentes: PascalCase (`UserProfile.tsx`)
   - Services: camelCase com sufixo `.service.ts`
   - Stores: camelCase com sufixo `Store.ts`
   - Tipos: PascalCase

2. **Estrutura de Componente:**
```typescript
import React from 'react';
import { /* deps */ } from '...';

// Tipos
interface Props { /* ... */ }

// Componente
export const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  // Hooks
  const [state, setState] = useState();

  // Handlers
  const handleClick = () => { /* ... */ };

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

3. **Services:**
   - Sempre mapear snake_case <-> camelCase
   - Tratar erros de forma consistente
   - Retornar tipos tipados

4. **React Query:**
   - Usar `queryKey` descritivas
   - Invalidar cache apos mutacoes
   - Configurar `staleTime` apropriado

### Adicionando Nova Funcionalidade

1. **Criar tipos** em `src/types/index.ts`
2. **Criar service** em `src/services/`
3. **Criar componentes** em `src/components/`
4. **Criar pagina** em `src/pages/`
5. **Adicionar rota** em `src/App.tsx`
6. **Adicionar ao menu** em `src/components/layout/Sidebar.tsx`

---

## Conclusao

O GPVx Frontend e uma aplicacao React moderna e bem estruturada, seguindo boas praticas de desenvolvimento:

- **Tipagem forte** com TypeScript
- **Gerenciamento de estado** eficiente com Zustand + React Query
- **Componentizacao** reutilizavel
- **Autenticacao robusta** com JWT
- **Integracao real-time** com WebSocket
- **Design responsivo** com Tailwind CSS

Para duvidas ou sugestoes, entre em contato com a equipe de desenvolvimento.
