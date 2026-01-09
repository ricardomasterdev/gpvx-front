# GPVx - Infraestrutura e Configuracao de Servidores

## Indice

1. [Visao Geral da Arquitetura](#visao-geral-da-arquitetura)
2. [Servidores e Portas](#servidores-e-portas)
3. [Estrutura de Pastas](#estrutura-de-pastas)
4. [Configuracoes de Ambiente](#configuracoes-de-ambiente)
5. [SSL e Certificados](#ssl-e-certificados)
6. [Gerenciamento de Processos (PM2)](#gerenciamento-de-processos-pm2)
7. [Banco de Dados](#banco-de-dados)
8. [Fluxo de Requisicoes](#fluxo-de-requisicoes)
9. [WebSocket e Tempo Real](#websocket-e-tempo-real)
10. [Troubleshooting](#troubleshooting)
11. [Comandos Uteis](#comandos-uteis)

---

## Visao Geral da Arquitetura

O sistema GPVx e composto por **3 aplicacoes principais** que trabalham em conjunto:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ARQUITETURA GPVx                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐ │
│   │   FRONTEND       │      │   BACKEND        │      │   WHATSAPP       │ │
│   │   (React/Vite)   │      │   (Python/Fast)  │      │   (Node.js)      │ │
│   │                  │      │                  │      │                  │ │
│   │   C:\gpvx-front  │      │   C:\gpvx-back   │      │ C:\GPVx-Whatsapp │ │
│   │                  │      │                  │      │                  │ │
│   │   Porta: 5173    │      │   Porta: 8000    │      │ HTTP: 3001       │ │
│   │   (dev)          │      │   (HTTPS)        │      │ HTTPS: 3004      │ │
│   └────────┬─────────┘      └────────┬─────────┘      └────────┬─────────┘ │
│            │                         │                         │           │
│            │    ┌────────────────────┴────────────────────┐    │           │
│            │    │                                         │    │           │
│            └────►        PostgreSQL (Porta 5432)         ◄────┘           │
│                 │        Host: 177.136.244.5              │                │
│                 │        Database: gpvx                   │                │
│                 │        Schema: gpvx                     │                │
│                 └─────────────────────────────────────────┘                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Dominios em Producao

| Servico | Dominio | Porta |
|---------|---------|-------|
| Frontend | `gpvx.cdxsistemas.com.br` | 443 |
| Backend API | `api-gpvx.cdxsistemas.com.br` | 8000 |
| WhatsApp API | `ws-gpvx.cdxsistemas.com.br` | 3004 (HTTPS) |
| WhatsApp Interno | localhost | 3001 (HTTP) |

---

## Servidores e Portas

### Frontend (React + Vite)

| Ambiente | URL | Porta |
|----------|-----|-------|
| Desenvolvimento | `https://localhost` | 5173 |
| Producao | `https://gpvx.cdxsistemas.com.br` | 443 |

**Tecnologias:**
- React 18
- Vite (bundler)
- TypeScript
- Tailwind CSS
- Socket.IO Client

### Backend (Python + FastAPI)

| Ambiente | URL | Porta |
|----------|-----|-------|
| Desenvolvimento | `https://localhost:8000` | 8000 |
| Producao | `https://api-gpvx.cdxsistemas.com.br` | 8000 |

**Tecnologias:**
- Python 3.11+
- FastAPI
- SQLAlchemy
- PostgreSQL
- JWT Authentication

### WhatsApp Service (Node.js)

| Ambiente | Protocolo | Porta | Uso |
|----------|-----------|-------|-----|
| Producao | HTTP | 3001 | Comunicacao interna (Backend Python) |
| Producao | HTTPS | 3004 | Comunicacao externa (Frontend, WebSocket) |
| Desenvolvimento | HTTP | 3002 | Desenvolvimento local |

**Tecnologias:**
- Node.js
- Express
- Socket.IO
- whatsapp-web.js (Puppeteer)
- PostgreSQL

**Importante:** O servidor WhatsApp possui **DUAL SERVER**:
- Porta 3001: HTTP interno (usado pelo Backend Python via localhost)
- Porta 3004: HTTPS externo (usado pelo Frontend via dominio publico)

---

## Estrutura de Pastas

### Frontend (C:\gpvx-front)

```
C:\gpvx-front\
├── ConhecimentoIA\          # Documentacao para IA/Analistas
│   ├── SISTEMA.md           # Visao geral do sistema
│   ├── DOCUMENTACAO_TECNICA.md  # Detalhes tecnicos do frontend
│   └── INFRAESTRUTURA.md    # Este arquivo
├── dist\                    # Build de producao
│   └── assets\              # JS/CSS minificados
├── src\
│   ├── components\          # Componentes React reutilizaveis
│   ├── pages\               # Paginas da aplicacao
│   ├── services\            # Servicos de API
│   │   ├── api.ts           # Cliente HTTP base
│   │   └── whatsapp.service.ts  # Servico WhatsApp
│   ├── stores\              # Estado global (Zustand)
│   ├── types\               # Tipos TypeScript
│   └── utils\               # Utilitarios
├── .env                     # Variaveis desenvolvimento
├── .env.production          # Variaveis producao
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### Backend (C:\gpvx-back)

```
C:\gpvx-back\
├── app\
│   ├── api\
│   │   └── endpoints\       # Rotas da API
│   │       ├── auth.py      # Autenticacao
│   │       ├── pessoas.py   # CRUD Pessoas
│   │       ├── demandas.py  # CRUD Demandas
│   │       └── whatsapp.py  # Proxy WhatsApp
│   ├── core\
│   │   ├── config.py        # Configuracoes
│   │   ├── security.py      # JWT/Hashing
│   │   └── database.py      # Conexao DB
│   ├── models\              # Modelos SQLAlchemy
│   └── schemas\             # Schemas Pydantic
├── .env
├── .env.production
├── requirements.txt
└── main.py
```

### WhatsApp Service (C:\GPVx-Whatsapp)

```
C:\GPVx-Whatsapp\
├── src\
│   ├── config\
│   │   ├── index.js         # Configuracoes (carrega .env)
│   │   └── swagger.js       # Documentacao API
│   ├── middleware\
│   │   └── auth.js          # Autenticacao JWT
│   ├── routes\
│   │   └── whatsapp.routes.js  # Rotas da API
│   ├── services\
│   │   └── whatsapp.service.js # Logica WhatsApp
│   ├── utils\
│   │   └── logger.js        # Winston logger
│   └── index.js             # Entry point (DUAL SERVER)
├── sessions\                # Dados das sessoes WhatsApp
│   └── [session-id]\        # Pasta por sessao
├── logs\                    # Logs da aplicacao
├── server.key               # Certificado SSL (chave privada)
├── server.crt               # Certificado SSL (certificado)
├── .env                     # Variaveis desenvolvimento
├── .env.production          # Variaveis producao
└── package.json
```

---

## Configuracoes de Ambiente

### Frontend (.env.production)

```env
# GPVx Frontend - Configuracoes de Producao
VITE_API_URL=https://api-gpvx.cdxsistemas.com.br:8000/api/v1
VITE_WHATSAPP_API_URL=https://ws-gpvx.cdxsistemas.com.br:3004/api/whatsapp
VITE_WHATSAPP_WS_URL=https://ws-gpvx.cdxsistemas.com.br:3004
VITE_APP_NAME=GPVx
VITE_APP_VERSION=1.0.0
```

### Frontend (.env - Desenvolvimento)

```env
VITE_API_URL=https://localhost:8000/api/v1
VITE_WHATSAPP_API_URL=https://localhost:3001/api/whatsapp
VITE_WHATSAPP_WS_URL=https://localhost:3001
VITE_APP_NAME=GPVx
VITE_APP_VERSION=1.0.0
```

### Backend Python (app/core/config.py)

```python
# Configuracoes importantes
WHATSAPP_NODE_URL: str = "http://localhost:3001"  # HTTP interno!
DATABASE_URL: str = "postgresql://..."
SECRET_KEY: str = "..."
```

### WhatsApp Service (.env.production)

```env
# Servidor
PORT=3001
NODE_ENV=production

# JWT (mesma chave do backend Python!)
SECRET_KEY=gpvx-super-secret-key-change-in-production-2024

# Banco de Dados PostgreSQL
DB_HOST=177.136.244.5
DB_PORT=5432
DB_NAME=gpvx
DB_USER=codex
DB_PASSWORD=***
DB_SCHEMA=gpvx

# Backend Python (webhooks)
BACKEND_URL=http://localhost:8000/api/v1

# WhatsApp
SESSIONS_PATH=./sessions
PUPPETEER_HEADLESS=true

# SSL/HTTPS - Certificados Let's Encrypt
SSL_KEYFILE=server.key
SSL_CERTFILE=server.crt
```

**Regra Importante:** O `SECRET_KEY` DEVE ser identico entre Backend Python e WhatsApp Service para validacao JWT funcionar.

---

## SSL e Certificados

### Certificados Let's Encrypt

O sistema utiliza certificados Let's Encrypt com multiplos dominios (SAN - Subject Alternative Names):

```
Dominios no Certificado:
- api-gpvx.cdxsistemas.com.br
- api-sgs.cdxsistemas.com.br
- gpvx.cdxsistemas.com.br
- sgs.cdxsistemas.com.br
- ws-gpvx.cdxsistemas.com.br
- ws-sgs.cdxsistemas.com.br
```

### Localizacao dos Certificados

| Servico | Arquivo Key | Arquivo Cert |
|---------|-------------|--------------|
| GPVx WhatsApp | `C:\GPVx-Whatsapp\server.key` | `C:\GPVx-Whatsapp\server.crt` |
| SGSx WhatsApp | `C:\SGSx-Whatsapp\server.key` | `C:\SGSx-Whatsapp\server.crt` |

**Nota:** Os certificados sao compartilhados entre GPVx e SGSx pois ambos os dominios estao no mesmo certificado.

### Verificar Certificado

```bash
# Ver informacoes do certificado
openssl x509 -in server.crt -text -noout

# Ver dominios (SAN)
openssl x509 -in server.crt -text -noout | grep DNS

# Ver validade
openssl x509 -in server.crt -dates -noout
```

### Renovacao de Certificados

Os certificados Let's Encrypt expiram a cada 90 dias. Apos renovar:

1. Copiar novos certificados para as pastas dos servicos
2. Reiniciar os servicos (PM2)

```bash
# Copiar certificados atualizados
cp /path/to/letsencrypt/live/domain/privkey.pem C:\GPVx-Whatsapp\server.key
cp /path/to/letsencrypt/live/domain/fullchain.pem C:\GPVx-Whatsapp\server.crt

# Reiniciar servico
npx pm2 restart gpvx-whatsapp
```

---

## Gerenciamento de Processos (PM2)

### Iniciar Servico WhatsApp em Producao

```bash
cd C:\GPVx-Whatsapp

# Definir NODE_ENV e iniciar
set NODE_ENV=production
npx pm2 start src/index.js --name "gpvx-whatsapp"

# Ou em uma linha (Git Bash)
NODE_ENV=production npx pm2 start src/index.js --name "gpvx-whatsapp"
```

### Comandos PM2 Essenciais

```bash
# Listar processos
npx pm2 list

# Ver logs em tempo real
npx pm2 logs gpvx-whatsapp

# Ver ultimas N linhas de log
npx pm2 logs gpvx-whatsapp --lines 50 --nostream

# Reiniciar servico
npx pm2 restart gpvx-whatsapp

# Parar servico
npx pm2 stop gpvx-whatsapp

# Remover servico
npx pm2 delete gpvx-whatsapp

# Salvar configuracao para restart automatico
npx pm2 save

# Configurar startup automatico
npx pm2 startup
```

### Verificar Status do Servidor

```bash
# Health check
curl -k https://localhost:3004/health

# Resposta esperada:
# {"status":"ok","environment":"production","ports":{"internal":3001,"external":3004}}
```

---

## Banco de Dados

### Conexao PostgreSQL

| Parametro | Valor |
|-----------|-------|
| Host | 177.136.244.5 |
| Porta | 5432 |
| Database | gpvx |
| Schema | gpvx |
| Usuario | codex |

### Tabelas Principais (Schema gpvx)

```sql
-- Sessoes WhatsApp
gpvx.whatsapp_sessions (
    id UUID PRIMARY KEY,
    gabinete_id UUID,
    session_name VARCHAR,
    phone_number VARCHAR,
    status VARCHAR,  -- 'disconnected', 'connecting', 'connected'
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)

-- Mensagens WhatsApp
gpvx.whatsapp_messages (
    id UUID PRIMARY KEY,
    session_id UUID,
    message_id VARCHAR,
    from_number VARCHAR,
    to_number VARCHAR,
    body TEXT,
    type VARCHAR,
    status VARCHAR,
    created_at TIMESTAMP
)

-- Pessoas
gpvx.pessoas (
    id UUID PRIMARY KEY,
    gabinete_id UUID,
    nome VARCHAR,
    telefone VARCHAR,
    email VARCHAR,
    -- ... outros campos
)
```

---

## Fluxo de Requisicoes

### Envio de Mensagem WhatsApp

```
┌──────────┐    HTTPS:3004    ┌──────────────┐
│ Frontend │ ──────────────►  │ WhatsApp     │
│ (React)  │                  │ Service      │
└──────────┘                  │ (Node.js)    │
     │                        └──────┬───────┘
     │                               │
     │                               ▼
     │                        ┌──────────────┐
     │                        │ whatsapp-    │
     │                        │ web.js       │
     │                        │ (Puppeteer)  │
     │                        └──────┬───────┘
     │                               │
     │                               ▼
     │                        ┌──────────────┐
     │                        │ WhatsApp     │
     │                        │ Web          │
     │                        └──────────────┘
     │
     │  HTTP:8000             ┌──────────────┐
     └──────────────────────► │ Backend      │
                              │ (FastAPI)    │
                              └──────────────┘
```

### Autenticacao JWT

1. Usuario faz login no Frontend
2. Backend Python valida credenciais e retorna JWT
3. Frontend armazena JWT e envia em todas requisicoes
4. Backend e WhatsApp Service validam JWT com mesma SECRET_KEY

```
Header de Autenticacao:
Authorization: Bearer <jwt_token>
```

---

## WebSocket e Tempo Real

### Conexao Socket.IO

O Frontend conecta via WebSocket para receber eventos em tempo real:

```typescript
// Frontend: src/services/whatsapp.service.ts
const socket = io(WHATSAPP_WS_URL, {
  auth: { token: getToken() },
  transports: ['websocket', 'polling']
});
```

### Eventos Socket.IO

| Evento | Direcao | Descricao |
|--------|---------|-----------|
| `session:qr` | Server → Client | QR Code para escanear |
| `session:status` | Server → Client | Status da sessao |
| `session:authenticated` | Server → Client | Sessao autenticada |
| `session:ready` | Server → Client | Sessao pronta para uso |
| `session:disconnected` | Server → Client | Sessao desconectada |
| `message:received` | Server → Client | Nova mensagem recebida |
| `session:join` | Client → Server | Entrar na sala da sessao |
| `session:leave` | Client → Server | Sair da sala da sessao |
| `session:request-qr` | Client → Server | Solicitar QR Code |

### Salas (Rooms)

```javascript
// Sala por sessao
socket.join(`session:${sessionId}`);

// Sala por gabinete
socket.join(`gabinete:${gabineteId}`);
```

---

## Troubleshooting

### Erro: ERR_SSL_PROTOCOL_ERROR

**Causa:** Certificados SSL nao encontrados ou invalidos.

**Solucao:**
1. Verificar se `server.key` e `server.crt` existem na pasta do servico
2. Verificar se o certificado nao expirou
3. Reiniciar o servico em modo producao

```bash
# Verificar certificados
ls -la C:\GPVx-Whatsapp\server.key C:\GPVx-Whatsapp\server.crt

# Copiar do SGSx se necessario (mesmo certificado)
cp C:\SGSx-Whatsapp\server.key C:\GPVx-Whatsapp\
cp C:\SGSx-Whatsapp\server.crt C:\GPVx-Whatsapp\

# Reiniciar
npx pm2 restart gpvx-whatsapp
```

### Erro: Servidor iniciando em modo Development

**Causa:** NODE_ENV nao definido como 'production'.

**Solucao:**
```bash
# Parar servico
npx pm2 delete gpvx-whatsapp

# Iniciar com NODE_ENV correto
set NODE_ENV=production
npx pm2 start src/index.js --name "gpvx-whatsapp"
```

### Erro: Porta ja em uso

**Causa:** Outro processo usando a porta.

**Solucao:**
```bash
# Verificar quem usa a porta
netstat -ano | findstr :3001
netstat -ano | findstr :3004

# Matar processo (substituir PID)
taskkill /PID <numero> /F
```

### Erro: JWT Token Invalid

**Causa:** SECRET_KEY diferente entre Backend e WhatsApp Service.

**Solucao:**
1. Verificar `SECRET_KEY` em `C:\gpvx-back\.env.production`
2. Verificar `SECRET_KEY` em `C:\GPVx-Whatsapp\.env.production`
3. Devem ser IDENTICAS

### Erro: Sessao WhatsApp nao restaura

**Causa:** Pasta de sessao corrompida ou ausente.

**Solucao:**
```bash
# Verificar pasta de sessoes
ls -la C:\GPVx-Whatsapp\sessions\

# Se corrompida, remover e criar nova sessao
rm -rf C:\GPVx-Whatsapp\sessions\<session-id>
```

### Erro: Puppeteer/Chrome nao inicia

**Causa:** Chromium nao instalado ou sem permissao.

**Solucao:**
```bash
# Reinstalar dependencias
cd C:\GPVx-Whatsapp
npm install

# Verificar se Chromium existe
ls -la node_modules/puppeteer/.local-chromium/
```

---

## Comandos Uteis

### Verificar Portas Ativas

```bash
netstat -ano | findstr "LISTENING" | findstr ":3001 :3004 :8000 :5432"
```

### Verificar Logs do WhatsApp

```bash
# Tempo real
npx pm2 logs gpvx-whatsapp

# Ultimas 100 linhas
npx pm2 logs gpvx-whatsapp --lines 100 --nostream

# Arquivos de log
cat C:\GPVx-Whatsapp\logs\combined.log
cat C:\GPVx-Whatsapp\logs\error.log
```

### Testar Endpoints

```bash
# Health check
curl -k https://localhost:3004/health

# Listar sessoes (precisa token)
curl -k -H "Authorization: Bearer <token>" https://localhost:3004/api/whatsapp/sessions

# Swagger UI
# Abrir no navegador: https://localhost:3004/api-docs
```

### Rebuild Frontend

```bash
cd C:\gpvx-front

# Desenvolvimento
npm run dev

# Producao
npm run build
```

### Reiniciar Todos os Servicos

```bash
# WhatsApp
npx pm2 restart gpvx-whatsapp

# Backend Python (se usando uvicorn)
# Depende de como foi configurado

# Frontend (se servindo com servidor)
# Geralmente e estatico via nginx/apache
```

---

## Checklist de Deploy

### Antes de Subir para Producao

- [ ] Certificados SSL validos e nao expirados
- [ ] `server.key` e `server.crt` na pasta do servico
- [ ] `.env.production` configurado corretamente
- [ ] `SECRET_KEY` identica em todos os servicos
- [ ] `NODE_ENV=production` definido
- [ ] Banco de dados acessivel
- [ ] Portas 3001 e 3004 liberadas no firewall
- [ ] PM2 configurado para restart automatico

### Apos Deploy

- [ ] Verificar logs: `npx pm2 logs gpvx-whatsapp`
- [ ] Testar health check: `curl -k https://localhost:3004/health`
- [ ] Testar conexao WebSocket
- [ ] Testar envio de mensagem de teste
- [ ] Verificar restauracao de sessoes

---

## Comparacao GPVx vs SGSx

### Visao Geral dos Dois Sistemas

O servidor hospeda **dois sistemas distintos** que compartilham a mesma arquitetura:

| Sistema | Descricao | Dominio de Negocio |
|---------|-----------|-------------------|
| **GPVx** | Gabinete Parlamentar Virtual | Gestao de gabinetes politicos |
| **SGSx** | Sistema de Gestao de Saloes | Gerenciamento de saloes de beleza |

### Estrutura dos Repositorios

#### GPVx (Gabinete Politico)
```
C:\gpvx-front\        - Frontend React/Vite
C:\gpvx-back\         - Backend FastAPI/Python
C:\GPVx-Whatsapp\     - Servico Node.js WhatsApp
```

#### SGSx (Salao de Beleza)
```
C:\sgs-front\         - Frontend React/Vite
C:\sgs-back\          - Backend FastAPI/Python
C:\SGSx-Whatsapp\     - Servico Node.js WhatsApp
```

### Mapeamento de Portas

| Servico | GPVx | SGSx |
|---------|------|------|
| Frontend Dev | 5173/5174 | 5173 |
| Backend API | 8000 | 8001 |
| WhatsApp HTTP (interno) | 3001 | 3003 |
| WhatsApp HTTPS (externo) | 3004 | 3003 (HTTPS) |
| PostgreSQL | 5432 | 5432 |

### Bancos de Dados

| Sistema | Database | Schema |
|---------|----------|--------|
| GPVx | gpvx | gpvx |
| SGSx | sgsx | sgsx |

Ambos usam o mesmo servidor PostgreSQL (177.136.244.5:5432) mas databases/schemas separados.

### Dominios de Producao

| Sistema | Frontend | API | WhatsApp |
|---------|----------|-----|----------|
| GPVx | gpvx.cdxsistemas.com.br | api-gpvx.cdxsistemas.com.br | ws-gpvx.cdxsistemas.com.br |
| SGSx | sgs.cdxsistemas.com.br | api-sgs.cdxsistemas.com.br | ws-sgs.cdxsistemas.com.br |

### Certificados SSL Compartilhados

Ambos sistemas usam o **mesmo certificado Let's Encrypt** com multiplos dominios (SAN):

```
Dominios no Certificado:
- api-gpvx.cdxsistemas.com.br
- api-sgs.cdxsistemas.com.br
- gpvx.cdxsistemas.com.br
- sgs.cdxsistemas.com.br
- ws-gpvx.cdxsistemas.com.br
- ws-sgs.cdxsistemas.com.br
```

**Localizacao dos certificados:**
- `C:\GPVx-Whatsapp\server.key` e `server.crt`
- `C:\SGSx-Whatsapp\server.key` e `server.crt`

**Nota:** Os arquivos sao identicos, pois o mesmo certificado cobre todos os dominios.

### Diferencas de Dominio de Negocio

| Conceito | GPVx (Gabinete) | SGSx (Salao) |
|----------|-----------------|--------------|
| Entidade Principal | Gabinete | Salao |
| Clientes | Cidadaos/Contribuintes | Clientes do salao |
| Atendimentos | Demandas/Ocorrencias | Comandas |
| Profissionais | Assessores | Colaboradores |
| Subentidades | Subgabinetes | Filiais |
| Tags/Classificacao | Liderancas | Servicos |

### Codigo Compartilhado

Ambos projetos seguem a **mesma arquitetura** e podem compartilhar:
- Componentes UI (Button, Modal, DataTable, etc.)
- Estrutura de services (api.ts, auth.service.ts)
- Logica de autenticacao JWT
- Integracao WhatsApp
- Padroes de codigo

---

## Tecnologias Detalhadas

### Frontend (React + Vite)

```
Dependencias Principais:
- react: ^18.x          # Biblioteca UI
- typescript: ^5.x      # Tipagem estatica
- vite: ^5.x            # Build tool
- tailwindcss: ^3.x     # Framework CSS
- @tanstack/react-query # Estado servidor
- zustand               # Estado global
- react-router-dom      # Roteamento
- axios                 # Cliente HTTP
- socket.io-client      # WebSocket
- lucide-react          # Icones
- date-fns              # Datas
- react-hot-toast       # Notificacoes
```

### Backend (Python + FastAPI)

```
Dependencias Principais:
- python: 3.11+
- fastapi              # Framework web async
- sqlalchemy: 2.0      # ORM async
- asyncpg              # Driver async PostgreSQL
- pydantic: v2         # Validacao
- python-jose          # JWT
- passlib + bcrypt     # Hash senhas
- httpx                # Cliente HTTP async
- alembic              # Migracoes
```

### WhatsApp Service (Node.js)

```
Dependencias Principais:
- node: 18+
- express              # Framework web
- whatsapp-web.js      # API WhatsApp
- puppeteer            # Automacao browser
- socket.io            # WebSocket
- jsonwebtoken         # JWT
- pg                   # PostgreSQL
- winston              # Logging
- qrcode               # QR codes
- swagger-ui-express   # Documentacao API
```

---

## Autenticacao e Seguranca

### JWT (JSON Web Tokens)

O sistema usa JWT com refresh tokens:

```
Fluxo de Autenticacao:
1. Login: POST /auth/login
2. Resposta: { access_token, refresh_token }
3. Requests: Authorization: Bearer {access_token}
4. Refresh: POST /auth/refresh
```

### SECRET_KEY Compartilhada

**CRITICO:** Backend Python e WhatsApp Service DEVEM usar a mesma `SECRET_KEY`:

```python
# Backend Python (.env)
SECRET_KEY=gpvx-super-secret-key-change-in-production-2024

# WhatsApp Node (.env.production)
SECRET_KEY=gpvx-super-secret-key-change-in-production-2024
```

### Perfis de Usuario

| Codigo | Nivel | Descricao |
|--------|-------|-----------|
| super_admin | 100 | Acesso total ao sistema |
| admin | 80 | Admin do gabinete/salao |
| gerente | 60 | Gerente |
| atendente | 40 | Atendente |
| caixa | 20 | Caixa (somente SGSx) |

---

## Multi-Tenancy

### Isolamento de Dados

O sistema e **multi-tenant** baseado em `gabinete_id` (GPVx) ou `salao_id` (SGSx):

- Cada entidade tem seus proprios dados isolados
- Usuarios podem ter acesso a multiplas entidades
- Super Admin tem acesso a todas entidades
- Subentidades herdam do principal

### ID do Sistema

Existe um ID especial para recursos do sistema:

```python
# GPVx
GABINETE_SISTEMA_ID = UUID('00000000-0000-0000-0000-000000000000')

# SGSx
SALAO_SISTEMA_ID = UUID('00000000-0000-0000-0000-000000000000')
```

Sessoes WhatsApp com ID nulo ou sistema sao consideradas "gerais".

---

## Fluxo WhatsApp Detalhado

### Conexao de Sessao

```
1. Usuario clica "Conectar WhatsApp"
2. Frontend: POST /api/whatsapp/sessions
3. Backend cria registro no banco
4. Backend: POST node:3001/sessions/{id}/connect
5. Node inicia Puppeteer + whatsapp-web.js
6. Node gera QR Code
7. Node emite Socket.IO: session:qr
8. Frontend exibe QR Code
9. Usuario escaneia com celular
10. WhatsApp autentica
11. Node emite: session:authenticated
12. Node emite: session:ready
13. Frontend atualiza status para "conectada"
```

### Envio de Mensagem

```
1. Frontend: POST /api/whatsapp/sessions/{id}/send
   Body: { to: "5511999999999", message: "Texto" }
2. Node recebe e valida JWT
3. Node formata telefone brasileiro
4. whatsapp-web.js envia mensagem
5. Node salva no banco (whatsapp_messages)
6. Node retorna sucesso
7. Frontend exibe confirmacao
```

### Formato Telefone Brasileiro

```javascript
// Remove caracteres nao numericos
// Adiciona DDI 55 se necessario
// Remove 9 extra de celular (13 digitos -> 12)

Exemplo:
"(11) 99999-9999" -> "5511999999999" -> "551199999999"
```

---

## Endpoints API WhatsApp (Node)

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | /health | Health check |
| GET | /api/whatsapp/sessions | Listar sessoes |
| POST | /api/whatsapp/sessions | Criar sessao |
| GET | /api/whatsapp/sessions/:id | Detalhes sessao |
| POST | /api/whatsapp/sessions/:id/connect | Iniciar conexao |
| POST | /api/whatsapp/sessions/:id/disconnect | Desconectar |
| DELETE | /api/whatsapp/sessions/:id | Remover sessao |
| GET | /api/whatsapp/sessions/:id/qrcode | Obter QR Code |
| POST | /api/whatsapp/sessions/:id/send | Enviar mensagem |
| GET | /api-docs | Swagger UI |

---

## Variaveis de Ambiente Completas

### GPVx Frontend (.env.production)

```env
VITE_API_URL=https://api-gpvx.cdxsistemas.com.br:8000/api/v1
VITE_WHATSAPP_API_URL=https://ws-gpvx.cdxsistemas.com.br:3004/api/whatsapp
VITE_WHATSAPP_WS_URL=https://ws-gpvx.cdxsistemas.com.br:3004
VITE_APP_NAME=GPVx
VITE_APP_VERSION=1.0.0
```

### GPVx Backend (.env.production)

```env
DATABASE_URL=postgresql+asyncpg://codex:***@177.136.244.5:5432/gpvx
SECRET_KEY=gpvx-super-secret-key-change-in-production-2024
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
WHATSAPP_NODE_URL=http://localhost:3001
```

### GPVx WhatsApp (.env.production)

```env
PORT=3001
NODE_ENV=production
SECRET_KEY=gpvx-super-secret-key-change-in-production-2024
DB_HOST=177.136.244.5
DB_PORT=5432
DB_NAME=gpvx
DB_USER=codex
DB_PASSWORD=***
DB_SCHEMA=gpvx
BACKEND_URL=http://localhost:8000/api/v1
SESSIONS_PATH=./sessions
PUPPETEER_HEADLESS=true
SSL_KEYFILE=server.key
SSL_CERTFILE=server.crt
```

### SGSx Frontend (.env.production)

```env
VITE_API_URL=https://api-sgs.cdxsistemas.com.br:8001/api/v1
VITE_WHATSAPP_API_URL=https://ws-sgs.cdxsistemas.com.br:3003/api/whatsapp
VITE_WHATSAPP_WS_URL=https://ws-sgs.cdxsistemas.com.br:3003
VITE_APP_NAME=SGSx
VITE_APP_VERSION=1.0.0
```

### SGSx Backend (.env.production)

```env
DATABASE_URL=postgresql+asyncpg://codex:***@177.136.244.5:5432/sgsx
SECRET_KEY=sgsx-super-secret-key-change-in-production-2024
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
WHATSAPP_SERVICE_URL=http://localhost:3003
```

---

## Comandos de Manutencao

### Iniciar Todos os Servicos GPVx

```bash
# WhatsApp Node (producao)
cd C:\GPVx-Whatsapp
set NODE_ENV=production
npx pm2 start src/index.js --name "gpvx-whatsapp"

# Backend Python
cd C:\gpvx-back
uvicorn main:app --host 0.0.0.0 --port 8000

# Frontend (build + serve)
cd C:\gpvx-front
npm run build
# Servir dist/ via nginx/apache
```

### Iniciar Todos os Servicos SGSx

```bash
# WhatsApp Node (producao)
cd C:\SGSx-Whatsapp
set NODE_ENV=production
npx pm2 start src/index.js --name "sgsx-whatsapp"

# Backend Python
cd C:\sgs-back
uvicorn main:app --host 0.0.0.0 --port 8001

# Frontend (build + serve)
cd C:\sgs-front
npm run build
```

### Verificar Status de Todos os Servicos

```bash
# PM2 (WhatsApp)
npx pm2 list

# Portas ativas
netstat -ano | findstr "LISTENING" | findstr ":3001 :3003 :3004 :8000 :8001"

# Health checks
curl -k https://localhost:3004/health  # GPVx WhatsApp
curl -k https://localhost:3003/health  # SGSx WhatsApp
```

### Renovar Certificados SSL

```bash
# 1. Renovar via certbot/acme
# 2. Copiar para ambos servicos

cp privkey.pem C:\GPVx-Whatsapp\server.key
cp fullchain.pem C:\GPVx-Whatsapp\server.crt
cp privkey.pem C:\SGSx-Whatsapp\server.key
cp fullchain.pem C:\SGSx-Whatsapp\server.crt

# 3. Reiniciar servicos
npx pm2 restart gpvx-whatsapp
npx pm2 restart sgsx-whatsapp
```

---

## Troubleshooting Adicional

### Erro 503 Service Unavailable

**Causa:** Servico Node nao esta rodando ou nao responde.

**Solucao:**
```bash
# Verificar se esta rodando
npx pm2 list

# Ver logs de erro
npx pm2 logs gpvx-whatsapp --lines 50

# Reiniciar
npx pm2 restart gpvx-whatsapp
```

### QR Code nao aparece

**Causa:** Puppeteer nao conseguiu iniciar Chrome.

**Solucao:**
```bash
# Verificar logs
npx pm2 logs gpvx-whatsapp | grep -i "puppeteer\|chrome"

# Reinstalar dependencias
cd C:\GPVx-Whatsapp
npm install puppeteer

# Verificar modo headless
# .env.production deve ter: PUPPETEER_HEADLESS=true
```

### Mensagem nao enviada

**Possiveis causas:**
1. Sessao desconectada - Reconectar
2. Numero invalido - Verificar formato
3. WhatsApp bloqueou - Aguardar ou trocar chip
4. Erro de permissao - Verificar JWT

**Debug:**
```bash
# Ver logs em tempo real
npx pm2 logs gpvx-whatsapp

# Testar endpoint diretamente
curl -k -X POST https://localhost:3004/api/whatsapp/sessions/{id}/send \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"to":"5511999999999","message":"teste"}'
```

---

## Contato e Suporte

**Sistemas:** GPVx (Gabinete Parlamentar Virtual) e SGSx (Sistema de Gestao de Saloes)
**Versao:** 1.0.0
**Ultima Atualizacao:** Janeiro 2026
**Servidor:** 177.136.244.5 (Windows Server)

---

## Historico de Problemas Resolvidos

### 2026-01-09: ERR_SSL_PROTOCOL_ERROR no GPVx WhatsApp

**Problema:** Frontend retornava `ERR_SSL_PROTOCOL_ERROR` ao tentar enviar mensagem.

**Causa:** Certificados SSL (`server.key` e `server.crt`) nao existiam na pasta `C:\GPVx-Whatsapp`.

**Solucao:**
1. Verificar que o certificado do SGSx incluia o dominio `ws-gpvx.cdxsistemas.com.br`
2. Copiar certificados: `cp C:\SGSx-Whatsapp\server.* C:\GPVx-Whatsapp\`
3. Reiniciar em modo producao: `NODE_ENV=production npx pm2 start src/index.js --name gpvx-whatsapp`

**Licao:** Sempre verificar se certificados SSL existem antes de iniciar em producao.

---

*Documento gerado para auxiliar IA e Analistas no entendimento rapido da infraestrutura do sistema.*
