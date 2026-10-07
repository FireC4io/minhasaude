"""Gera as imagens da marca Gota Vital a partir da geometria do símbolo aprovado.

O símbolo (gota + traço de batimento) vem do artifact de identidade visual de
2026-09-18, desenhado num quadro de 100x100. Não há conversor de SVG no
ambiente, então a geometria é refeita aqui com a PIL: as curvas viram pontos
e tudo é desenhado em 4x e reduzido, para a borda sair suave.

Rodar a partir de apps/mobile:  python scripts/generate-brand-assets.py
Requer Pillow. As cores espelham src/constants/gota-vital-colors.ts.
"""

from collections.abc import Callable, Sequence
from pathlib import Path

from PIL import Image, ImageDraw

Point = tuple[float, float]
Color = str | tuple[int, int, int, int]

AREIA = "#fbf0e4"
AREIA_ESCURA = "#1e1712"
MAMAO = "#ff6f4d"
MAMAO_ESCURO = "#ff8264"
SUPERSAMPLE = 4

# Gota: M50 8 C66 30 82 52 82 68 C82 86 68 96 50 96 C32 96 18 86 18 68 C18 52 34 30 50 8 Z
DROP_CURVES = [
    ((50, 8), (66, 30), (82, 52), (82, 68)),
    ((82, 68), (82, 86), (68, 96), (50, 96)),
    ((50, 96), (32, 96), (18, 86), (18, 68)),
    ((18, 68), (18, 52), (34, 30), (50, 8)),
]
PULSE = [(30, 64), (42, 64), (47, 50), (54, 80), (59, 64), (70, 64)]
PULSE_WIDTH = 5  # o ícone do artifact usa 5; a marca grande, 4,2

OUT = Path(__file__).resolve().parent.parent / "assets" / "images"


def bezier(p0: Point, p1: Point, p2: Point, p3: Point, steps: int = 48) -> list[Point]:
    points = []
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        x = u**3 * p0[0] + 3 * u**2 * t * p1[0] + 3 * u * t**2 * p2[0] + t**3 * p3[0]
        y = u**3 * p0[1] + 3 * u**2 * t * p1[1] + 3 * u * t**2 * p2[1] + t**3 * p3[1]
        points.append((x, y))
    return points


DROP_OUTLINE = [pt for curve in DROP_CURVES for pt in bezier(*curve)]


def stroke_polyline(
    draw: ImageDraw.ImageDraw, points: Sequence[Point], width: float, fill: Color | int
) -> None:
    """Linha com pontas e junções arredondadas, como stroke-linecap/linejoin round."""
    draw.line(points, fill=fill, width=round(width), joint="curve")
    radius = width / 2
    for x, y in points:
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=fill)


def render_mark(
    size: int,
    mark_height: int,
    drop: Color,
    pulse: Color | None,
    background: Color | None = None,
    pulse_cutout: bool = False,
) -> Image.Image:
    """Desenha a gota centralizada num quadro `size`, com a altura `mark_height` (px)."""
    big = size * SUPERSAMPLE
    image = Image.new("RGBA", (big, big), background or (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    scale = mark_height * SUPERSAMPLE / 88  # a gota vai de y=8 a y=96
    offset_x = big / 2 - 50 * scale
    offset_y = big / 2 - 52 * scale  # centro vertical da gota é y=52

    def place(points: Sequence[Point]) -> list[Point]:
        return [(offset_x + x * scale, offset_y + y * scale) for x, y in points]

    draw.polygon(place(DROP_OUTLINE), fill=drop)

    if pulse_cutout:
        # Monocromático do Android: o traço vira transparência dentro da gota.
        mask = Image.new("L", (big, big), 0)
        stroke_polyline(ImageDraw.Draw(mask), place(PULSE), PULSE_WIDTH * scale, 255)
        image.putalpha(Image.composite(Image.new("L", (big, big), 0), image.getchannel("A"), mask))
    else:
        stroke_polyline(draw, place(PULSE), PULSE_WIDTH * scale, pulse)

    return image.resize((size, size), Image.LANCZOS)


# --- Ícones das abas: traço simples num grid de 24, coloridos pela barra ----


def render_tab_icon(
    size: int, painter: Callable[[ImageDraw.ImageDraw, float], None]
) -> Image.Image:
    big = size * SUPERSAMPLE
    image = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    unit = big / 24
    painter(ImageDraw.Draw(image), unit)
    return image.resize((size, size), Image.LANCZOS)


def paint_diary(draw: ImageDraw.ImageDraw, u: float) -> None:
    """Prato com garfo: o diário alimentar."""
    w = round(1.8 * u)
    draw.ellipse((7.5 * u, 4 * u, 23 * u, 19.5 * u), outline="black", width=w)
    draw.ellipse((11.25 * u, 7.75 * u, 19.25 * u, 15.75 * u), outline="black", width=w)
    # Cabo começa abaixo dos dentes; se subir junto, os três viram um bloco.
    stroke_polyline(draw, [(3 * u, 8 * u), (3 * u, 21 * u)], 1.8 * u, "black")
    for x in (1.4, 4.6):
        stroke_polyline(draw, [(x * u, 3 * u), (x * u, 8 * u)], 1.2 * u, "black")
    stroke_polyline(draw, [(1.4 * u, 8 * u), (4.6 * u, 8 * u)], 1.2 * u, "black")


def paint_weight(draw: ImageDraw.ImageDraw, u: float) -> None:
    """Balança de banheiro com mostrador."""
    w = round(1.8 * u)
    draw.rounded_rectangle((3 * u, 3 * u, 21 * u, 21 * u), radius=4 * u, outline="black", width=w)
    draw.arc((7 * u, 6.5 * u, 17 * u, 16.5 * u), start=200, end=340, fill="black", width=w)
    stroke_polyline(draw, [(12 * u, 11.5 * u), (14.2 * u, 8.6 * u)], 1.8 * u, "black")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    outputs = {
        # iOS e fallback: quadro areia, a loja arredonda os cantos.
        "icon.png": render_mark(1024, 600, MAMAO, AREIA, background=AREIA),
        # Android adaptativo: a frente cabe na zona segura (66% do quadro).
        "android-icon-foreground.png": render_mark(512, 250, MAMAO, AREIA),
        "android-icon-background.png": Image.new("RGBA", (512, 512), AREIA),
        "android-icon-monochrome.png": render_mark(432, 211, "white", None, pulse_cutout=True),
        # Splash: o traço tem a cor do fundo de cada tema.
        "splash-icon.png": render_mark(512, 470, MAMAO, AREIA),
        "splash-icon-dark.png": render_mark(512, 470, MAMAO_ESCURO, AREIA_ESCURA),
        "favicon.png": render_mark(48, 44, MAMAO, AREIA),
    }
    for scale, suffix in ((1, ""), (2, "@2x"), (3, "@3x")):
        outputs[f"tabIcons/diary{suffix}.png"] = render_tab_icon(24 * scale, paint_diary)
        outputs[f"tabIcons/weight{suffix}.png"] = render_tab_icon(24 * scale, paint_weight)

    for name, image in outputs.items():
        path = OUT / name
        path.parent.mkdir(parents=True, exist_ok=True)
        image.save(path)
        print(f"{path.relative_to(OUT.parent.parent)}  {image.size[0]}x{image.size[1]}")


if __name__ == "__main__":
    main()
