from __future__ import annotations

from presentation.context import presentation_context, presentation_outline, slide_context
from presentation.service import PresentationService


class ContextTools:
    def __init__(self, service: PresentationService) -> None:
        self.service = service

    def presentation_context(self) -> str:
        return presentation_context(self.service.presentation)

    def presentation_outline(self) -> str:
        return presentation_outline(self.service.presentation)

    def slide_context(self, index: int) -> str:
        presentation = self.service.presentation
        if index < 0 or index >= len(presentation.slides):
            raise ValueError(f"slide index {index} is out of range")
        return slide_context(presentation.slides[index])
