# Como sai uma versão do app

Vale para o teste fechado e para a loja. A API não entra aqui: ela vai para produção sozinha a cada push na `main`
(Render).

## Números de versão

| Número | Onde | Quando muda |
| --- | --- | --- |
| **Versão** (`1.0.0`) | `version` no `apps/mobile/app.json` | À mão, quando muda o que a pessoa vê: `1.0.x` correção, `1.x.0` função nova |
| **Build** (versionCode) | Guardado no EAS (`appVersionSource: remote`) | Sozinho a cada build `production` (`autoIncrement`). A Play recusa build repetido |

A tela **Perfil → Sobre o Gota Vital** mostra os dois, como `1.0.0 (3)`. Quando um testador relatar um problema,
pedir esse texto: ele diz exatamente qual build a pessoa tem.

## Passo a passo

1. **`main` verde**: CI, Sonar e e2e passando, sem nada local fora de commit.
2. **Versão**: se mudou algo visível, subir `version` no `app.json` e fazer commit (`chore(release): 1.0.1`).
3. **Build**: `cd apps/mobile && npx eas-cli build -p android --profile production`. Sai um AAB com o build seguinte.
4. **Enviar à Play** (um dos dois):
   - **Automático**: `npx eas-cli submit -p android --profile production --latest`. Vai para a trilha de **teste
     interno** como rascunho (`eas.json` → `submit.production`). Precisa da chave da conta de serviço (abaixo).
   - **À mão**: baixar o AAB pelo link do build e enviar em Play Console → Testar → Teste interno → Criar versão.
5. **Notas da versão** na Play (até 500 caracteres por idioma), no modelo abaixo.
6. **Conferir no celular** instalando pela Play: entrar, anotar, ver o progresso, sair.
7. **Promover** a versão do teste interno para o teste fechado (ou para produção, quando for a hora) na Play Console.
8. **Marcar no git**: `git tag android-1.0.1-3 && git push origin android-1.0.1-3` (versão-build).

## Modelo das notas da versão

```text
<pt-BR>
• O que mudou, em linguagem simples, do ponto de vista de quem usa
• Uma linha por mudança, no máximo cinco
</pt-BR>
```

Sem promessa de resultado de saúde e sem citar exames ou voz enquanto estiverem em prévia. Inglês e espanhol só
quando a ficha da loja nesses idiomas existir.

## Uma vez só: envio automático (opcional)

O `eas submit` precisa de uma conta de serviço do Google com acesso à Play Console:

1. Google Cloud (projeto `gotavital`) → IAM → Contas de serviço → criar `eas-submit`, sem papel no projeto.
2. Na conta criada → Chaves → Adicionar chave → JSON. Baixar o arquivo.
3. Play Console → Usuários e permissões → Convidar o e-mail da conta de serviço, com permissão de lançar versões
   em trilhas de teste.
4. `cd apps/mobile && npx eas-cli credentials -p android` → Google Service Account → enviar o JSON. Ele fica guardado
   no EAS, **nunca no repositório** (o repositório é público).
5. Apagar o JSON do computador.

O primeiro envio do app à Play precisa ser à mão, pela Play Console: a API da Play só aceita envios depois que o app
já tem uma versão.
