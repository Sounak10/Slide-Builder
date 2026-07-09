from __future__ import annotations

from html import escape

from presentation.models import Presentation, Slide


ACCENT_GRADIENTS = {
    "cyan": "linear-gradient(135deg,#083344 0%,#0891b2 48%,#67e8f9 100%)",
    "violet": "linear-gradient(135deg,#2e1065 0%,#7c3aed 52%,#c4b5fd 100%)",
    "amber": "linear-gradient(135deg,#451a03 0%,#d97706 52%,#fde68a 100%)",
    "emerald": "linear-gradient(135deg,#052e16 0%,#059669 52%,#a7f3d0 100%)",
    "rose": "linear-gradient(135deg,#4c0519 0%,#e11d48 52%,#fecdd3 100%)",
    "indigo": "linear-gradient(135deg,#1e1b4b 0%,#4f46e5 52%,#bfdbfe 100%)",
}


def render_slide(slide: Slide) -> str:
    accent = slide.accent if slide.accent in ACCENT_GRADIENTS else "cyan"
    layout = slide.layout if slide.layout in Slide.allowed_layouts else "standard"
    effective_layout = "standard" if layout in {"split", "image"} else layout

    lines = [
        f'<!-- .slide: data-background-gradient="{ACCENT_GRADIENTS[accent]}" -->',
        f'<div class="slide-shell slide-accent-{accent} slide-layout-{effective_layout}">',
        '<div class="slide-orb slide-orb-one"></div>',
        '<div class="slide-orb slide-orb-two"></div>',
        '<div class="slide-content">',
    ]

    kicker = slide.kicker or f"Slide {slide.index + 1}"
    lines.append(f'<p class="slide-kicker">{escape(kicker)}</p>')
    lines.append(f"<h1>{escape(slide.title)}</h1>")

    if slide.bullets:
        lines.append('<ul class="slide-bullets">')
        lines.extend(f"<li>{escape(bullet)}</li>" for bullet in slide.bullets)
        lines.append("</ul>")

    lines.extend(["</div>"])

    lines.append("</div>")

    if slide.speaker_notes:
        lines.extend(["", "Notes:", slide.speaker_notes])

    return "\n".join(lines)


def render_presentation(presentation: Presentation) -> str:
    return "\n\n---\n\n".join(render_slide(slide) for slide in presentation.slides)
