"""Monta a página do artifact "Mapa Gota Vital" (https://claude.ai/artifact/VPAifv2Ax3yJVF4JrfBnrN).

Uso: python docs/arquitetura/mapa/build.py <raiz do repo> <data> <nº de arquivos> <nº de imports> <saída.html>
Os números vêm da saída de `pnpm deps:check` (somar os três pacotes). Rodar `pnpm deps:graph` antes.
Publicar a saída pelo Artifact tool com `url` do artifact acima. A descrição de cada pasta fica nos dicionários
abaixo: pasta nova precisa entrar aqui.
"""
import html
import pathlib
import re
import sys

ROOT = pathlib.Path(sys.argv[1])
HERE = pathlib.Path(__file__).parent

API = {
    "auth": "login, registro, refresh rotacionado, guard JWT",
    "body-measurements": "peso e medidas (fonte nunca misturada)",
    "bootstrap": "configureApp: helmet, throttler, pipes",
    "common": "toDto e utilitários de resposta",
    "config": "variáveis de ambiente validadas, logs",
    "consents": "consentimento LGPD e @RequireConsent",
    "database": "módulo TypeORM, migrations, seed TACO",
    "diary": "diário alimentar com snapshot de macros",
    "foods": "catálogo, busca por relevância, Open Food Facts",
    "goals": "metas (TMB, TDEE, macros), histórico",
    "health": "/health",
    "users": "/me, export LGPD, exclusão, relatório",
}
MOBILE = {
    "accessibility": "números falados, anúncios",
    "account": "exclusão de conta",
    "auth": "sessão, login, token",
    "dev-catalog": "catálogo de componentes (dev)",
    "diary": "diário e anotar alimento",
    "exams": "exames (prévia, via repository)",
    "forms": "parseDecimal e campos",
    "navigation": "navegação",
    "network": "aviso de internet lenta",
    "nutrition": "micronutrientes e macros",
    "onboarding": "consentimento, perfil, meta",
    "preferences": "tema, cópia no aparelho",
    "preview": "PREVIEW_FEATURES",
    "profile": "perfil e ajustes",
    "progress": "aba Progresso",
    "report": "relatório de progresso em PDF",
    "today": "tela Hoje com semana",
    "voice": "anotar por voz (prévia)",
    "water": "água (prévia)",
    "weight": "peso e gráfico",
}
SHARED = {
    "calculators": "TMB, TDEE, macros, índices de exame",
    "limits": "INPUT_LIMITS",
    "nutrition": "regras de nutrição",
    "onboarding": "enums e schemas Zod",
}


def counts(path: pathlib.Path):
    files = [p for p in path.rglob("*") if p.suffix in (".ts", ".tsx")]
    tests = [p for p in files if ".spec." in p.name or ".test." in p.name]
    return len(files) - len(tests), len(tests)


def table(title, color, base, items):
    rows = []
    for name, desc in items.items():
        src, tests = counts(ROOT / base / name)
        rows.append(
            f"<tr><td><code>{name}</code><br><span class=\"muted\">{html.escape(desc)}</span></td>"
            f"<td class=\"n\">{src}</td><td class=\"n\">{tests}</td></tr>"
        )
    return (
        f'<div class="col"><h3><span class="dot" style="background:var(--{color})"></span>{title}</h3>'
        f'<div style="overflow-x:auto"><table><thead><tr><th>Pasta</th><th style="text-align:right">Código</th>'
        f'<th style="text-align:right">Testes</th></tr></thead><tbody>{"".join(rows)}</tbody></table></div></div>'
    )


md = (ROOT / "docs/arquitetura/dependencias.md").read_text(encoding="utf-8")
sections = re.findall(r"^## (.+?)\n\n```mermaid\n(.*?)\n```", md, re.S | re.M)
graphs = []
for i, (title, body) in enumerate(sections):
    title_html = re.sub(r"`([^`]+)`", r"<code>\1</code>", html.escape(title))
    open_attr = " open" if i == 0 else ""
    graphs.append(
        f'<details class="graph"{open_attr}><summary>{title_html}</summary>'
        f'<div class="graph-body"><pre class="mermaid">{html.escape(body)}</pre></div></details>'
    )

catalog = "".join(
    [
        table("API", "couve", "apps/api/src", API),
        table("App", "mamao", "apps/mobile/src/features", MOBILE),
        table("Shared", "maracuja", "packages/shared/src", SHARED),
    ]
)

out = (HERE / "template.html").read_text(encoding="utf-8")
for key, value in {
    "__DATA__": sys.argv[2],
    "__CATALOG__": catalog,
    "__GRAPHS__": "\n".join(graphs),
    "__API_MOD__": str(len(API)),
    "__MOBILE_MOD__": str(len(MOBILE)),
    "__SHARED_MOD__": str(len(SHARED)),
    "__MODULOS__": sys.argv[3],
    "__DEPS__": sys.argv[4],
}.items():
    out = out.replace(key, value)
pathlib.Path(sys.argv[5]).write_text(out, encoding="utf-8")
print("ok", len(out), "bytes,", len(graphs), "grafos")
