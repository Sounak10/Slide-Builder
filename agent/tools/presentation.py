from __future__ import annotations

from typing import Any

from core.events import PresentationEvent
from core.publisher import PresentationPublisher
from presentation.service import PresentationService
from services.llm import SlideGenerator


class PresentationTools:
    def __init__(
        self,
        service: PresentationService,
        publisher: PresentationPublisher,
        generator: SlideGenerator,
    ) -> None:
        self.service = service
        self.publisher = publisher
        self.generator = generator

    async def generate_presentation(self, topic: str) -> str:
        slides = await self.generator.generate_presentation(topic)
        presentation = self.service.create_presentation(topic, slides)
        await self.publisher.publish(PresentationEvent.loaded(presentation.markdown))
        return f"Created {len(presentation.slides)} slides for '{presentation.topic}'. Current slide is 0."

    async def create_presentation(self, topic: str, slides: list[dict[str, Any]]) -> str:
        presentation = self.service.create_presentation(topic, slides)
        await self.publisher.publish(PresentationEvent.loaded(presentation.markdown))
        return f"Loaded {len(presentation.slides)} slides for '{presentation.topic}'. Current slide is 0."

    async def generate_and_add_slide(self, instruction: str, index: int | None = None) -> str:
        slide = await self.generator.generate_slide(instruction)
        return await self.add_slide(
            title=str(slide.get("title", "")),
            bullets=slide.get("bullets", []),
            speaker_notes=str(slide.get("speaker_notes", "")),
            index=index,
        )

    async def generate_and_replace_slide(self, index: int, instruction: str) -> str:
        slide = await self.generator.generate_slide(instruction)
        return await self.replace_slide(
            index=index,
            title=str(slide.get("title", "")),
            bullets=slide.get("bullets", []),
            speaker_notes=str(slide.get("speaker_notes", "")),
        )

    async def add_slide(
        self,
        title: str,
        bullets: list[str],
        speaker_notes: str,
        index: int | None = None,
    ) -> str:
        presentation = self.service.add_slide(title, bullets, speaker_notes, index)
        await self.publisher.publish(PresentationEvent.updated(presentation.markdown))
        return f"Added slide. The deck now has {len(presentation.slides)} slides."

    async def update_slide(
        self,
        index: int,
        title: str | None = None,
        bullets: list[str] | None = None,
        speaker_notes: str | None = None,
    ) -> str:
        presentation = self.service.update_slide(index, title, bullets, speaker_notes)
        await self.publisher.publish(PresentationEvent.updated(presentation.markdown))
        return f"Updated slide {index}: {presentation.slides[index].title}."

    async def replace_slide(self, index: int, title: str, bullets: list[str], speaker_notes: str) -> str:
        presentation = self.service.replace_slide(index, title, bullets, speaker_notes)
        await self.publisher.publish(PresentationEvent.updated(presentation.markdown))
        return f"Replaced slide {index}: {presentation.slides[index].title}."

    async def delete_slide(self, index: int) -> str:
        presentation = self.service.delete_slide(index)
        await self.publisher.publish(PresentationEvent.updated(presentation.markdown))
        return f"Deleted slide {index}. The deck now has {len(presentation.slides)} slides."
