from __future__ import annotations

from presentation.models import Presentation, Slide


def slide_context(slide: Slide) -> str:
    bullets = "\n".join(f"- {bullet}" for bullet in slide.bullets) or "- No bullets"
    notes = slide.speaker_notes or "No speaker notes"
    return f"Slide {slide.index}: {slide.title}\nBullets:\n{bullets}\nSpeaker notes: {notes}"


def presentation_context(presentation: Presentation) -> str:
    slides = "\n\n".join(slide_context(slide) for slide in presentation.slides)
    return (
        f"Topic: {presentation.topic}\n"
        f"Current slide: {presentation.current_slide}\n"
        f"Slide count: {len(presentation.slides)}\n\n"
        f"{slides}"
    )


def presentation_outline(presentation: Presentation) -> str:
    return "\n".join(f"{slide.index}. {slide.title}" for slide in presentation.slides)
