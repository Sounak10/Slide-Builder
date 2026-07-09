from __future__ import annotations

from typing import Any

from presentation.markdown import render_presentation
from presentation.models import Presentation, Slide


class PresentationError(RuntimeError):
    pass


class PresentationService:
    def __init__(self) -> None:
        self._presentation: Presentation | None = None

    @property
    def presentation(self) -> Presentation:
        if self._presentation is None:
            raise PresentationError("no presentation has been created yet")
        return self._presentation

    def create_presentation(self, topic: str, slides: list[dict[str, Any]]) -> Presentation:
        if not 5 <= len(slides) <= 6:
            raise PresentationError("presentations must contain 5 or 6 slides")

        self._presentation = Presentation(
            topic=topic,
            current_slide=0,
            slides=[self._slide_from_input(index, slide) for index, slide in enumerate(slides)],
        ).reindex()
        return self._refresh()

    def add_slide(
        self,
        title: str,
        bullets: list[str],
        speaker_notes: str,
        index: int | None = None,
    ) -> Presentation:
        insert_at = len(self.presentation.slides) if index is None else self._insert_index(index)
        self.presentation.slides.insert(
            insert_at,
            Slide(index=insert_at, title=title, bullets=bullets, speaker_notes=speaker_notes),
        )
        self.presentation.reindex()
        return self._refresh()

    def update_slide(
        self,
        index: int,
        title: str | None = None,
        bullets: list[str] | None = None,
        speaker_notes: str | None = None,
    ) -> Presentation:
        slide = self._slide(index)
        if title is not None:
            slide.title = self._required_text(title, "slide title")
        if bullets is not None:
            slide.bullets = [bullet.strip() for bullet in bullets if bullet.strip()]
        if speaker_notes is not None:
            slide.speaker_notes = speaker_notes.strip()
        return self._refresh()

    def replace_slide(
        self,
        index: int,
        title: str,
        bullets: list[str],
        speaker_notes: str,
    ) -> Presentation:
        self._slide(index)
        self.presentation.slides[index] = Slide(
            index=index,
            title=title,
            bullets=bullets,
            speaker_notes=speaker_notes,
        )
        return self._refresh()

    def delete_slide(self, index: int) -> Presentation:
        if len(self.presentation.slides) == 1:
            raise PresentationError("cannot delete the only slide")
        self._slide(index)
        del self.presentation.slides[index]
        self.presentation.current_slide = min(self.presentation.current_slide, len(self.presentation.slides) - 1)
        self.presentation.reindex()
        return self._refresh()

    def goto_slide(self, index: int) -> Presentation:
        self._slide(index)
        self.presentation.current_slide = index
        return self._refresh()

    def next_slide(self) -> Presentation:
        return self.goto_slide(min(self.presentation.current_slide + 1, len(self.presentation.slides) - 1))

    def previous_slide(self) -> Presentation:
        return self.goto_slide(max(self.presentation.current_slide - 1, 0))

    def current_slide(self) -> Slide:
        return self._slide(self.presentation.current_slide)

    def _refresh(self) -> Presentation:
        self.presentation.markdown = render_presentation(self.presentation)
        return self.presentation

    def _slide(self, index: int) -> Slide:
        if index < 0 or index >= len(self.presentation.slides):
            raise PresentationError(f"slide index {index} is out of range")
        return self.presentation.slides[index]

    def _insert_index(self, index: int) -> int:
        return max(0, min(index, len(self.presentation.slides)))

    def _slide_from_input(self, index: int, slide: dict[str, Any]) -> Slide:
        return Slide(
            index=index,
            title=self._required_text(str(slide.get("title", "")), "slide title"),
            bullets=self._string_list(slide.get("bullets", [])),
            speaker_notes=str(slide.get("speaker_notes", "")).strip(),
        )

    def _string_list(self, value: Any) -> list[str]:
        if not isinstance(value, list):
            raise PresentationError("slide bullets must be a list of strings")
        return [str(item).strip() for item in value if str(item).strip()]

    def _required_text(self, value: str, label: str) -> str:
        clean = value.strip()
        if not clean:
            raise PresentationError(f"{label} cannot be empty")
        return clean
