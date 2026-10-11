# Segurança do Gota Vital

O Gota Vital guarda dados de saúde de pessoas reais. Se você encontrou uma falha de segurança, obrigado por avisar.

## Como reportar

- **De preferência:** pelo [reporte privado de vulnerabilidades do GitHub](https://github.com/FireC4io/minhasaude/security/advisories/new).
  Só o responsável vê.
- **Ou por e-mail:** euacaio14@gmail.com, com "Segurança" no assunto.

Por favor, **não abra issue pública** e não publique detalhes antes da correção.

Ajuda muito mandar: o que você encontrou, como reproduzir, e qual o impacto que você imagina.

## O que esperar

- Resposta em até **3 dias úteis**.
- Se a falha for confirmada, correção priorizada e aviso quando ela estiver no ar.
- Crédito no registro da correção, se você quiser.

## Escopo

- API (`minhasaude-api.onrender.com`) e o código deste repositório.
- App Android Gota Vital.

**Fora do escopo:** testes que derrubem o serviço (DoS), engenharia social, spam, e acesso a dados de outras pessoas
além do mínimo necessário para provar a falha. Use contas suas para testar.

## Testes de boa-fé

Quem pesquisar de boa-fé, dentro deste escopo, sem acessar ou guardar dados de outras pessoas e avisando primeiro por
aqui, não será alvo de nenhuma medida da nossa parte.

Detalhes de como o app se protege: [`docs/security/`](docs/security/).
