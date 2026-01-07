-- =====================================================
-- GPVx - Gabinete Parlamentar Virtual
-- Modelo de Dados PostgreSQL
-- Versão: 1.0.0
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- =====================================================
-- SCHEMA: Organização lógica
-- =====================================================
CREATE SCHEMA IF NOT EXISTS gpvx;
SET search_path TO gpvx, public;

-- =====================================================
-- TIPOS ENUMERADOS
-- =====================================================
CREATE TYPE status_demanda AS ENUM ('aberta', 'em_andamento', 'aguardando', 'concluida', 'cancelada');
CREATE TYPE prioridade_demanda AS ENUM ('baixa', 'normal', 'alta', 'urgente', 'critica');
CREATE TYPE tipo_pessoa AS ENUM ('cidadao', 'lideranca', 'apoiador', 'colaborador', 'outro');
CREATE TYPE tipo_contato AS ENUM ('telefone', 'celular', 'whatsapp', 'email', 'instagram', 'facebook', 'twitter', 'outro');
CREATE TYPE tipo_documento AS ENUM ('oficio', 'requerimento', 'declaracao', 'certidao', 'foto', 'comprovante', 'outro');
CREATE TYPE genero AS ENUM ('masculino', 'feminino', 'outro', 'nao_informado');
CREATE TYPE status_usuario AS ENUM ('ativo', 'inativo', 'bloqueado', 'pendente');

-- =====================================================
-- TABELAS DE CONFIGURAÇÃO MULTI-TENANT
-- =====================================================

-- Gabinetes (tenant principal)
CREATE TABLE gabinetes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(200) NOT NULL,
    nome_parlamentar VARCHAR(200) NOT NULL,
    partido VARCHAR(50),
    cargo VARCHAR(100),
    uf CHAR(2),
    logo_url TEXT,
    cor_primaria VARCHAR(7) DEFAULT '#22C55E',
    cor_secundaria VARCHAR(7) DEFAULT '#16A34A',
    email_contato VARCHAR(200),
    telefone_contato VARCHAR(20),
    endereco TEXT,
    configuracoes JSONB DEFAULT '{}',
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID,
    atualizado_por UUID
);

-- Subgabinetes (para campanhas eleitorais em diferentes regiões)
CREATE TABLE subgabinetes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gabinete_id UUID NOT NULL REFERENCES gabinetes(id) ON DELETE CASCADE,
    codigo VARCHAR(20) NOT NULL,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    cidade VARCHAR(100),
    regiao VARCHAR(100),
    uf CHAR(2),
    endereco TEXT,
    responsavel_nome VARCHAR(200),
    responsavel_telefone VARCHAR(20),
    responsavel_email VARCHAR(200),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    configuracoes JSONB DEFAULT '{}',
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(gabinete_id, codigo)
);

-- =====================================================
-- TABELAS DE CONTROLE DE ACESSO
-- =====================================================

-- Perfis de acesso
CREATE TABLE perfis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gabinete_id UUID REFERENCES gabinetes(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    permissoes JSONB DEFAULT '[]',
    nivel_acesso INTEGER DEFAULT 1,
    sistema BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(gabinete_id, codigo)
);

-- Usuários do sistema
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gabinete_id UUID NOT NULL REFERENCES gabinetes(id) ON DELETE CASCADE,
    perfil_id UUID NOT NULL REFERENCES perfis(id),
    nome VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    cpf VARCHAR(14),
    telefone VARCHAR(20),
    foto_url TEXT,
    status status_usuario DEFAULT 'pendente',
    ultimo_acesso TIMESTAMP WITH TIME ZONE,
    token_recuperacao VARCHAR(255),
    token_expiracao TIMESTAMP WITH TIME ZONE,
    tentativas_login INTEGER DEFAULT 0,
    bloqueado_ate TIMESTAMP WITH TIME ZONE,
    configuracoes JSONB DEFAULT '{}',
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(gabinete_id, email)
);

-- Relacionamento usuário-subgabinete
CREATE TABLE usuario_subgabinetes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    subgabinete_id UUID NOT NULL REFERENCES subgabinetes(id) ON DELETE CASCADE,
    permissoes JSONB DEFAULT '[]',
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, subgabinete_id)
);

-- =====================================================
-- TABELAS GEOGRÁFICAS
-- =====================================================

-- Estados
CREATE TABLE estados (
    id SERIAL PRIMARY KEY,
    codigo_ibge INTEGER UNIQUE,
    sigla CHAR(2) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL
);

-- Cidades
CREATE TABLE cidades (
    id SERIAL PRIMARY KEY,
    estado_id INTEGER REFERENCES estados(id),
    codigo_ibge INTEGER UNIQUE,
    nome VARCHAR(200) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8)
);

-- Bairros/Setores
CREATE TABLE bairros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cidade_id INTEGER REFERENCES cidades(id),
    nome VARCHAR(200) NOT NULL,
    tipo VARCHAR(50), -- bairro, setor, distrito, etc.
    codigo_postal VARCHAR(10)
);

-- Regiões customizadas pelo gabinete
CREATE TABLE regioes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gabinete_id UUID NOT NULL REFERENCES gabinetes(id) ON DELETE CASCADE,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    cor VARCHAR(7),
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cidades vinculadas às regiões
CREATE TABLE regiao_cidades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    regiao_id UUID NOT NULL REFERENCES regioes(id) ON DELETE CASCADE,
    cidade_id INTEGER NOT NULL REFERENCES cidades(id),
    UNIQUE(regiao_id, cidade_id)
);

-- =====================================================
-- SISTEMA DE TAGS/MARCAÇÕES DINÂMICAS
-- =====================================================

-- Categorias de tags
CREATE TABLE tag_categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gabinete_id UUID NOT NULL REFERENCES gabinetes(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    cor VARCHAR(7) DEFAULT '#6B7280',
    icone VARCHAR(50),
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(gabinete_id, nome)
);

-- Tags/Marcações
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gabinete_id UUID NOT NULL REFERENCES gabinetes(id) ON DELETE CASCADE,
    categoria_id UUID REFERENCES tag_categorias(id) ON DELETE SET NULL,
    nome VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    descricao TEXT,
    cor VARCHAR(7) DEFAULT '#6B7280',
    icone VARCHAR(50),
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(gabinete_id, slug)
);

-- =====================================================
-- CADASTRO DE PESSOAS (CIDADÃOS E LIDERANÇAS)
-- =====================================================

-- Pessoas (cidadãos, lideranças, apoiadores)
CREATE TABLE pessoas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gabinete_id UUID NOT NULL REFERENCES gabinetes(id) ON DELETE CASCADE,
    subgabinete_id UUID REFERENCES subgabinetes(id) ON DELETE SET NULL,
    tipo tipo_pessoa DEFAULT 'cidadao',

    -- Dados pessoais
    nome VARCHAR(200) NOT NULL,
    nome_social VARCHAR(200),
    cpf VARCHAR(14),
    rg VARCHAR(20),
    data_nascimento DATE,
    genero genero DEFAULT 'nao_informado',
    profissao VARCHAR(100),
    escolaridade VARCHAR(50),

    -- Endereço
    cep VARCHAR(10),
    logradouro VARCHAR(200),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade_id INTEGER REFERENCES cidades(id),
    estado_id INTEGER REFERENCES estados(id),
    referencia TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Contatos (principal)
    email VARCHAR(200),
    telefone VARCHAR(20),
    celular VARCHAR(20),
    whatsapp VARCHAR(20),

    -- Redes sociais
    instagram VARCHAR(100),
    facebook VARCHAR(100),
    twitter VARCHAR(100),

    -- Foto
    foto_url TEXT,

    -- Informações adicionais
    observacoes TEXT,
    como_conheceu VARCHAR(200),

    -- Liderança vinculada
    lideranca_id UUID REFERENCES pessoas(id) ON DELETE SET NULL,

    -- Controle de comunicação
    aceita_whatsapp BOOLEAN DEFAULT TRUE,
    aceita_sms BOOLEAN DEFAULT TRUE,
    aceita_email BOOLEAN DEFAULT TRUE,

    -- Estatísticas
    total_demandas INTEGER DEFAULT 0,
    ultima_interacao TIMESTAMP WITH TIME ZONE,

    -- Metadados
    dados_extras JSONB DEFAULT '{}',
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID REFERENCES usuarios(id),
    atualizado_por UUID REFERENCES usuarios(id)
);

-- Contatos adicionais de pessoas
CREATE TABLE pessoa_contatos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pessoa_id UUID NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
    tipo tipo_contato NOT NULL,
    valor VARCHAR(200) NOT NULL,
    descricao VARCHAR(100),
    principal BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tags de pessoas
CREATE TABLE pessoa_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pessoa_id UUID NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID REFERENCES usuarios(id),
    UNIQUE(pessoa_id, tag_id)
);

-- Histórico de visitas ao gabinete
CREATE TABLE visitas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gabinete_id UUID NOT NULL REFERENCES gabinetes(id) ON DELETE CASCADE,
    subgabinete_id UUID REFERENCES subgabinetes(id) ON DELETE SET NULL,
    pessoa_id UUID NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
    data_visita TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    motivo TEXT,
    atendente_id UUID REFERENCES usuarios(id),
    observacoes TEXT,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SISTEMA DE DEMANDAS/SOLICITAÇÕES
-- =====================================================

-- Categorias de demandas
CREATE TABLE demanda_categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gabinete_id UUID NOT NULL REFERENCES gabinetes(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    cor VARCHAR(7) DEFAULT '#6B7280',
    icone VARCHAR(50),
    sla_dias INTEGER DEFAULT 30,
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(gabinete_id, nome)
);

-- Demandas
CREATE TABLE demandas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gabinete_id UUID NOT NULL REFERENCES gabinetes(id) ON DELETE CASCADE,
    subgabinete_id UUID REFERENCES subgabinetes(id) ON DELETE SET NULL,
    numero_protocolo VARCHAR(50) NOT NULL,

    -- Solicitante
    pessoa_id UUID REFERENCES pessoas(id) ON DELETE SET NULL,
    nome_solicitante VARCHAR(200),
    contato_solicitante VARCHAR(200),

    -- Classificação
    categoria_id UUID REFERENCES demanda_categorias(id) ON DELETE SET NULL,
    status status_demanda DEFAULT 'aberta',
    prioridade prioridade_demanda DEFAULT 'normal',

    -- Conteúdo
    titulo VARCHAR(300) NOT NULL,
    descricao TEXT NOT NULL,

    -- Localização (se aplicável)
    cep VARCHAR(10),
    logradouro VARCHAR(200),
    numero VARCHAR(20),
    bairro VARCHAR(100),
    cidade_id INTEGER REFERENCES cidades(id),
    estado_id INTEGER REFERENCES estados(id),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Encaminhamento
    orgao_destino VARCHAR(200),
    numero_oficio VARCHAR(50),
    data_encaminhamento DATE,

    -- Datas
    data_abertura TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_prazo DATE,
    data_conclusao TIMESTAMP WITH TIME ZONE,

    -- Responsável
    responsavel_id UUID REFERENCES usuarios(id),

    -- Lembretes
    lembrete_ativo BOOLEAN DEFAULT FALSE,
    lembrete_data TIMESTAMP WITH TIME ZONE,
    lembrete_mensagem TEXT,

    -- Resultado
    parecer TEXT,
    avaliacao INTEGER CHECK (avaliacao >= 1 AND avaliacao <= 5),
    feedback TEXT,

    -- Metadados
    dados_extras JSONB DEFAULT '{}',
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID REFERENCES usuarios(id),
    atualizado_por UUID REFERENCES usuarios(id),

    UNIQUE(gabinete_id, numero_protocolo)
);

-- Tags de demandas
CREATE TABLE demanda_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    demanda_id UUID NOT NULL REFERENCES demandas(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID REFERENCES usuarios(id),
    UNIQUE(demanda_id, tag_id)
);

-- Histórico/Andamentos de demandas
CREATE TABLE demanda_andamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    demanda_id UUID NOT NULL REFERENCES demandas(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id),
    status_anterior status_demanda,
    status_novo status_demanda,
    descricao TEXT NOT NULL,
    interno BOOLEAN DEFAULT FALSE,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SISTEMA DE DOCUMENTOS
-- =====================================================

-- Documentos digitalizados
CREATE TABLE documentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gabinete_id UUID NOT NULL REFERENCES gabinetes(id) ON DELETE CASCADE,

    -- Vinculação
    pessoa_id UUID REFERENCES pessoas(id) ON DELETE SET NULL,
    demanda_id UUID REFERENCES demandas(id) ON DELETE SET NULL,

    -- Arquivo
    tipo tipo_documento DEFAULT 'outro',
    nome VARCHAR(300) NOT NULL,
    nome_original VARCHAR(300),
    descricao TEXT,
    mime_type VARCHAR(100),
    tamanho_bytes BIGINT,
    url TEXT NOT NULL,

    -- Metadados
    dados_extras JSONB DEFAULT '{}',
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID REFERENCES usuarios(id)
);

-- =====================================================
-- SISTEMA DE COMUNICAÇÃO
-- =====================================================

-- Mensagens enviadas (SMS, WhatsApp)
CREATE TABLE mensagens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gabinete_id UUID NOT NULL REFERENCES gabinetes(id) ON DELETE CASCADE,
    pessoa_id UUID REFERENCES pessoas(id) ON DELETE SET NULL,

    tipo VARCHAR(20) NOT NULL, -- sms, whatsapp, email
    destinatario VARCHAR(200) NOT NULL,
    assunto VARCHAR(300),
    conteudo TEXT NOT NULL,

    -- Status
    status VARCHAR(20) DEFAULT 'pendente', -- pendente, enviada, entregue, erro
    erro_mensagem TEXT,

    -- Metadados
    dados_extras JSONB DEFAULT '{}',
    data_envio TIMESTAMP WITH TIME ZONE,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID REFERENCES usuarios(id)
);

-- Templates de mensagens
CREATE TABLE mensagem_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gabinete_id UUID NOT NULL REFERENCES gabinetes(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) NOT NULL, -- sms, whatsapp, email
    assunto VARCHAR(300),
    conteudo TEXT NOT NULL,
    variaveis JSONB DEFAULT '[]',
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(gabinete_id, nome, tipo)
);

-- =====================================================
-- SISTEMA DE LEMBRETES E NOTIFICAÇÕES
-- =====================================================

-- Lembretes
CREATE TABLE lembretes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gabinete_id UUID NOT NULL REFERENCES gabinetes(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,

    -- Vinculação opcional
    pessoa_id UUID REFERENCES pessoas(id) ON DELETE SET NULL,
    demanda_id UUID REFERENCES demandas(id) ON DELETE SET NULL,

    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    data_lembrete TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Recorrência
    recorrente BOOLEAN DEFAULT FALSE,
    frequencia VARCHAR(20), -- diaria, semanal, mensal, anual

    -- Status
    visualizado BOOLEAN DEFAULT FALSE,
    concluido BOOLEAN DEFAULT FALSE,

    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    criado_por UUID REFERENCES usuarios(id)
);

-- Notificações
CREATE TABLE notificacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gabinete_id UUID NOT NULL REFERENCES gabinetes(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,

    tipo VARCHAR(50) NOT NULL, -- aniversario, demanda_prazo, lembrete, sistema
    titulo VARCHAR(200) NOT NULL,
    mensagem TEXT,
    link VARCHAR(500),
    dados JSONB DEFAULT '{}',

    lida BOOLEAN DEFAULT FALSE,
    data_leitura TIMESTAMP WITH TIME ZONE,

    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- AUDITORIA
-- =====================================================

-- Log de auditoria
CREATE TABLE auditoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gabinete_id UUID REFERENCES gabinetes(id) ON DELETE SET NULL,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,

    tabela VARCHAR(100) NOT NULL,
    registro_id UUID,
    acao VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    dados_antigos JSONB,
    dados_novos JSONB,

    ip VARCHAR(45),
    user_agent TEXT,

    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ÍNDICES
-- =====================================================

-- Índices para gabinetes
CREATE INDEX idx_gabinetes_codigo ON gabinetes(codigo);
CREATE INDEX idx_gabinetes_ativo ON gabinetes(ativo);

-- Índices para subgabinetes
CREATE INDEX idx_subgabinetes_gabinete ON subgabinetes(gabinete_id);
CREATE INDEX idx_subgabinetes_cidade ON subgabinetes(cidade);
CREATE INDEX idx_subgabinetes_ativo ON subgabinetes(ativo);

-- Índices para usuários
CREATE INDEX idx_usuarios_gabinete ON usuarios(gabinete_id);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_status ON usuarios(status);

-- Índices para pessoas
CREATE INDEX idx_pessoas_gabinete ON pessoas(gabinete_id);
CREATE INDEX idx_pessoas_subgabinete ON pessoas(subgabinete_id);
CREATE INDEX idx_pessoas_tipo ON pessoas(tipo);
CREATE INDEX idx_pessoas_nome ON pessoas USING gin(nome gin_trgm_ops);
CREATE INDEX idx_pessoas_cpf ON pessoas(cpf);
CREATE INDEX idx_pessoas_cidade ON pessoas(cidade_id);
CREATE INDEX idx_pessoas_nascimento ON pessoas(data_nascimento);
CREATE INDEX idx_pessoas_lideranca ON pessoas(lideranca_id);
CREATE INDEX idx_pessoas_ativo ON pessoas(ativo);

-- Índices para demandas
CREATE INDEX idx_demandas_gabinete ON demandas(gabinete_id);
CREATE INDEX idx_demandas_subgabinete ON demandas(subgabinete_id);
CREATE INDEX idx_demandas_protocolo ON demandas(numero_protocolo);
CREATE INDEX idx_demandas_pessoa ON demandas(pessoa_id);
CREATE INDEX idx_demandas_status ON demandas(status);
CREATE INDEX idx_demandas_prioridade ON demandas(prioridade);
CREATE INDEX idx_demandas_categoria ON demandas(categoria_id);
CREATE INDEX idx_demandas_responsavel ON demandas(responsavel_id);
CREATE INDEX idx_demandas_abertura ON demandas(data_abertura);
CREATE INDEX idx_demandas_prazo ON demandas(data_prazo);
CREATE INDEX idx_demandas_lembrete ON demandas(lembrete_ativo, lembrete_data);

-- Índices para tags
CREATE INDEX idx_tags_gabinete ON tags(gabinete_id);
CREATE INDEX idx_tags_categoria ON tags(categoria_id);
CREATE INDEX idx_pessoa_tags_pessoa ON pessoa_tags(pessoa_id);
CREATE INDEX idx_pessoa_tags_tag ON pessoa_tags(tag_id);
CREATE INDEX idx_demanda_tags_demanda ON demanda_tags(demanda_id);
CREATE INDEX idx_demanda_tags_tag ON demanda_tags(tag_id);

-- Índices para documentos
CREATE INDEX idx_documentos_gabinete ON documentos(gabinete_id);
CREATE INDEX idx_documentos_pessoa ON documentos(pessoa_id);
CREATE INDEX idx_documentos_demanda ON documentos(demanda_id);

-- Índices para mensagens
CREATE INDEX idx_mensagens_gabinete ON mensagens(gabinete_id);
CREATE INDEX idx_mensagens_pessoa ON mensagens(pessoa_id);
CREATE INDEX idx_mensagens_status ON mensagens(status);

-- Índices para notificações
CREATE INDEX idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX idx_notificacoes_data ON notificacoes(data_criacao);

-- Índices para auditoria
CREATE INDEX idx_auditoria_gabinete ON auditoria(gabinete_id);
CREATE INDEX idx_auditoria_usuario ON auditoria(usuario_id);
CREATE INDEX idx_auditoria_tabela ON auditoria(tabela);
CREATE INDEX idx_auditoria_data ON auditoria(data_criacao);

-- =====================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar data_atualizacao automaticamente
CREATE OR REPLACE FUNCTION fn_atualiza_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de atualização automática
CREATE TRIGGER tr_gabinetes_atualizacao BEFORE UPDATE ON gabinetes
    FOR EACH ROW EXECUTE FUNCTION fn_atualiza_timestamp();

CREATE TRIGGER tr_subgabinetes_atualizacao BEFORE UPDATE ON subgabinetes
    FOR EACH ROW EXECUTE FUNCTION fn_atualiza_timestamp();

CREATE TRIGGER tr_usuarios_atualizacao BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION fn_atualiza_timestamp();

CREATE TRIGGER tr_pessoas_atualizacao BEFORE UPDATE ON pessoas
    FOR EACH ROW EXECUTE FUNCTION fn_atualiza_timestamp();

CREATE TRIGGER tr_demandas_atualizacao BEFORE UPDATE ON demandas
    FOR EACH ROW EXECUTE FUNCTION fn_atualiza_timestamp();

-- Função para gerar número de protocolo
CREATE OR REPLACE FUNCTION fn_gera_protocolo(p_gabinete_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    v_ano VARCHAR(4);
    v_sequencia INTEGER;
    v_protocolo VARCHAR(50);
BEGIN
    v_ano := TO_CHAR(CURRENT_DATE, 'YYYY');

    SELECT COALESCE(MAX(
        CAST(SPLIT_PART(numero_protocolo, '-', 2) AS INTEGER)
    ), 0) + 1 INTO v_sequencia
    FROM gpvx.demandas
    WHERE gabinete_id = p_gabinete_id
    AND numero_protocolo LIKE v_ano || '-%';

    v_protocolo := v_ano || '-' || LPAD(v_sequencia::TEXT, 6, '0');

    RETURN v_protocolo;
END;
$$ LANGUAGE plpgsql;

-- Função para buscar aniversariantes
CREATE OR REPLACE FUNCTION fn_aniversariantes_periodo(
    p_gabinete_id UUID,
    p_data_inicio DATE DEFAULT CURRENT_DATE,
    p_data_fim DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    pessoa_id UUID,
    nome VARCHAR(200),
    data_nascimento DATE,
    idade INTEGER,
    telefone VARCHAR(20),
    celular VARCHAR(20),
    whatsapp VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.nome,
        p.data_nascimento,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.data_nascimento))::INTEGER,
        p.telefone,
        p.celular,
        p.whatsapp
    FROM gpvx.pessoas p
    WHERE p.gabinete_id = p_gabinete_id
    AND p.ativo = TRUE
    AND p.data_nascimento IS NOT NULL
    AND (
        (EXTRACT(MONTH FROM p.data_nascimento), EXTRACT(DAY FROM p.data_nascimento))
        BETWEEN
        (EXTRACT(MONTH FROM p_data_inicio), EXTRACT(DAY FROM p_data_inicio))
        AND
        (EXTRACT(MONTH FROM p_data_fim), EXTRACT(DAY FROM p_data_fim))
    )
    ORDER BY
        EXTRACT(MONTH FROM p.data_nascimento),
        EXTRACT(DAY FROM p.data_nascimento);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VIEWS
-- =====================================================

-- View de aniversariantes do dia
CREATE OR REPLACE VIEW vw_aniversariantes_hoje AS
SELECT
    p.id,
    p.gabinete_id,
    p.subgabinete_id,
    p.nome,
    p.data_nascimento,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.data_nascimento))::INTEGER AS idade,
    p.telefone,
    p.celular,
    p.whatsapp,
    p.email,
    p.tipo
FROM gpvx.pessoas p
WHERE p.ativo = TRUE
AND p.data_nascimento IS NOT NULL
AND EXTRACT(MONTH FROM p.data_nascimento) = EXTRACT(MONTH FROM CURRENT_DATE)
AND EXTRACT(DAY FROM p.data_nascimento) = EXTRACT(DAY FROM CURRENT_DATE);

-- View de demandas pendentes com prazo vencido
CREATE OR REPLACE VIEW vw_demandas_atrasadas AS
SELECT
    d.*,
    p.nome AS nome_solicitante_pessoa,
    c.nome AS categoria_nome,
    u.nome AS responsavel_nome,
    CURRENT_DATE - d.data_prazo AS dias_atraso
FROM gpvx.demandas d
LEFT JOIN gpvx.pessoas p ON d.pessoa_id = p.id
LEFT JOIN gpvx.demanda_categorias c ON d.categoria_id = c.id
LEFT JOIN gpvx.usuarios u ON d.responsavel_id = u.id
WHERE d.status NOT IN ('concluida', 'cancelada')
AND d.data_prazo < CURRENT_DATE;

-- View estatísticas por gabinete
CREATE OR REPLACE VIEW vw_estatisticas_gabinete AS
SELECT
    g.id AS gabinete_id,
    g.nome AS gabinete_nome,
    (SELECT COUNT(*) FROM gpvx.pessoas p WHERE p.gabinete_id = g.id AND p.ativo = TRUE) AS total_pessoas,
    (SELECT COUNT(*) FROM gpvx.pessoas p WHERE p.gabinete_id = g.id AND p.tipo = 'lideranca' AND p.ativo = TRUE) AS total_liderancas,
    (SELECT COUNT(*) FROM gpvx.demandas d WHERE d.gabinete_id = g.id) AS total_demandas,
    (SELECT COUNT(*) FROM gpvx.demandas d WHERE d.gabinete_id = g.id AND d.status = 'aberta') AS demandas_abertas,
    (SELECT COUNT(*) FROM gpvx.demandas d WHERE d.gabinete_id = g.id AND d.status = 'concluida') AS demandas_concluidas,
    (SELECT COUNT(*) FROM gpvx.subgabinetes s WHERE s.gabinete_id = g.id AND s.ativo = TRUE) AS total_subgabinetes,
    (SELECT COUNT(*) FROM gpvx.usuarios u WHERE u.gabinete_id = g.id AND u.status = 'ativo') AS total_usuarios
FROM gpvx.gabinetes g
WHERE g.ativo = TRUE;

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Inserir estados brasileiros
INSERT INTO estados (codigo_ibge, sigla, nome) VALUES
(12, 'AC', 'Acre'),
(27, 'AL', 'Alagoas'),
(16, 'AP', 'Amapá'),
(13, 'AM', 'Amazonas'),
(29, 'BA', 'Bahia'),
(23, 'CE', 'Ceará'),
(53, 'DF', 'Distrito Federal'),
(32, 'ES', 'Espírito Santo'),
(52, 'GO', 'Goiás'),
(21, 'MA', 'Maranhão'),
(51, 'MT', 'Mato Grosso'),
(50, 'MS', 'Mato Grosso do Sul'),
(31, 'MG', 'Minas Gerais'),
(15, 'PA', 'Pará'),
(25, 'PB', 'Paraíba'),
(41, 'PR', 'Paraná'),
(26, 'PE', 'Pernambuco'),
(22, 'PI', 'Piauí'),
(33, 'RJ', 'Rio de Janeiro'),
(24, 'RN', 'Rio Grande do Norte'),
(43, 'RS', 'Rio Grande do Sul'),
(11, 'RO', 'Rondônia'),
(14, 'RR', 'Roraima'),
(42, 'SC', 'Santa Catarina'),
(35, 'SP', 'São Paulo'),
(28, 'SE', 'Sergipe'),
(17, 'TO', 'Tocantins');

-- Inserir perfis padrão do sistema
INSERT INTO perfis (id, gabinete_id, codigo, nome, descricao, permissoes, nivel_acesso, sistema) VALUES
(uuid_generate_v4(), NULL, 'super_admin', 'Super Administrador', 'Acesso total ao sistema', '["*"]', 100, TRUE),
(uuid_generate_v4(), NULL, 'admin_gabinete', 'Administrador de Gabinete', 'Administrador do gabinete', '["gabinete.*", "usuarios.*", "pessoas.*", "demandas.*", "relatorios.*", "configuracoes.*"]', 90, TRUE),
(uuid_generate_v4(), NULL, 'coordenador', 'Coordenador', 'Coordenador de equipe', '["pessoas.*", "demandas.*", "relatorios.visualizar"]', 70, TRUE),
(uuid_generate_v4(), NULL, 'atendente', 'Atendente', 'Atendimento ao público', '["pessoas.visualizar", "pessoas.criar", "pessoas.editar", "demandas.visualizar", "demandas.criar", "demandas.editar"]', 50, TRUE),
(uuid_generate_v4(), NULL, 'consulta', 'Consulta', 'Apenas visualização', '["pessoas.visualizar", "demandas.visualizar", "relatorios.visualizar"]', 10, TRUE);

-- =====================================================
-- COMENTÁRIOS NAS TABELAS
-- =====================================================

COMMENT ON SCHEMA gpvx IS 'Schema principal do sistema GPVx - Gabinete Parlamentar Virtual';

COMMENT ON TABLE gabinetes IS 'Gabinetes parlamentares - tenant principal do sistema multi-tenant';
COMMENT ON TABLE subgabinetes IS 'Subgabinetes para campanhas eleitorais em diferentes regiões';
COMMENT ON TABLE usuarios IS 'Usuários do sistema com controle de acesso';
COMMENT ON TABLE perfis IS 'Perfis de acesso e permissões';
COMMENT ON TABLE pessoas IS 'Cadastro de cidadãos, lideranças e apoiadores';
COMMENT ON TABLE demandas IS 'Demandas e solicitações dos cidadãos';
COMMENT ON TABLE tags IS 'Tags e marcações para segmentação';
COMMENT ON TABLE documentos IS 'Documentos digitalizados';
COMMENT ON TABLE mensagens IS 'Registro de mensagens enviadas (SMS, WhatsApp, Email)';
COMMENT ON TABLE auditoria IS 'Log de auditoria de todas as operações';
