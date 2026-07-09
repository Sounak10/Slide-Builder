from __future__ import annotations

from core.events import PresentationEvent
from core.publisher import PresentationPublisher
from presentation.service import PresentationService


class NavigationTools:
    def __init__(self, service: PresentationService, publisher: PresentationPublisher) -> None:
        self.service = service
        self.publisher = publisher

    async def goto_slide(self, index: int) -> str:
        presentation = self.service.goto_slide(index)
        await self.publisher.publish(PresentationEvent.goto_slide(presentation.current_slide))
        slide = presentation.slides[presentation.current_slide]
        return f"Now on slide {slide.index}: {slide.title}."

    async def next_slide(self) -> str:
        presentation = self.service.next_slide()
        await self.publisher.publish(PresentationEvent.goto_slide(presentation.current_slide))
        slide = presentation.slides[presentation.current_slide]
        return f"Now on slide {slide.index}: {slide.title}."

    async def previous_slide(self) -> str:
        presentation = self.service.previous_slide()
        await self.publisher.publish(PresentationEvent.goto_slide(presentation.current_slide))
        slide = presentation.slides[presentation.current_slide]
        return f"Now on slide {slide.index}: {slide.title}."

    def current_slide(self) -> str:
        slide = self.service.current_slide()
        bullets = "\n".join(f"- {bullet}" for bullet in slide.bullets)
        return f"Slide {slide.index}: {slide.title}\n{bullets}\nSpeaker notes: {slide.speaker_notes}"
