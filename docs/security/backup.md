# Backup do banco

O plano gratuito do Supabase não tem backup recuperável. Toda semana o workflow
`.github/workflows/backup.yml` gera uma cópia do banco de produção, confere que
ela é restaurável, **cifra com age** e guarda num bucket privado do Cloudflare R2.

## Como funciona

1. `pg_dump` 17 do schema `public`, com TLS conferindo o certificado do Supabase (`infra/supabase-root-2021.crt`).
2. `pg_restore --list` confere que a cópia tem os dados das tabelas principais.
3. A cópia é cifrada com a **chave pública** do age e a versão aberta é apagada (`shred`).
4. O arquivo `.dump.age` vai para `s3://gotavital-backups/gotavital/<data>.dump.age` no R2.

O GitHub só tem a chave pública: quem invadir o workflow ou o repositório não abre os backups.
A cópia aberta nunca sai do runner e **nunca** vira artefato do GitHub — o repositório é público.

## A chave privada

- Gerada em 10/10/2026, guardada pelo dono em `D:\gotavital-backup-chave\age-chave-privada.txt`.
- **Precisa de uma segunda cópia fora deste computador** (gerenciador de senhas ou pendrive). Sem ela, nenhum backup abre.
- Chave pública correspondente: `age1v95ug0mr2xkqh6np6fvlayye34nqv04fqcczm7w4h3tk7kwtjdusx9pgcd`
- Nunca commitar, nunca colar no chat, nunca subir para o R2 junto com os backups.

## Configuração (uma vez)

**Cloudflare R2**
1. Criar o bucket `gotavital-backups` (privado; não ligar acesso público).
2. *Settings → Object lifecycle rules*: apagar objetos com mais de 60 dias.
3. *Manage API tokens → Create API token*: permissão **Object Read & Write**, só para o bucket `gotavital-backups`.

**GitHub → Settings → Secrets and variables → Actions**

| Tipo | Nome | Valor |
|---|---|---|
| Secret | `BACKUP_DATABASE_URL` | A mesma `DATABASE_URL` do Render, **sem** `sslmode` |
| Secret | `R2_ACCOUNT_ID` | ID da conta Cloudflare |
| Secret | `R2_ACCESS_KEY_ID` | Do token do R2 |
| Secret | `R2_SECRET_ACCESS_KEY` | Do token do R2 |
| Variable | `BACKUP_AGE_RECIPIENT` | A chave pública acima |
| Variable | `BACKUP_BUCKET` | `gotavital-backups` |

Depois: *Actions → Backup do banco → Run workflow* para o primeiro backup.

## Restaurar

### Ensaio (fazer pelo menos uma vez por mês)

1. Baixar o backup mais recente do R2 (painel da Cloudflare → bucket → arquivo → Download).
2. `scripts/restore-backup.sh <arquivo.dump.age> D:/gotavital-backup-chave/age-chave-privada.txt`

O script decifra, sobe um Postgres 17 descartável no docker, cria as extensões no
mesmo schema da origem (na produção, `uuid-ossp` fica em `extensions`; `pg_trgm` e
`unaccent` em `public`), restaura, mostra a contagem de linhas e apaga tudo no fim.

### De verdade (banco perdido)

1. Criar um projeto novo no Supabase (região `sa-east-1`).
2. No SQL Editor do projeto novo: `CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA public; CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA public;` (o `uuid-ossp` já vem em `extensions`).
3. Decifrar o backup: `age -d -i age-chave-privada.txt -o db.dump <arquivo>.dump.age`
4. Restaurar sem recriar o schema public:
   `pg_restore --list db.dump | grep -v ' SCHEMA - public ' > lista`
   `pg_restore --no-owner --no-privileges --exit-on-error --use-list=lista -d "<URL do projeto novo>" db.dump`
5. Apagar o `db.dump` aberto. Trocar `DATABASE_URL` no Render e no secret `BACKUP_DATABASE_URL`.
6. A API aplica no boot só as migrations que faltarem (a tabela `migrations` vem no backup).

## Histórico de ensaios

| Data | Origem | Resultado |
|---|---|---|
| 10/10/2026 | Banco local (docker) | Contagem idêntica nas 7 tabelas; busca por trigramas funcionando. O primeiro ensaio falhou porque as extensões não vêm no dump do schema `public` — o script passou a criá-las antes. |
