# Operacoes de Banco de Dados GPVx

Este documento descreve como executar operacoes no banco de dados do GPVx.

## Conexao com o Banco

O GPVx usa PostgreSQL com as seguintes configuracoes:
- Host: localhost
- Porta: 5432
- Banco: gpvx
- Usuario: gpvx
- Senha: gpvx2025
- Schema: gpvx

## Padrao para Scripts de Migracao

Use a conexao do app SQLAlchemy para garantir compatibilidade:

```python
"""
Script de migracao exemplo.
Execute: python nome_script.py
"""
import asyncio
from sqlalchemy import text
from app.db.database import engine


async def migrate():
    """Executa a migracao."""
    print("Iniciando migracao...")

    async with engine.begin() as conn:
        # Verificar colunas existentes
        result = await conn.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'gpvx' AND table_name = 'sua_tabela'
        """))
        existing_columns = [row[0] for row in result.fetchall()]

        # Adicionar coluna se nao existir
        if 'nova_coluna' not in existing_columns:
            await conn.execute(text("""
                ALTER TABLE gpvx.sua_tabela
                ADD COLUMN nova_coluna TIPO_DADO
            """))
            print("Coluna adicionada!")

        print("Migracao concluida!")


if __name__ == "__main__":
    asyncio.run(migrate())
```

## Execucao de Scripts

Sempre execute a partir da pasta do backend usando o venv:

```powershell
cd C:/gpvx-back
./venv/Scripts/python.exe nome_do_script.py
```

## Scripts Disponiveis

### seed.py
Cria schema, tabelas e dados iniciais.
```powershell
./venv/Scripts/python.exe seed.py
```

### seed_municipios.py
Importa todos os municipios do Brasil via API IBGE.
```powershell
./venv/Scripts/python.exe seed_municipios.py
```

### migrate_add_columns.py
Adiciona colunas `municipio_id` e `setor_id` na tabela `pessoas`.
```powershell
./venv/Scripts/python.exe migrate_add_columns.py
```

## Estrutura das Tabelas Principais

### gpvx.estados
- id: INTEGER (PK)
- sigla: VARCHAR(2)
- nome: VARCHAR(50)
- codigo_ibge: INTEGER
- ativo: BOOLEAN

### gpvx.municipios
- id: UUID (PK)
- estado_id: INTEGER (FK -> estados.id)
- nome: VARCHAR(100)
- codigo_ibge: INTEGER
- ativo: BOOLEAN

### gpvx.setores
- id: UUID (PK)
- municipio_id: UUID (FK -> municipios.id)
- nome: VARCHAR(100)
- descricao: VARCHAR(255)
- ativo: BOOLEAN

### gpvx.pessoas
- id: UUID (PK)
- gabinete_id: UUID (FK)
- estado_id: INTEGER (FK -> estados.id)
- municipio_id: UUID (FK -> municipios.id)
- setor_id: UUID (FK -> setores.id)
- nome, whatsapp, genero, etc.

## Exemplo: Verificar Estrutura de Tabela

```python
import asyncio
from sqlalchemy import text
from app.db.database import engine


async def check_table(table_name):
    async with engine.begin() as conn:
        result = await conn.execute(text(f"""
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = 'gpvx' AND table_name = '{table_name}'
            ORDER BY ordinal_position
        """))
        print(f"\nEstrutura da tabela {table_name}:")
        for col in result.fetchall():
            print(f"  - {col[0]}: {col[1]}")


if __name__ == "__main__":
    asyncio.run(check_table("pessoas"))
```

## Exemplo: Adicionar Nova Coluna

```python
import asyncio
from sqlalchemy import text
from app.db.database import engine


async def add_column():
    async with engine.begin() as conn:
        await conn.execute(text("""
            ALTER TABLE gpvx.pessoas
            ADD COLUMN IF NOT EXISTS nova_coluna VARCHAR(100)
        """))
        print("Coluna adicionada!")


if __name__ == "__main__":
    asyncio.run(add_column())
```

## Notas Importantes

1. **Sempre use o schema 'gpvx'** nas queries SQL
2. **Use UUID para IDs** de novas tabelas (exceto estados que usa INTEGER)
3. **Sempre teste** as migracoes em ambiente de desenvolvimento primeiro
4. **Faca backup** antes de executar migracoes em producao
5. **Use `async with engine.begin()`** para transacoes com commit automatico
