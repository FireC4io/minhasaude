#!/usr/bin/env bash
# Ensaio de restauração do backup: restaura a cópia num Postgres 17 temporário,
# com os dados só na memória (tmpfs), e compara a contagem de linhas de cada
# tabela com a do banco de origem. Só números vão para o log, nunca dados.
#
# Uso: scripts/ensaio-restauracao.sh <pasta com db.dump> <arquivo de contagens da origem>
# O arquivo de contagens tem uma linha "tabela|quantidade" por tabela (gerado
# pelo workflow de backup a partir da produção, ou à mão no teste local).
set -euo pipefail

work="$1"
origin_counts="$2"
container="ensaio-restauracao-$$"
tables=$(cut -d'|' -f1 "$origin_counts")

cleanup() { docker rm -f "$container" > /dev/null 2>&1 || true; }
trap cleanup EXIT

docker run -d --name "$container" -e POSTGRES_PASSWORD=ensaio -e POSTGRES_DB=ensaio \
  --tmpfs /var/lib/postgresql/data:rw,size=1g -v "$work:/in:ro" postgres:17 > /dev/null

for _ in $(seq 1 30); do
  docker exec "$container" pg_isready -U postgres -d ensaio > /dev/null 2>&1 && break
  sleep 1
done

psql_ensaio() { docker exec -i "$container" psql -U postgres -d ensaio -v ON_ERROR_STOP=1 -tAq "$@"; }

# Mesmo método do scripts/restore-backup.sh (o que o dono usaria numa
# emergência): extensões no schema da origem (o uuid-ossp fica em `extensions`
# no Supabase e em `public` no banco local) e --exit-on-error.
uuid_schema="$(docker exec "$container" pg_restore --schema-only -f - /in/db.dump \
  | grep -o '[a-z_]*\.uuid_generate_v4' | head -1 | cut -d. -f1)"
uuid_schema="${uuid_schema:-public}"
psql_ensaio -c "CREATE SCHEMA IF NOT EXISTS \"$uuid_schema\"; CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\" SCHEMA \"$uuid_schema\"; CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA public; CREATE EXTENSION IF NOT EXISTS unaccent SCHEMA public;"
if ! docker exec "$container" bash -c \
  "pg_restore --list /in/db.dump | grep -v ' SCHEMA - public ' > /tmp/lista && pg_restore -U postgres -d ensaio --no-owner --no-privileges --exit-on-error --use-list=/tmp/lista /in/db.dump" \
  > /dev/null 2> "$work/restore-erros.txt"; then
  # A mensagem de erro traz só o nome do objeto, nunca linhas de dados.
  echo "::error::a restauração parou: $(grep -m1 'error:' "$work/restore-erros.txt" | sed -E 's/^pg_restore: //')"
  rm -f "$work/restore-erros.txt"
  exit 1
fi
rm -f "$work/restore-erros.txt"
echo "Cópia restaurada (uuid-ossp em '$uuid_schema')."

failed=0
printf '%-20s %10s %10s\n' tabela origem restaurado
for table in $tables; do
  origin=$(grep "^$table|" "$origin_counts" | cut -d'|' -f2)
  restored=$(psql_ensaio -c "SELECT count(*) FROM public.\"$table\"" 2>/dev/null || echo "ausente")
  printf '%-20s %10s %10s\n' "$table" "$origin" "$restored"
  if [ "$restored" = "ausente" ]; then
    echo "::error::a tabela $table não foi restaurada"; failed=1; continue
  fi
  # Entre a cópia e a contagem pode entrar ou sair algum registro: tolera 1% ou 5 linhas.
  diff=$(( origin > restored ? origin - restored : restored - origin ))
  margin=$(( origin / 100 > 5 ? origin / 100 : 5 ))
  if [ "$diff" -gt "$margin" ]; then
    echo "::error::$table tem $restored linhas restauradas e $origin na origem"; failed=1
  fi
done

exit "$failed"
