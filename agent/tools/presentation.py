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
        first_slide = presentation.slides[presentation.current_slide]
        return (
            f"Created {len(presentation.slides)} slides for '{presentation.topic}'. "
            f"The deck is loaded on slide 0: {first_slide.title}. "
            "Next, speak about slide 0. Do not call next_slide or goto_slide for a future slide yet."
        )

    async def create_presentation(self, topic: str, slides: list[dict[str, Any]]) -> str:
        presentation = self.service.create_presentation(topic, slides)
        await self.publisher.publish(PresentationEvent.loaded(presentation.markdown))
        first_slide = presentation.slides[presentation.current_slide]
        return (
            f"Loaded {len(presentation.slides)} slides for '{presentation.topic}'. "
            f"The deck is loaded on slide 0: {first_slide.title}. "
            "Next, speak about slide 0. Do not call next_slide or goto_slide for a future slide yet."
        )

    async def generate_and_add_slide(self, instruction: str, index: int | None = None) -> str:
        slide = await self.generator.generate_slide(instruction)
        return await self.add_slide(
            title=str(slide.get("title", "")),
            bullets=slide.get("bullets", []),
            speaker_notes=str(slide.get("speaker_notes", "")),
            kicker=str(slide.get("kicker", "")),
            layout=str(slide.get("layout", "standard")),
            accent=str(slide.get("accent", "cyan")),
            image_url=str(slide.get("image_url", "")),
            image_alt=str(slide.get("image_alt", "")),
            index=index,
        )

    async def generate_and_replace_slide(self, index: int, instruction: str) -> str:
        slide = await self.generator.generate_slide(instruction)
        return await self.replace_slide(
            index=index,
            title=str(slide.get("title", "")),
            bullets=slide.get("bullets", []),
            speaker_notes=str(slide.get("speaker_notes", "")),
            kicker=str(slide.get("kicker", "")),
            layout=str(slide.get("layout", "standard")),
            accent=str(slide.get("accent", "cyan")),
            image_url=str(slide.get("image_url", "")),
            image_alt=str(slide.get("image_alt", "")),
        )

    async def add_slide(
        self,
        title: str,
        bullets: list[str],
        speaker_notes: str,
        index: int | None = None,
        kicker: str = "",
        layout: str = "standard",
        accent: str = "cyan",
        image_url: str = "",
        image_alt: str = "",
    ) -> str:
        presentation = self.service.add_slide(
            title=title,
            bullets=bullets,
            speaker_notes=speaker_notes,
            index=index,
            kicker=kicker,
            layout=layout,
            accent=accent,
            image_url=image_url,
            image_alt=image_alt,
        )
        await self.publisher.publish(PresentationEvent.updated(presentation.markdown))
        await self.publisher.publish(PresentationEvent.goto_slide(presentation.current_slide))
        added_slide = presentation.slides[presentation.current_slide]
        return (
            f"Added slide {added_slide.index}: {added_slide.title}. "
            f"The deck now has {len(presentation.slides)} slides and is showing the new slide."
        )

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

    async def replace_slide(
        self,
        index: int,
        title: str,
        bullets: list[str],
        speaker_notes: str,
        kicker: str = "",
        layout: str = "standard",
        accent: str = "cyan",
        image_url: str = "",
        image_alt: str = "",
    ) -> str:
        presentation = self.service.replace_slide(
            index=index,
            title=title,
            bullets=bullets,
            speaker_notes=speaker_notes,
            kicker=kicker,
            layout=layout,
            accent=accent,
            image_url=image_url,
            image_alt=image_alt,
        )
        await self.publisher.publish(PresentationEvent.updated(presentation.markdown))
        return f"Replaced slide {index}: {presentation.slides[index].title}."

    async def delete_slide(self, index: int) -> str:
        presentation = self.service.delete_slide(index)
        await self.publisher.publish(PresentationEvent.updated(presentation.markdown))
        return f"Deleted slide {index}. The deck now has {len(presentation.slides)} slides."
