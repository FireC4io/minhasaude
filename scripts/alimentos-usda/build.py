"""Monta os básicos do USDA para o seed da API.

Uso: python build.py <pasta FNDDS> <pasta SR Legacy> <saída alimentos.csv> <saída medidas.csv>
As pastas são os CSV descompactados de https://fdc.nal.usda.gov/download-datasets (domínio público, CC0).
Regras em docs/dados/alimentos-usda.md.
"""
import csv, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lista import ALIMENTOS, DESCARTAR, XICARA_SIM

FNDDS, SR, OUT_FOODS, OUT_PORTIONS = sys.argv[1:5]

# Nossos campos -> (número do nutriente no FNDDS, id do nutriente no SR Legacy).
NUTRIENTES = {
    "kcal": ("208", "1008"),
    "protein_g": ("203", "1003"),
    "fat_g": ("204", "1004"),
    "carb_g": ("205", "1005"),
    "fiber_g": ("291", "1079"),
    "sodium_mg": ("307", "1093"),
    "potassium_mg": ("306", "1092"),
    "calcium_mg": ("301", "1087"),
    "iron_mg": ("303", "1089"),
    "magnesium_mg": ("304", "1090"),
    "zinc_mg": ("309", "1095"),
    "vitamin_c_mg": ("401", "1162"),
    "vitamin_a_rae_mcg": ("320", "1106"),
}
OBRIGATORIOS = ("kcal", "protein_g", "fat_g", "carb_g")

# Medida do USDA -> tipo do app (PORTION_KINDS no shared). Só a primeira de cada tipo.
MEDIDAS = [
    (r"^1 cup\b(?!.*(dry|crumbled|mashed))", "cup"),
    (r"^1 slice\b", "slice"),
    (r"^1 tablespoon\b", "tablespoon"),
    (r"^1 teaspoon\b", "teaspoon"),
    (r"^1 piece\b", "piece"),
    (r"^1 can\b", "can"),
    (r"^1 (packet|package|bag|individual bag|small single serving bag|juice box)\b", "package"),
    (r"^1 glass\b", "glass"),
    (r"^1 (medium|large|small)? ?(sandwich|hot dog|burger|hamburger bun|hamburger|cheeseburger|cracker|patty|nugget|bar|roll|bun|tortilla|pancake|waffle|croissant|doughnut|egg|sushi roll|frank|link|bottle|container)\b", "unit"),
    (r"^1 (medium|regular)$", "unit"),
]


def ler(pasta, nome):
    return csv.DictReader(open(os.path.join(pasta, nome), encoding="utf-8"))


def carregar(pasta, ids, base):
    ids = {str(i) for i in ids}
    descr = {r["fdc_id"]: r["description"] for r in ler(pasta, "food.csv") if r["fdc_id"] in ids}
    chave = 0 if base == "fndds" else 1
    # No FNDDS o food_nutrient traz o número do nutriente; no SR Legacy, o id.
    alvo = {par[chave]: campo for campo, par in NUTRIENTES.items()}
    valores = {i: {} for i in ids}
    for r in ler(pasta, "food_nutrient.csv"):
        if r["fdc_id"] in ids and r["nutrient_id"] in alvo:
            valores[r["fdc_id"]][alvo[r["nutrient_id"]]] = float(r["amount"])
    medidas = {i: [] for i in ids}
    for r in ler(pasta, "food_portion.csv"):
        if r["fdc_id"] not in ids:
            continue
        texto = r["portion_description"] or " ".join(x for x in (r["amount"], r["modifier"]) if x)
        medidas[r["fdc_id"]].append((texto.strip(), float(r["gram_weight"] or 0)))
    return descr, valores, medidas


def main():
    por_base = {"fndds": [], "sr": []}
    for _, base, fdc in ALIMENTOS:
        por_base[base].append(fdc)
    dados = {"fndds": carregar(FNDDS, por_base["fndds"], "fndds"), "sr": carregar(SR, por_base["sr"], "sr")}

    nomes = [n for n, _, _ in ALIMENTOS]
    assert len(set(nomes)) == len(nomes), "nome repetido na lista"

    with open(OUT_FOODS, "w", newline="", encoding="utf-8") as f_out, open(
        OUT_PORTIONS, "w", newline="", encoding="utf-8"
    ) as p_out:
        foods = csv.writer(f_out)
        portions = csv.writer(p_out)
        foods.writerow(["fdc_id", "dataset", "name", *NUTRIENTES.keys(), "usda_description"])
        portions.writerow(["fdc_id", "kind", "grams", "usda_description"])
        n_portions = 0
        for nome, base, fdc in ALIMENTOS:
            descr, valores, medidas = dados[base]
            i = str(fdc)
            if i not in descr:
                sys.exit(f"fdc_id {fdc} ({nome}) não está na base {base}")
            v = valores[i]
            faltando = [c for c in OBRIGATORIOS if c not in v]
            if faltando:
                sys.exit(f"{nome}: sem {faltando} na fonte")
            foods.writerow([fdc, base, nome, *(("" if c not in v else round(v[c], 2)) for c in NUTRIENTES), descr[i]])
            usados = set()
            # A medida simples ("1 slice") antes das variações ("1 slice, crust not eaten", "extra-large").
            simples_primeiro = sorted(
                medidas[i],
                key=lambda m: ("," in m[0], "large" in m[0], "small" in m[0], "medium" not in m[0] and "regular" not in m[0]),
            )
            for texto, gramas in simples_primeiro:
                comparar = re.sub(r"^1 (medium or regular|medium|regular) ", "1 ", texto)
                if gramas <= 0:
                    continue
                for padrao, kind in MEDIDAS:
                    if kind == "cup" and not nome.startswith(XICARA_SIM):
                        continue
                    if (fdc, kind) in DESCARTAR:
                        continue
                    if kind not in usados and re.search(padrao, comparar, re.I):
                        usados.add(kind)
                        portions.writerow([fdc, kind, round(gramas, 1), texto])
                        n_portions += 1
                        break
    print(f"{len(ALIMENTOS)} alimentos, {n_portions} medidas")


main()
