#!/usr/bin/env bash
# Restaura um backup cifrado do banco num Postgres 17 descartável (docker) e
# confere a contagem de linhas. Serve para o ensaio periódico e como primeiro
# passo de uma restauração de verdade. Procedimento completo: docs/security/backup.md
#
# Uso: scripts/restore-backup.sh <arquivo.dump.age> <chave-privada-age.txt>
#
# A chave privada é só montada dentro do container (somente leitura); este
# script nunca a lê nem a imprime. A cópia decifrada fica numa pasta
# temporária que é apagada no fim, mesmo se algo falhar.
set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Uso: $0 <arquivo.dump.age> <chave-privada-age.txt>" >&2
  exit 2
fi

BACKUP="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
KEY_DIR="$(cd "$(dirname "$2")" && pwd)"
KEY_FILE="$(basename "$2")"
WORK="$(mktemp -d)"
CONTAINER="gotavital-restore"
export MSYS_NO_PATHCONV=1

# No Git Bash (Windows) o Docker não entende caminhos /tmp/...; no Linux é igual.
host_path() {
  if command -v cygpath >/dev/null 2>&1; then cygpath -m "$1"; else printf '%s' "$1"; fi
}
WORK_HOST="$(host_path "$WORK")"
KEY_DIR_HOST="$(host_path "$KEY_DIR")"

cleanup() {
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT

cp "$BACKUP" "$WORK/db.dump.age"

echo "1/4 Decifrando..."
docker run --rm -v "$WORK_HOST:/w" -v "$KEY_DIR_HOST:/k:ro" alpine:3.20 sh -c \
  "apk add --no-cache age >/dev/null 2>&1 && age -d -i '/k/$KEY_FILE' -o /w/db.dump /w/db.dump.age"

echo "2/4 Subindo Postgres 17 descartável..."
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker run -d --name "$CONTAINER" -e POSTGRES_PASSWORD=restore -v "$WORK_HOST:/w:ro" postgres:17 >/dev/null
for _ in $(seq 1 30); do
  docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1 && break
  sleep 1
done

# A cópia é só do schema public; as extensões precisam existir antes, no mesmo
# schema da origem. Na produção (Supabase) o uuid-ossp fica em `extensions`;
# no banco local, em `public`. Descobre pela própria cópia.
UUID_SCHEMA="$(docker exec "$CONTAINER" pg_restore --schema-only -f - /w/db.dump \
  | grep -o '[a-z_]*\.uuid_generate_v4' | head -1 | cut -d. -f1)"
UUID_SCHEMA="${UUID_SCHEMA:-public}"

echo "3/4 Restaurando (uuid-ossp em '$UUID_SCHEMA')..."
docker exec "$CONTAINER" psql -U postgres -v ON_ERROR_STOP=1 -q -c \
  "CREATE SCHEMA IF NOT EXISTS \"$UUID_SCHEMA\"; CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\" SCHEMA \"$UUID_SCHEMA\"; CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA public; CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA public;"
# --exit-on-error: qualquer erro de restauração para o script (o schema public
# já existe no Postgres novo, por isso não usamos --create).
docker exec "$CONTAINER" bash -c \
  "pg_restore --list /w/db.dump | grep -v ' SCHEMA - public ' > /tmp/lista && pg_restore -U postgres -d postgres --no-owner --no-privileges --exit-on-error --use-list=/tmp/lista /w/db.dump"

echo "4/4 Linhas restauradas:"
for table in users profiles consents diary_entries body_measurements goal_targets foods; do
  printf '  %-18s %s\n' "$table" "$(docker exec "$CONTAINER" psql -U postgres -tAc "SELECT count(*) FROM public.$table")"
done
echo "  busca (trigramas)  $(docker exec "$CONTAINER" psql -U postgres -tAc "SELECT count(*) FROM public.foods WHERE public.immutable_unaccent(lower(name)) % 'arroz'") resultados para 'arroz'"
echo "Restauração conferida. O container e a cópia decifrada serão apagados."
