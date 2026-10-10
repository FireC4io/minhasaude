#!/usr/bin/env bash
# Roda os fluxos do Maestro contra o emulador. Uso: .maestro/run.sh [fluxo.yaml ...]
# Sem argumento, roda todos os fluxos desta pasta (os de subflows/ não rodam sozinhos).
#
# Antes de cada fluxo: apaga os dados do Expo Go (ninguém logado) e fixa o
# idioma do Expo Go em pt-BR, independente do idioma do emulador. A limpeza
# fica aqui, e não no YAML, porque o `clearState` do Maestro também apaga o
# idioma por app.
#   FONT_SCALE=2.0 .maestro/run.sh → fonte do sistema em 200%
#   DARK=1 .maestro/run.sh          → modo escuro do sistema
#   LOCALE=en .maestro/run.sh   → roda com o app em outro idioma (os textos dos
#                                 fluxos são em pt-BR, então é só para olhar)
set -euo pipefail
cd "$(dirname "$0")"

LOCALE="${LOCALE:-pt-BR}"
APP=host.exp.exponent

if [ "$#" -eq 0 ]; then
  set -- *.yaml
fi

adb reverse tcp:3000 tcp:3000 >/dev/null
adb reverse tcp:8081 tcp:8081 >/dev/null

# Fonte e tema são do aparelho inteiro: voltam ao normal no fim, mesmo se falhar.
adb shell settings put system font_scale "${FONT_SCALE:-1.0}"
adb shell cmd uimode night "$([ "${DARK:-0}" = 1 ] && echo yes || echo no)" >/dev/null
trap 'adb shell settings put system font_scale 1.0; adb shell cmd uimode night no >/dev/null' EXIT

status=0
for flow in "$@"; do
  adb shell pm clear "$APP" >/dev/null
  adb shell cmd locale set-app-locales "$APP" --locales "$LOCALE"
  echo "▶ $flow"
  maestro test "$flow" "${MAESTRO_ARGS[@]+"${MAESTRO_ARGS[@]}"}" || status=1
done
exit "$status"
