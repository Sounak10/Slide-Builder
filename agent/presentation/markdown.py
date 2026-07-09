from __future__ import annotations

from presentation.models import Presentation, Slide


def render_slide(slide: Slide) -> str:
    lines = [f"# {slide.title}"]

    if slide.bullets:
        lines.append("")
        lines.extend(f"- {bullet}" for bullet in slide.bullets)

    if slide.speaker_notes:
        lines.extend(["", "Notes:", slide.speaker_notes])

    return "\n".join(lines)


def render_presentation(presentation: Presentation) -> str:
    return "\n\n---\n\n".join(render_slide(slide) for slide in presentation.slides)
