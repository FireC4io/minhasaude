"""Monta apps/api/src/database/seeds/data/taco-portions.csv.

Uso: python build.py <medidas-ibge.csv> <taco.csv> <saida.csv>
O primeiro arquivo sai do parse.py. Regras e fonte: docs/dados/medidas-caseiras.md.
"""
import csv, os, sys, unicodedata
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mapping import M
MEDIDAS, TACO, SAIDA = sys.argv[1:4]
def norm(s): return unicodedata.normalize("NFKD", s.lower()).encode("ascii", "ignore").decode()
KINDS = {  # código IBGE -> (kind, palavras que a fonte precisa citar)
    103: ("unit", ["unidade"]), 25: ("unit", ["coxa"]), 99: ("unit", ["sobrecoxa"]),
    32: ("slice", ["fatia"]), 81: ("piece", ["pedaco"]),
    16: ("tablespoon", ["colher de sopa"]), 15: ("dessert_spoon", ["colher de sobremesa"]),
    14: ("teaspoon", ["colher de cha"]), 12: ("serving_spoon", ["colher de arroz", "colher de servir"]),
    17: ("ladle", ["concha"]), 28: ("skimmer", ["escumadeira"]),
    106: ("cup", ["xicara de cha", "xicara"]), 105: ("coffee_cup", ["xicara de cafe", "cafezinho"]),
    18: ("glass", ["copo americano", "copo duplo"]), 21: ("large_glass", ["copo grande", "copo"]),
    5: ("steak", ["bife"]), 33: ("fillet", ["file"]), 72: ("can", ["lata"]),
    86: ("knife_tip", ["ponta de faca"]), 34: ("leaf", ["folha"]), 88: ("handful", ["punhado"]),
    80: ("package", ["pacote"]),
}
CONTAINERS = {"glass", "large_glass", "cup", "coffee_cup", "can"}
# Bebidas: só nelas o copo/lata genérico da fonte (ml) vale como grama.
LIQUIDS = set(range(209, 218, 2)) | {446, 448, 449, 450, 451, 452, 454, 455, 457, 458, 460} | set(range(470, 484)) - {472}
# Adaptações da fonte que não servem para o alimento da TACO.
DROP = {(8, "handful"), (9, "handful"), (10, "handful"), (13, "handful"), (90, "handful"), (29, "piece"), (43, "piece"),
        (392, "unit"), (393, "unit"), (403, "unit"), (404, "unit"), (358, "unit"), (484, "slice"), (490, "slice"),
        (490, "skimmer"), (501, "slice"), (196, "slice"), (93, "unit"), (94, "unit"), (93, "piece"), (495, "unit"),
        (496, "unit"), (497, "unit"), (498, "unit"), (201, "unit"), (175, "unit"), (71, "skimmer"), (111, "skimmer"),
        (113, "skimmer"), (126, "skimmer"), (43, "ladle"), (539, "ladle"), (553, "ladle"), (533, "tablespoon"), (543, "serving_spoon"), (546, "serving_spoon")}
taco = {r[0].strip(): r[1].strip() for r in csv.reader(open(TACO, encoding="utf-8"))
        if len(r) > 1 and r[0].strip().isdigit() and r[1].strip()}
rows = list(csv.DictReader(open(MEDIDAS, encoding="utf-8")))
idx = {}
for r in rows:
    code = int(r["food"].split()[0]); prep = int(r["prep"].split()[0]); meas = int(r["measure"].split()[0])
    idx.setdefault((code, prep), []).append((meas, r))
out = []; rejected = []
for tid, (food, prep, only) in sorted(M.items()):
    cands = idx.get((food, prep))
    if not cands:
        print("SEM ITEM IBGE", tid, taco[str(tid)], food, prep); continue
    seen = set()
    for meas, r in cands:
        if only and meas not in only: continue
        if meas not in KINDS: continue
        kind, kws = KINDS[meas]
        src = norm(r["source"])
        if "dilui" in src or "para o preparo" in src:
            rejected.append((tid, kind, r["source"])); continue
        generic = " - " not in r["source"]
        if kind in CONTAINERS and generic and tid not in LIQUIDS:
            rejected.append((tid, kind, r["source"])); continue
        if (tid, kind) in DROP:
            rejected.append((tid, kind, r["source"])); continue
        if not any(k in src for k in kws):
            rejected.append((tid, kind, r["source"])); continue
        if kind in seen: continue
        g = float(r["grams"].replace(",", "."))
        if g <= 0: continue
        seen.add(kind)
        out.append([tid, taco[str(tid)], kind, g, food, prep, meas, r["source"]])
w = csv.writer(open(SAIDA, "w", newline="", encoding="utf-8"))
w.writerow(["taco_id", "taco_name", "kind", "grams", "ibge_food", "ibge_prep", "ibge_measure", "ibge_source"])
w.writerows(out)
print(len(out), "porções para", len({o[0] for o in out}), "alimentos;", len(rejected), "recusadas (fonte é adaptação)")
