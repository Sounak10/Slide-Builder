from __future__ import annotations

from typing import ClassVar
from uuid import uuid4

from pydantic import BaseModel, Field, field_validator, model_validator


class Slide(BaseModel):
    allowed_accents: ClassVar[set[str]] = {
        "cyan",
        "violet",
        "amber",
        "emerald",
        "rose",
        "indigo",
    }
    allowed_layouts: ClassVar[set[str]] = {"standard", "split", "hero", "image"}

    id: str = Field(default_factory=lambda: str(uuid4()))
    index: int
    title: str
    bullets: list[str] = Field(default_factory=list)
    speaker_notes: str = ""
    kicker: str = ""
    layout: str = "standard"
    accent: str = "cyan"
    image_url: str = ""
    image_alt: str = ""

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str) -> str:
        title = value.strip()
        if not title:
            raise ValueError("slide title cannot be empty")
        return title

    @field_validator("bullets")
    @classmethod
    def clean_bullets(cls, value: list[str]) -> list[str]:
        return [bullet.strip() for bullet in value if bullet.strip()]

    @field_validator("speaker_notes")
    @classmethod
    def clean_notes(cls, value: str) -> str:
        return value.strip()

    @field_validator("kicker", "image_url", "image_alt")
    @classmethod
    def clean_optional_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("layout")
    @classmethod
    def clean_layout(cls, value: str) -> str:
        layout = value.strip().lower()
        return layout if layout in cls.allowed_layouts else "standard"

    @field_validator("accent")
    @classmethod
    def clean_accent(cls, value: str) -> str:
        accent = value.strip().lower()
        return accent if accent in cls.allowed_accents else "cyan"


class Presentation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    topic: str
    current_slide: int = 0
    slides: list[Slide] = Field(default_factory=list)
    markdown: str = ""

    @field_validator("topic")
    @classmethod
    def clean_topic(cls, value: str) -> str:
        topic = value.strip()
        if not topic:
            raise ValueError("presentation topic cannot be empty")
        return topic

    @model_validator(mode="after")
    def validate_current_slide(self) -> Presentation:
        if not self.slides:
            self.current_slide = 0
            return self

        if self.current_slide < 0 or self.current_slide >= len(self.slides):
            raise ValueError("current_slide must refer to an existing slide")

        return self

    def reindex(self) -> Presentation:
        for index, slide in enumerate(self.slides):
            slide.index = index
        return self
