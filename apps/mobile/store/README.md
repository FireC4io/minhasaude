# Imagens da Google Play

- `capturas/`: telas do app capturadas no emulador (1080×2400) com o **build de produção** (`npx expo start
  --no-dev --minify`, sem as prévias) contra a API **local**, com uma conta de demonstração. Nenhum dado real.
- `play/`: o que vai para a Play Console, gerado por `node apps/mobile/store/build-store-images.mjs` (precisa do
  Edge): `captura-1` a `captura-7` (1080×1920), `recurso-grafico` (1024×500) e `icone` (512×512, o próprio
  `assets/images/icon.png` reduzido).

Regras ao refazer: nada de tela em prévia (exames, voz, água, notas), nenhum e-mail ou nome visível (o recorte do
Perfil começa abaixo do e-mail), frases sem promessa de resultado. As frases e os recortes ficam em `SCREENS`, no
gerador.

Como capturar de novo:

1. API local com Postgres (`docker compose up -d postgres`, `pnpm --filter api build`, `node apps/api/dist/main.js`).
2. Conta de demonstração: perfil, ~10 semanas de peso e uma semana de diário, criados pela própria API (respeitar o
   limite de 60 pedidos por minuto).
3. Emulador com `adb reverse tcp:3000 tcp:3000` e `tcp:8081`, barra de status em modo demonstração
   (`settings put global sysui_demo_allowed 1` + `am broadcast -a com.android.systemui.demo -e command clock -e hhmm
   0941`), Expo Go com o "Tools button" desligado e o app em português.
4. `adb exec-out screencap -p > capturas/<nome>.png` e rodar o gerador.
