from __future__ import annotations

import json
from abc import ABC, abstractmethod
from typing import Any

from livekit.agents import ChatContext
from livekit.agents.llm import LLM


class SlideGenerationError(RuntimeError):
    pass


class SlideGenerator(ABC):
    @abstractmethod
    async def generate_presentation(self, topic: str) -> list[dict[str, Any]]:
        """Generate 5-6 structured slides for a topic."""

    @abstractmethod
    async def generate_slide(self, instruction: str) -> dict[str, Any]:
        """Generate one structured slide."""


class LiveKitSlideGenerator(SlideGenerator):
    accents = ("cyan", "violet", "amber", "emerald", "rose", "indigo")
    layouts = ("standard", "hero")

    def __init__(self, llm: LLM) -> None:
        self.llm = llm

    async def generate_presentation(self, topic: str) -> list[dict[str, Any]]:
        response_text = await self._complete_json(
            system_prompt=(
                "Generate a specific, conversational 5-6 slide presentation with strong visual direction. "
                "Return JSON only with this shape: "
                '{"slides":[{"title":"...","kicker":"...","bullets":["..."],'
                '"speaker_notes":"...","layout":"standard|hero",'
                '"accent":"cyan|violet|amber|emerald|rose|indigo"}]}. '
                "Each slide needs 3-5 concise bullets and speaker notes suitable for spoken delivery. "
                "Vary accents across the deck. Use hero layout for section-opening or summary slides "
                "and standard layout for detail slides. Do not include external images or image URLs."
            ),
            user_prompt=f"Topic: {topic}",
        )
        return self._parse_presentation(response_text)

    async def generate_slide(self, instruction: str) -> dict[str, Any]:
        response_text = await self._complete_json(
            system_prompt=(
                "Generate one visually rich presentation slide. Return JSON only with this shape: "
                '{"title":"...","kicker":"...","bullets":["..."],"speaker_notes":"...",'
                '"layout":"standard|hero","accent":"cyan|violet|amber|emerald|rose|indigo"}. '
                "Use 3-5 concise bullets and conversational speaker notes. Do not include external "
                "images or image URLs."
            ),
            user_prompt=instruction,
        )
        return self._parse_slide(response_text)

    async def _complete_json(self, system_prompt: str, user_prompt: str) -> str:
        chat_ctx = ChatContext.empty()
        chat_ctx.add_message(role="system", content=system_prompt)
        chat_ctx.add_message(role="user", content=user_prompt)

        response = await self.llm.chat(chat_ctx=chat_ctx).collect()
        return response.text

    def _parse_presentation(self, content: str | None) -> list[dict[str, Any]]:
        data = self._parse_json(content)
        slides = data.get("slides") if isinstance(data, dict) else None
        if not isinstance(slides, list):
            raise SlideGenerationError("presentation response must include a slides array")
        if not 5 <= len(slides) <= 6:
            raise SlideGenerationError("presentation response must contain 5 or 6 slides")
        return [self._normalize_slide(slide) for slide in slides]

    def _parse_slide(self, content: str | None) -> dict[str, Any]:
        return self._normalize_slide(self._parse_json(content))

    def _parse_json(self, content: str | None) -> Any:
        if not content:
            raise SlideGenerationError("empty LLM response")
        try:
            return json.loads(content)
        except json.JSONDecodeError as exc:
            raise SlideGenerationError("LLM response was not valid JSON") from exc

    def _normalize_slide(self, slide: Any) -> dict[str, Any]:
        if not isinstance(slide, dict):
            raise SlideGenerationError("slide response must be a JSON object")

        return {
            "title": self._clean_text(slide.get("title", "")),
            "bullets": slide.get("bullets", []),
            "speaker_notes": self._clean_text(slide.get("speaker_notes", "")),
            "kicker": self._clean_text(slide.get("kicker", "")),
            "layout": self._choice(slide.get("layout", "standard"), self.layouts, "standard"),
            "accent": self._choice(slide.get("accent", "cyan"), self.accents, "cyan"),
            "image_url": "",
            "image_alt": "",
        }

    def _clean_text(self, value: Any) -> str:
        return str(value).strip()

    def _choice(self, value: Any, allowed: tuple[str, ...], fallback: str) -> str:
        clean = self._clean_text(value).lower()
        return clean if clean in allowed else fallback
