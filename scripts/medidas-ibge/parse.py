"""Extrai a tabela do PDF "Tabela de Medidas Referidas para os Alimentos Consumidos
no Brasil" (IBGE, POF 2008-2009, liv50000.pdf). As páginas da tabela são giradas:
cada linha da tabela é uma coluna de texto, e a posição vertical diz o campo.

Uso: python parse.py liv50000.pdf medidas-ibge.csv   (precisa de PyMuPDF)
"""
import sys, fitz, csv, re
doc = fitz.open(sys.argv[1])
out = csv.writer(open(sys.argv[2], "w", newline="", encoding="utf-8"))
out.writerow(["food", "prep", "measure", "std", "grams", "source", "page"])
def col(y1):
    if y1 > 700: return "food"
    if y1 > 500: return "prep"
    if y1 > 420: return "measure"
    if y1 > 330: return "std"
    if y1 > 295: return "grams"
    return "source"
n = 0
for pno in range(len(doc)):
    lines = []
    for b in doc[pno].get_text("dict")["blocks"]:
        for l in b.get("lines", []):
            if abs(l["dir"][1] + 1) > 0.01: continue
            t = "".join(s["text"] for s in l["spans"]).strip()
            if not t: continue
            x0, y0, x1, y1 = l["bbox"]
            if x0 < 110: continue  # cabeçalho
            lines.append((x0, col(y1), t))
    bases = sorted({round(x0) for x0, c, t in lines if c == "food" and re.match(r"^\d{7} ", t)})
    if not bases: continue
    rows = {b: {} for b in bases}
    for x0, c, t in lines:
        cand = [b for b in bases if b <= x0 + 1.5]
        if not cand: continue
        r = rows[cand[-1]]
        r[c] = (r.get(c, "") + " " + t).strip()
    for b in bases:
        r = rows[b]
        out.writerow([r.get(k, "") for k in ["food", "prep", "measure", "std", "grams", "source"]] + [pno])
        n += 1
print(n)
