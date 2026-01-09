# GPVx - Gabinete Parlamentar Virtual

## Documentação Completa do Sistema

---

## 1. Visão Geral

O **GPVx (Gabinete Parlamentar Virtual)** é um sistema web moderno para gestão de gabinetes parlamentares, com suporte a múltiplos gabinetes (multi-tenant) e extensão para controle de campanhas eleitorais.

### 1.1 Objetivo

Fornecer uma plataforma completa para:
- Gestão de relacionamento com cidadãos e lideranças
- Controle de demandas e solicitações
- Acompanhamento de atendimentos
- Geração de relatórios segmentados
- Comunicação integrada (SMS, WhatsApp, E-mail)

### 1.2 Público-Alvo

- Gabinetes parlamentares (senadores, deputados, vereadores)
- Equipes de assessoria política
- Coordenadores de campanha eleitoral

---

## 2. Requisitos Funcionais

### 2.1 Gestão de Gabinetes (Multi-Tenant)

| ID | Requisito | Descrição |
|----|-----------|-----------|
| RF01 | Cadastro de Gabinetes | Permitir cadastro de múltiplos gabinetes com isolamento total de dados |
| RF02 | Subgabinetes | Cada gabinete pode ter N subgabinetes para campanhas em diferentes regiões |
| RF03 | Personalização | Cada gabinete pode personalizar cores, logo e configurações |
| RF04 | Isolamento de Dados | Dados de um gabinete são invisíveis para outros gabinetes |

### 2.2 Gestão de Pessoas

| ID | Requisito | Descrição |
|----|-----------|-----------|
| RF05 | Cadastro de Cidadãos | Cadastro completo com dados pessoais, endereço e contatos |
| RF06 | Cadastro de Lideranças | Identificação de lideranças comunitárias e políticas |
| RF07 | Vinculação de Pessoas | Vincular cidadãos a lideranças responsáveis |
| RF08 | Histórico de Visitas | Registrar visitas ao gabinete |
| RF09 | Sistema de Tags | Marcar pessoas com tags para segmentação |
| RF10 | Busca Avançada | Buscar por nome, cidade, bairro, tags, liderança |
| RF11 | Geolocalização | Armazenar coordenadas para mapeamento |

### 2.3 Gestão de Demandas

| ID | Requisito | Descrição |
|----|-----------|-----------|
| RF12 | Abertura de Demandas | Registrar solicitações com protocolo automático |
| RF13 | Categorização | Classificar demandas por categoria |
| RF14 | Priorização | Definir prioridade (baixa, normal, alta, urgente, crítica) |
| RF15 | Status | Controlar status (aberta, em andamento, aguardando, concluída, cancelada) |
| RF16 | Responsável | Atribuir responsável pelo atendimento |
| RF17 | Prazo e SLA | Definir prazo e monitorar SLA por categoria |
| RF18 | Andamentos | Registrar histórico de andamentos |
| RF19 | Encaminhamento | Registrar encaminhamento a órgãos externos |
| RF20 | Avaliação | Permitir avaliação do atendimento pelo solicitante |

### 2.4 Sistema de Lembretes e Alertas

| ID | Requisito | Descrição |
|----|-----------|-----------|
| RF21 | Aniversariantes | Listar aniversariantes do dia/período |
| RF22 | Lembretes | Criar lembretes para demandas e pessoas |
| RF23 | Alertas de Prazo | Alertar sobre demandas próximas do vencimento |
| RF24 | Notificações | Sistema de notificações em tempo real |

### 2.5 Comunicação

| ID | Requisito | Descrição |
|----|-----------|-----------|
| RF25 | Envio de SMS | Integração para envio de SMS |
| RF26 | WhatsApp | Integração com WhatsApp Business API |
| RF27 | E-mail | Envio de e-mails automáticos |
| RF28 | Templates | Modelos de mensagens personalizáveis |
| RF29 | Histórico | Registro de todas as mensagens enviadas |

### 2.6 Documentos

| ID | Requisito | Descrição |
|----|-----------|-----------|
| RF30 | Upload | Upload de documentos digitalizados |
| RF31 | Vinculação | Vincular documentos a pessoas ou demandas |
| RF32 | Categorização | Classificar por tipo (ofício, requerimento, etc.) |
| RF33 | Visualização | Visualizar documentos no sistema |

### 2.7 Relatórios

| ID | Requisito | Descrição |
|----|-----------|-----------|
| RF34 | Relatório de Pessoas | Por cidade, bairro, liderança, tags |
| RF35 | Relatório de Demandas | Por status, categoria, período, responsável |
| RF36 | Dashboard | Visão geral com indicadores principais |
| RF37 | Exportação | Exportar relatórios em PDF, Excel, CSV |
| RF38 | Gráficos | Visualização gráfica de dados |

### 2.8 Controle de Acesso

| ID | Requisito | Descrição |
|----|-----------|-----------|
| RF39 | Autenticação | Login com e-mail e senha |
| RF40 | Perfis | Diferentes níveis de acesso (admin, coordenador, atendente, consulta) |
| RF41 | Permissões | Controle granular de permissões por funcionalidade |
| RF42 | Auditoria | Log de todas as ações dos usuários |
| RF43 | Recuperação de Senha | Fluxo de recuperação por e-mail |

---

## 3. Requisitos Não Funcionais

### 3.1 Desempenho

| ID | Requisito | Métrica |
|----|-----------|---------|
| RNF01 | Tempo de Resposta | Páginas devem carregar em < 2 segundos |
| RNF02 | Concurrent Users | Suportar 100+ usuários simultâneos por gabinete |
| RNF03 | Volume de Dados | Suportar 100.000+ pessoas por gabinete |

### 3.2 Segurança

| ID | Requisito | Descrição |
|----|-----------|-----------|
| RNF04 | Criptografia | Senhas criptografadas com bcrypt |
| RNF05 | HTTPS | Comunicação criptografada via TLS |
| RNF06 | JWT | Autenticação via tokens JWT |
| RNF07 | CORS | Proteção contra requisições cross-origin |
| RNF08 | SQL Injection | Proteção via queries parametrizadas |
| RNF09 | XSS | Sanitização de inputs |
| RNF10 | LGPD | Conformidade com Lei Geral de Proteção de Dados |

### 3.3 Disponibilidade

| ID | Requisito | Métrica |
|----|-----------|---------|
| RNF11 | Uptime | 99.5% de disponibilidade |
| RNF12 | Backup | Backup automático diário |
| RNF13 | Recovery | RTO < 4 horas, RPO < 1 hora |

### 3.4 Usabilidade

| ID | Requisito | Descrição |
|----|-----------|-----------|
| RNF14 | Responsivo | Interface adaptável a desktop, tablet e mobile |
| RNF15 | Acessibilidade | Conformidade com WCAG 2.1 nível AA |
| RNF16 | Intuitividade | Interface simples, sem necessidade de treinamento extenso |
| RNF17 | Idioma | Interface em Português do Brasil |

### 3.5 Manutenibilidade

| ID | Requisito | Descrição |
|----|-----------|-----------|
| RNF18 | Código Limpo | Seguir princípios SOLID e Clean Code |
| RNF19 | Documentação | API documentada com Swagger/OpenAPI |
| RNF20 | Testes | Cobertura mínima de 80% |
| RNF21 | Versionamento | Controle de versão com Git |

### 3.6 Escalabilidade

| ID | Requisito | Descrição |
|----|-----------|-----------|
| RNF22 | Horizontal | Arquitetura que permita escalar horizontalmente |
| RNF23 | Multi-tenant | Isolamento eficiente entre gabinetes |
| RNF24 | Cache | Uso de cache para dados frequentemente acessados |

---

## 4. Arquitetura do Sistema

### 4.1 Stack Tecnológica

#### Frontend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| React | 18.x | Framework UI |
| TypeScript | 5.x | Tipagem estática |
| Vite | 5.x | Build tool |
| Tailwind CSS | 3.x | Estilização |
| Zustand | 4.x | Gerenciamento de estado |
| React Query | 5.x | Cache e fetch de dados |
| React Router | 6.x | Navegação |
| React Hook Form | 7.x | Formulários |
| Zod | 3.x | Validação de schemas |

#### Backend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| Python | 3.11+ | Linguagem principal |
| FastAPI | 0.100+ | Framework web |
| SQLAlchemy | 2.x | ORM |
| Pydantic | 2.x | Validação de dados |
| Alembic | 1.x | Migrations |
| JWT | - | Autenticação |
| Swagger/OpenAPI | 3.x | Documentação da API |

#### Banco de Dados
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| PostgreSQL | 15+ | Banco de dados principal |
| Redis | 7.x | Cache e sessões (opcional) |

### 4.2 Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    React SPA                              │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │   │
│  │  │ Zustand │  │  React  │  │  React  │  │ Tailwind│     │   │
│  │  │  Store  │  │  Query  │  │  Router │  │   CSS   │     │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/REST
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SERVIDOR                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    FastAPI                                │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │   │
│  │  │  Auth   │  │ Routers │  │Services │  │ Schemas │     │   │
│  │  │  JWT    │  │         │  │         │  │Pydantic │     │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘     │   │
│  │  ┌─────────────────────────────────────────────────┐     │   │
│  │  │              SQLAlchemy ORM                      │     │   │
│  │  └─────────────────────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BANCO DE DADOS                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    PostgreSQL                             │   │
│  │         Schema: gpvx (isolamento multi-tenant)           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Modelo de Dados

### 5.1 Diagrama ER Simplificado

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   GABINETE   │───┬───│  SUBGABINETE │       │    PERFIL    │
└──────────────┘   │   └──────────────┘       └──────────────┘
       │           │          │                      │
       │           │          │                      │
       ▼           │          ▼                      ▼
┌──────────────┐   │   ┌──────────────┐       ┌──────────────┐
│   USUARIO    │───┘   │    PESSOA    │◄──────│  USUARIO     │
└──────────────┘       └──────────────┘       └──────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
       ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
       │   DEMANDA    │ │  DOCUMENTO   │ │    VISITA    │
       └──────────────┘ └──────────────┘ └──────────────┘
              │
              ▼
       ┌──────────────┐
       │  ANDAMENTO   │
       └──────────────┘
```

### 5.2 Descrição das Tabelas

#### 5.2.1 Tabelas de Configuração Multi-Tenant

##### `gabinetes`
Tabela principal que representa cada gabinete parlamentar (tenant).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único (PK) |
| codigo | VARCHAR(20) | Código único do gabinete (ex: "SEN-GO-001") |
| nome | VARCHAR(200) | Nome do gabinete |
| nome_parlamentar | VARCHAR(200) | Nome do parlamentar |
| partido | VARCHAR(50) | Partido político |
| cargo | VARCHAR(100) | Cargo (Senador, Deputado, Vereador) |
| uf | CHAR(2) | Estado (UF) |
| logo_url | TEXT | URL do logotipo |
| cor_primaria | VARCHAR(7) | Cor primária do tema (#22C55E) |
| cor_secundaria | VARCHAR(7) | Cor secundária do tema |
| email_contato | VARCHAR(200) | E-mail de contato |
| telefone_contato | VARCHAR(20) | Telefone de contato |
| endereco | TEXT | Endereço do gabinete |
| configuracoes | JSONB | Configurações adicionais em JSON |
| ativo | BOOLEAN | Se o gabinete está ativo |
| data_criacao | TIMESTAMP | Data de criação do registro |
| data_atualizacao | TIMESTAMP | Data da última atualização |

##### `subgabinetes`
Subgabinetes para campanhas eleitorais em diferentes regiões.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único (PK) |
| gabinete_id | UUID | Referência ao gabinete (FK) |
| codigo | VARCHAR(20) | Código do subgabinete |
| nome | VARCHAR(200) | Nome do subgabinete |
| descricao | TEXT | Descrição/observações |
| cidade | VARCHAR(100) | Cidade de atuação |
| regiao | VARCHAR(100) | Região/zona eleitoral |
| uf | CHAR(2) | Estado |
| endereco | TEXT | Endereço físico |
| responsavel_nome | VARCHAR(200) | Nome do responsável |
| responsavel_telefone | VARCHAR(20) | Telefone do responsável |
| responsavel_email | VARCHAR(200) | E-mail do responsável |
| latitude | DECIMAL(10,8) | Latitude para mapeamento |
| longitude | DECIMAL(11,8) | Longitude para mapeamento |
| configuracoes | JSONB | Configurações específicas |
| ativo | BOOLEAN | Se está ativo |

#### 5.2.2 Tabelas de Controle de Acesso

##### `perfis`
Perfis de acesso com permissões.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único (PK) |
| gabinete_id | UUID | Gabinete (NULL = perfil do sistema) |
| codigo | VARCHAR(50) | Código do perfil (ex: "admin_gabinete") |
| nome | VARCHAR(100) | Nome exibido |
| descricao | TEXT | Descrição do perfil |
| permissoes | JSONB | Array de permissões (ex: ["pessoas.*", "demandas.criar"]) |
| nivel_acesso | INTEGER | Nível numérico (100=super admin, 10=consulta) |
| sistema | BOOLEAN | Se é um perfil do sistema (não editável) |
| ativo | BOOLEAN | Se está ativo |

**Perfis Padrão do Sistema:**
| Código | Nome | Nível | Descrição |
|--------|------|-------|-----------|
| super_admin | Super Administrador | 100 | Acesso total |
| admin_gabinete | Administrador de Gabinete | 90 | Gerencia seu gabinete |
| coordenador | Coordenador | 70 | Gerencia equipe e demandas |
| atendente | Atendente | 50 | Cadastra e atende |
| consulta | Consulta | 10 | Apenas visualização |

##### `usuarios`
Usuários do sistema.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único (PK) |
| gabinete_id | UUID | Gabinete do usuário (FK) |
| perfil_id | UUID | Perfil de acesso (FK) |
| nome | VARCHAR(200) | Nome completo |
| email | VARCHAR(200) | E-mail (único por gabinete) |
| senha_hash | VARCHAR(255) | Senha criptografada (bcrypt) |
| cpf | VARCHAR(14) | CPF (opcional) |
| telefone | VARCHAR(20) | Telefone |
| foto_url | TEXT | URL da foto |
| status | ENUM | Status (ativo, inativo, bloqueado, pendente) |
| ultimo_acesso | TIMESTAMP | Data/hora do último login |
| token_recuperacao | VARCHAR(255) | Token para reset de senha |
| token_expiracao | TIMESTAMP | Expiração do token |
| tentativas_login | INTEGER | Contador de tentativas falhas |
| bloqueado_ate | TIMESTAMP | Bloqueio temporário |
| configuracoes | JSONB | Preferências do usuário |

##### `usuario_subgabinetes`
Relacionamento N:N entre usuários e subgabinetes.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador único (PK) |
| usuario_id | UUID | Referência ao usuário (FK) |
| subgabinete_id | UUID | Referência ao subgabinete (FK) |
| permissoes | JSONB | Permissões específicas neste subgabinete |
| ativo | BOOLEAN | Se a vinculação está ativa |

#### 5.2.3 Tabelas Geográficas

##### `estados`
Estados brasileiros.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | SERIAL | Identificador (PK) |
| codigo_ibge | INTEGER | Código IBGE |
| sigla | CHAR(2) | Sigla do estado (UF) |
| nome | VARCHAR(100) | Nome do estado |

##### `cidades`
Cidades brasileiras.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | SERIAL | Identificador (PK) |
| estado_id | INTEGER | Referência ao estado (FK) |
| codigo_ibge | INTEGER | Código IBGE da cidade |
| nome | VARCHAR(200) | Nome da cidade |
| latitude | DECIMAL(10,8) | Latitude |
| longitude | DECIMAL(11,8) | Longitude |

##### `bairros`
Bairros e setores.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador (PK) |
| cidade_id | INTEGER | Referência à cidade (FK) |
| nome | VARCHAR(200) | Nome do bairro |
| tipo | VARCHAR(50) | Tipo (bairro, setor, distrito) |
| codigo_postal | VARCHAR(10) | CEP principal |

##### `regioes`
Regiões customizadas pelo gabinete.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador (PK) |
| gabinete_id | UUID | Gabinete (FK) |
| nome | VARCHAR(200) | Nome da região |
| descricao | TEXT | Descrição |
| cor | VARCHAR(7) | Cor para visualização no mapa |
| ativo | BOOLEAN | Se está ativa |

#### 5.2.4 Sistema de Tags

##### `tag_categorias`
Categorias para organizar tags.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador (PK) |
| gabinete_id | UUID | Gabinete (FK) |
| nome | VARCHAR(100) | Nome da categoria (ex: "Profissão", "Interesse") |
| descricao | TEXT | Descrição |
| cor | VARCHAR(7) | Cor padrão da categoria |
| icone | VARCHAR(50) | Ícone (nome do ícone Lucide) |
| ordem | INTEGER | Ordem de exibição |
| ativo | BOOLEAN | Se está ativa |

##### `tags`
Tags para marcação de pessoas e demandas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador (PK) |
| gabinete_id | UUID | Gabinete (FK) |
| categoria_id | UUID | Categoria (FK, opcional) |
| nome | VARCHAR(100) | Nome da tag |
| slug | VARCHAR(100) | Slug único (URL-friendly) |
| descricao | TEXT | Descrição |
| cor | VARCHAR(7) | Cor da tag |
| icone | VARCHAR(50) | Ícone |
| ativo | BOOLEAN | Se está ativa |

#### 5.2.5 Cadastro de Pessoas

##### `pessoas`
Tabela principal de cidadãos, lideranças e apoiadores.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador (PK) |
| gabinete_id | UUID | Gabinete (FK) |
| subgabinete_id | UUID | Subgabinete de origem (FK, opcional) |
| tipo | ENUM | Tipo: cidadao, lideranca, apoiador, colaborador, outro |
| **Dados Pessoais** | | |
| nome | VARCHAR(200) | Nome completo |
| nome_social | VARCHAR(200) | Nome social |
| cpf | VARCHAR(14) | CPF |
| rg | VARCHAR(20) | RG |
| data_nascimento | DATE | Data de nascimento |
| genero | ENUM | Gênero |
| profissao | VARCHAR(100) | Profissão |
| escolaridade | VARCHAR(50) | Escolaridade |
| **Endereço** | | |
| cep | VARCHAR(10) | CEP |
| logradouro | VARCHAR(200) | Rua/Avenida |
| numero | VARCHAR(20) | Número |
| complemento | VARCHAR(100) | Complemento |
| bairro | VARCHAR(100) | Bairro |
| cidade_id | INTEGER | Cidade (FK) |
| estado_id | INTEGER | Estado (FK) |
| referencia | TEXT | Ponto de referência |
| latitude | DECIMAL(10,8) | Latitude |
| longitude | DECIMAL(11,8) | Longitude |
| **Contatos** | | |
| email | VARCHAR(200) | E-mail principal |
| telefone | VARCHAR(20) | Telefone fixo |
| celular | VARCHAR(20) | Celular |
| whatsapp | VARCHAR(20) | WhatsApp |
| instagram | VARCHAR(100) | Instagram |
| facebook | VARCHAR(100) | Facebook |
| twitter | VARCHAR(100) | Twitter |
| **Outros** | | |
| foto_url | TEXT | URL da foto |
| observacoes | TEXT | Observações gerais |
| como_conheceu | VARCHAR(200) | Como conheceu o gabinete |
| lideranca_id | UUID | Liderança vinculada (FK self-reference) |
| aceita_whatsapp | BOOLEAN | Aceita receber WhatsApp |
| aceita_sms | BOOLEAN | Aceita receber SMS |
| aceita_email | BOOLEAN | Aceita receber e-mail |
| total_demandas | INTEGER | Contador de demandas |
| ultima_interacao | TIMESTAMP | Data da última interação |
| dados_extras | JSONB | Campos customizados |
| ativo | BOOLEAN | Se está ativo |

##### `pessoa_contatos`
Contatos adicionais de uma pessoa.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador (PK) |
| pessoa_id | UUID | Pessoa (FK) |
| tipo | ENUM | Tipo: telefone, celular, whatsapp, email, instagram, etc. |
| valor | VARCHAR(200) | Valor do contato |
| descricao | VARCHAR(100) | Descrição (ex: "Trabalho", "Pessoal") |
| principal | BOOLEAN | Se é o contato principal do tipo |
| ativo | BOOLEAN | Se está ativo |

##### `pessoa_tags`
Relacionamento N:N entre pessoas e tags.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador (PK) |
| pessoa_id | UUID | Pessoa (FK) |
| tag_id | UUID | Tag (FK) |
| criado_por | UUID | Usuário que adicionou (FK) |

##### `visitas`
Registro de visitas ao gabinete.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador (PK) |
| gabinete_id | UUID | Gabinete (FK) |
| subgabinete_id | UUID | Subgabinete (FK, opcional) |
| pessoa_id | UUID | Pessoa que visitou (FK) |
| data_visita | TIMESTAMP | Data/hora da visita |
| motivo | TEXT | Motivo da visita |
| atendente_id | UUID | Usuário que atendeu (FK) |
| observacoes | TEXT | Observações |

#### 5.2.6 Sistema de Demandas

##### `demanda_categorias`
Categorias de demandas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador (PK) |
| gabinete_id | UUID | Gabinete (FK) |
| nome | VARCHAR(100) | Nome da categoria |
| descricao | TEXT | Descrição |
| cor | VARCHAR(7) | Cor para visualização |
| icone | VARCHAR(50) | Ícone |
| sla_dias | INTEGER | SLA em dias para esta categoria |
| ordem | INTEGER | Ordem de exibição |
| ativo | BOOLEAN | Se está ativa |

**Exemplos de Categorias:**
- Infraestrutura (sla: 30 dias)
- Saúde (sla: 15 dias)
- Educação (sla: 20 dias)
- Emprego (sla: 45 dias)
- Indicação de Cargo (sla: 60 dias)
- Audiência (sla: 10 dias)

##### `demandas`
Demandas e solicitações.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador (PK) |
| gabinete_id | UUID | Gabinete (FK) |
| subgabinete_id | UUID | Subgabinete de origem (FK, opcional) |
| numero_protocolo | VARCHAR(50) | Protocolo único (ex: "2024-000142") |
| **Solicitante** | | |
| pessoa_id | UUID | Pessoa solicitante (FK, opcional) |
| nome_solicitante | VARCHAR(200) | Nome (se não cadastrado) |
| contato_solicitante | VARCHAR(200) | Contato (se não cadastrado) |
| **Classificação** | | |
| categoria_id | UUID | Categoria (FK) |
| status | ENUM | aberta, em_andamento, aguardando, concluida, cancelada |
| prioridade | ENUM | baixa, normal, alta, urgente, critica |
| **Conteúdo** | | |
| titulo | VARCHAR(300) | Título resumido |
| descricao | TEXT | Descrição detalhada |
| **Localização** | | |
| cep | VARCHAR(10) | CEP do local |
| logradouro | VARCHAR(200) | Endereço |
| numero | VARCHAR(20) | Número |
| bairro | VARCHAR(100) | Bairro |
| cidade_id | INTEGER | Cidade (FK) |
| estado_id | INTEGER | Estado (FK) |
| latitude | DECIMAL(10,8) | Latitude |
| longitude | DECIMAL(11,8) | Longitude |
| **Encaminhamento** | | |
| orgao_destino | VARCHAR(200) | Órgão de destino |
| numero_oficio | VARCHAR(50) | Número do ofício |
| data_encaminhamento | DATE | Data de encaminhamento |
| **Datas** | | |
| data_abertura | TIMESTAMP | Data de abertura |
| data_prazo | DATE | Prazo para conclusão |
| data_conclusao | TIMESTAMP | Data de conclusão |
| **Responsável** | | |
| responsavel_id | UUID | Usuário responsável (FK) |
| **Lembretes** | | |
| lembrete_ativo | BOOLEAN | Se há lembrete ativo |
| lembrete_data | TIMESTAMP | Data do lembrete |
| lembrete_mensagem | TEXT | Mensagem do lembrete |
| **Resultado** | | |
| parecer | TEXT | Parecer final |
| avaliacao | INTEGER | Avaliação (1-5) |
| feedback | TEXT | Feedback do solicitante |
| dados_extras | JSONB | Campos customizados |

##### `demanda_tags`
Tags das demandas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador (PK) |
| demanda_id | UUID | Demanda (FK) |
| tag_id | UUID | Tag (FK) |
| criado_por | UUID | Usuário (FK) |

##### `demanda_andamentos`
Histórico de andamentos.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador (PK) |
| demanda_id | UUID | Demanda (FK) |
| usuario_id | UUID | Usuário que registrou (FK) |
| status_anterior | ENUM | Status antes da alteração |
| status_novo | ENUM | Status após alteração |
| descricao | TEXT | Descrição do andamento |
| interno | BOOLEAN | Se é anotação interna (não visível para cidadão) |
| data_criacao | TIMESTAMP | Data do registro |

#### 5.2.7 Sistema de Documentos

##### `documentos`
Documentos digitalizados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador (PK) |
| gabinete_id | UUID | Gabinete (FK) |
| pessoa_id | UUID | Pessoa vinculada (FK, opcional) |
| demanda_id | UUID | Demanda vinculada (FK, opcional) |
| tipo | ENUM | oficio, requerimento, declaracao, certidao, foto, comprovante, outro |
| nome | VARCHAR(300) | Nome do documento |
| nome_original | VARCHAR(300) | Nome original do arquivo |
| descricao | TEXT | Descrição |
| mime_type | VARCHAR(100) | Tipo MIME (application/pdf, image/jpeg, etc.) |
| tamanho_bytes | BIGINT | Tamanho em bytes |
| url | TEXT | URL do arquivo (storage) |
| dados_extras | JSONB | Metadados adicionais |
| ativo | BOOLEAN | Se está ativo |
| criado_por | UUID | Usuário que fez upload (FK) |

#### 5.2.8 Sistema de Comunicação

##### `mensagens`
Registro de mensagens enviadas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador (PK) |
| gabinete_id | UUID | Gabinete (FK) |
| pessoa_id | UUID | Destinatário (FK, opcional) |
| tipo | VARCHAR(20) | Tipo: sms, whatsapp, email |
| destinatario | VARCHAR(200) | Número/e-mail do destinatário |
| assunto | VARCHAR(300) | Assunto (para e-mail) |
| conteudo | TEXT | Conteúdo da mensagem |
| status | VARCHAR(20) | Status: pendente, enviada, entregue, erro |
| erro_mensagem | TEXT | Mensagem de erro (se houver) |
| dados_extras | JSONB | Dados adicionais (ID externo, etc.) |
| data_envio | TIMESTAMP | Data/hora do envio |
| criado_por | UUID | Usuário que enviou (FK) |

##### `mensagem_templates`
Templates de mensagens.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador (PK) |
| gabinete_id | UUID | Gabinete (FK) |
| nome | VARCHAR(100) | Nome do template |
| tipo | VARCHAR(20) | Tipo: sms, whatsapp, email |
| assunto | VARCHAR(300) | Assunto padrão |
| conteudo | TEXT | Conteúdo com variáveis (ex: {{nome}}) |
| variaveis | JSONB | Lista de variáveis disponíveis |
| ativo | BOOLEAN | Se está ativo |

**Exemplo de Template:**
```json
{
  "nome": "Aniversário",
  "tipo": "whatsapp",
  "conteudo": "Olá {{nome}}! O Gabinete do {{parlamentar}} deseja um feliz aniversário! 🎂",
  "variaveis": ["nome", "parlamentar"]
}
```

#### 5.2.9 Lembretes e Notificações

##### `lembretes`
Lembretes agendados.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador (PK) |
| gabinete_id | UUID | Gabinete (FK) |
| usuario_id | UUID | Usuário do lembrete (FK) |
| pessoa_id | UUID | Pessoa relacionada (FK, opcional) |
| demanda_id | UUID | Demanda relacionada (FK, opcional) |
| titulo | VARCHAR(200) | Título do lembrete |
| descricao | TEXT | Descrição |
| data_lembrete | TIMESTAMP | Data/hora do lembrete |
| recorrente | BOOLEAN | Se é recorrente |
| frequencia | VARCHAR(20) | Frequência: diaria, semanal, mensal, anual |
| visualizado | BOOLEAN | Se foi visualizado |
| concluido | BOOLEAN | Se foi concluído |
| criado_por | UUID | Quem criou (FK) |

##### `notificacoes`
Notificações do sistema.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador (PK) |
| gabinete_id | UUID | Gabinete (FK) |
| usuario_id | UUID | Destinatário (FK) |
| tipo | VARCHAR(50) | Tipo: aniversario, demanda_prazo, lembrete, sistema |
| titulo | VARCHAR(200) | Título |
| mensagem | TEXT | Mensagem |
| link | VARCHAR(500) | Link para ação |
| dados | JSONB | Dados adicionais |
| lida | BOOLEAN | Se foi lida |
| data_leitura | TIMESTAMP | Quando foi lida |

#### 5.2.10 Auditoria

##### `auditoria`
Log de auditoria de todas as operações.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID | Identificador (PK) |
| gabinete_id | UUID | Gabinete (FK) |
| usuario_id | UUID | Usuário que executou (FK) |
| tabela | VARCHAR(100) | Tabela afetada |
| registro_id | UUID | ID do registro afetado |
| acao | VARCHAR(20) | Ação: INSERT, UPDATE, DELETE |
| dados_antigos | JSONB | Dados antes da alteração |
| dados_novos | JSONB | Dados após alteração |
| ip | VARCHAR(45) | IP do usuário |
| user_agent | TEXT | User agent do navegador |
| data_criacao | TIMESTAMP | Data/hora da operação |

---

## 6. Views do Sistema

### 6.1 `vw_aniversariantes_hoje`
Retorna pessoas que fazem aniversário na data atual.

```sql
SELECT id, gabinete_id, nome, data_nascimento, idade,
       telefone, celular, whatsapp, tipo
FROM pessoas
WHERE ativo = TRUE
  AND dia(data_nascimento) = dia(CURRENT_DATE)
  AND mes(data_nascimento) = mes(CURRENT_DATE)
```

### 6.2 `vw_demandas_atrasadas`
Retorna demandas que ultrapassaram o prazo.

```sql
SELECT d.*, dias_atraso, nome_solicitante,
       categoria_nome, responsavel_nome
FROM demandas d
WHERE status NOT IN ('concluida', 'cancelada')
  AND data_prazo < CURRENT_DATE
```

### 6.3 `vw_estatisticas_gabinete`
Estatísticas resumidas por gabinete.

| Campo | Descrição |
|-------|-----------|
| total_pessoas | Total de pessoas cadastradas |
| total_liderancas | Total de lideranças |
| total_demandas | Total de demandas |
| demandas_abertas | Demandas em aberto |
| demandas_concluidas | Demandas finalizadas |
| total_subgabinetes | Quantidade de subgabinetes |
| total_usuarios | Usuários ativos |

---

## 7. Funções do Banco de Dados

### 7.1 `fn_gera_protocolo(gabinete_id)`
Gera número de protocolo sequencial por ano.

**Formato:** `YYYY-NNNNNN` (ex: 2024-000142)

### 7.2 `fn_aniversariantes_periodo(gabinete_id, data_inicio, data_fim)`
Retorna aniversariantes em um período.

### 7.3 `fn_atualiza_timestamp()`
Trigger para atualizar `data_atualizacao` automaticamente.

---

## 8. Índices de Performance

| Tabela | Índice | Colunas | Propósito |
|--------|--------|---------|-----------|
| pessoas | idx_pessoas_nome | nome (gin_trgm) | Busca textual por nome |
| pessoas | idx_pessoas_cpf | cpf | Busca por CPF |
| pessoas | idx_pessoas_nascimento | data_nascimento | Filtro de aniversariantes |
| pessoas | idx_pessoas_cidade | cidade_id | Filtro por cidade |
| pessoas | idx_pessoas_lideranca | lideranca_id | Relacionamento com liderança |
| demandas | idx_demandas_protocolo | numero_protocolo | Busca por protocolo |
| demandas | idx_demandas_status | status | Filtro por status |
| demandas | idx_demandas_prazo | data_prazo | Alertas de vencimento |
| demandas | idx_demandas_abertura | data_abertura | Ordenação cronológica |

---

## 9. Fluxos Principais

### 9.1 Fluxo de Cadastro de Pessoa

```
1. Usuário acessa "Nova Pessoa"
2. Preenche dados obrigatórios (nome, tipo)
3. Opcionalmente adiciona:
   - Dados pessoais completos
   - Endereço com CEP (autopreenchimento)
   - Múltiplos contatos
   - Tags de segmentação
   - Vinculação a liderança
4. Sistema valida CPF (se informado)
5. Sistema salva e gera ID único
6. Registro de auditoria criado
```

### 9.2 Fluxo de Demanda

```
1. Usuário abre nova demanda
2. Seleciona ou cadastra solicitante
3. Classifica categoria e prioridade
4. Descreve a solicitação
5. Sistema gera protocolo automático
6. Sistema calcula prazo baseado no SLA
7. Opcionalmente atribui responsável
8. Demanda fica com status "Aberta"
9. Andamentos são registrados
10. Quando resolvida, muda para "Concluída"
11. Solicitante pode avaliar o atendimento
```

### 9.3 Fluxo de Aniversariantes

```
1. Sistema executa rotina diária
2. Identifica aniversariantes do dia
3. Gera notificações para usuários
4. Exibe lista no dashboard
5. Usuário pode enviar mensagem (WhatsApp/SMS)
6. Sistema registra mensagem enviada
```

---

## 10. Integrações

### 10.1 WhatsApp Business API
- Envio de mensagens individuais
- Templates aprovados
- Notificações de aniversário
- Atualizações de demandas

### 10.2 SMS Gateway
- Envio de SMS em massa
- Confirmação de entrega
- Relatório de custos

### 10.3 E-mail (SMTP)
- Notificações do sistema
- Recuperação de senha
- Relatórios agendados

### 10.4 Storage (S3/MinIO)
- Upload de documentos
- Armazenamento de fotos
- Backup de arquivos

### 10.5 CEP (ViaCEP)
- Autopreenchimento de endereço
- Validação de CEP

---

## 11. Considerações de Segurança

### 11.1 Autenticação
- JWT com expiração de 24h
- Refresh token com 7 dias
- Bloqueio após 5 tentativas falhas
- Desbloqueio após 15 minutos

### 11.2 Autorização
- Verificação de gabinete em todas as requisições
- Verificação de permissões por endpoint
- Isolamento total entre gabinetes

### 11.3 Dados Sensíveis
- CPF armazenado com máscara
- Senhas com bcrypt (custo 12)
- Logs sem dados sensíveis
- Conformidade LGPD

---

## 12. Glossário

| Termo | Definição |
|-------|-----------|
| **Gabinete** | Escritório do parlamentar, unidade principal do sistema |
| **Subgabinete** | Ponto de atendimento secundário para campanhas |
| **Cidadão** | Pessoa que procura o gabinete para atendimento |
| **Liderança** | Pessoa com influência comunitária que mobiliza cidadãos |
| **Demanda** | Solicitação ou pedido registrado no sistema |
| **Andamento** | Atualização ou movimentação de uma demanda |
| **Tag** | Etiqueta para categorizar e filtrar registros |
| **SLA** | Service Level Agreement - prazo máximo para atendimento |
| **Tenant** | Inquilino - cada gabinete é um tenant isolado |

---

## 13. Changelog

| Versão | Data | Descrição |
|--------|------|-----------|
| 1.0.0 | 2024-01 | Versão inicial do sistema |

---

## 14. Suporte

Para dúvidas ou sugestões:
- Documentação da API: `/api/docs` (Swagger)
- E-mail: suporte@gpvx.com.br

---

*Documento gerado automaticamente - GPVx v1.0.0*
