# Fluxos do Maestro (F4-02)

Teste de ponta a ponta no emulador Android, pelo Expo Go: criar conta → onboarding →
anotar almoço → anotar peso → sair. Roda também com fonte em 200% e modo escuro.

## Pré-requisitos

1. **Maestro** instalado (na máquina do projeto: `D:\tools\maestro\bin`) e `adb` no `PATH`
   (`%LOCALAPPDATA%\Android\Sdk\platform-tools`).
2. **Emulador** ligado com o Expo Go instalado:
   `ANDROID_AVD_HOME=D:\Android\avd emulator -avd Medium_Phone_API_37.0 -gpu swiftshader_indirect`.
3. **API local** em `:3000` (`docker compose up -d postgres` + `pnpm --filter api start:dev`).
   O fluxo cria uma conta nova `maestro-<timestamp>@local.test` no banco local a cada execução.
4. **Metro** em `:8081` (`cd apps/mobile && npx expo start`).

O `run.sh` faz o `adb reverse` das duas portas, apaga os dados do Expo Go e fixa o idioma
dele em pt-BR antes de cada fluxo.

## Rodar

```bash
cd apps/mobile
.maestro/run.sh                         # todos os fluxos
FONT_SCALE=2.0 DARK=1 .maestro/run.sh   # fonte 200% + modo escuro
LOCALE=en .maestro/run.sh               # só para olhar: os textos dos fluxos são pt-BR
```

Em caso de falha, prints e a árvore da tela ficam em `~/.maestro/tests/<data>/`.

## Armadilhas já encontradas

- **Teclado**: use `runFlow: subflows/hide-keyboard.yaml`, nunca `hideKeyboard` sozinho.
  Ele volta antes do fim da animação, e o passo seguinte vê o alvo ainda coberto.
- **`centerElement: true` perto de campo de texto**: centralizar faz um arrasto que começa
  no meio da tela. Com fonte grande, o meio da tela é um campo. O toque reabre o teclado e o
  botão some atrás dele.
- **Fonte grande empurra botões para baixo da dobra**: espere por um texto do topo da tela
  (ex.: o subtítulo das boas-vindas) e use `scrollUntilVisible` para o botão, não `assertVisible`.
- **Rótulo e campo têm o mesmo texto**: o campo é `index: 1`.
- **Memória**: o Maestro roda em Java. Em 07/10 ele travou por falta de memória
  (`hs_err_pid*.log`) com emulador, Metro e API abertos juntos. Feche o que não estiver usando.
