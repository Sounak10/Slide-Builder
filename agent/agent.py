from __future__ import annotations

import contextlib
from pathlib import Path

from dotenv import load_dotenv
from livekit import agents
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    AudioConfig,
    BackgroundAudioPlayer,
    BuiltinAudioClip,
    JobContext,
    function_tool,
    inference,
)
from livekit.plugins import silero

from core.config import load_settings
from core.event_log import EventLog
from core.publisher import PresentationPublisher
from presentation.service import PresentationService
from services.llm import LiveKitSlideGenerator
from tools.context import ContextTools
from tools.navigation import NavigationTools
from tools.presentation import PresentationTools

load_dotenv()

PROMPT_PATH = Path(__file__).parent / "prompts" / "presentation_agent.md"
server = AgentServer()


class PresentationAgent(Agent):
    def __init__(
        self,
        presentation_tools: PresentationTools,
        navigation_tools: NavigationTools,
        context_tools: ContextTools,
        background_audio: BackgroundAudioPlayer,
    ) -> None:
        super().__init__(instructions=PROMPT_PATH.read_text(encoding="utf-8"))
        self.presentation_tools = presentation_tools
        self.navigation_tools = navigation_tools
        self.context_tools = context_tools
        self.background_audio = background_audio

    @function_tool()
    async def generate_presentation(self, topic: str) -> str:
        """Generate a new AI-created 5-6 slide presentation for a topic. After this returns, speak about slide 0 before any navigation."""
        return await self._with_generation_audio(
            self.presentation_tools.generate_presentation(topic)
        )

    @function_tool()
    async def add_slide(
        self,
        title: str,
        bullets: list[str],
        speaker_notes: str,
        index: int | None = None,
    ) -> str:
        """Add an AI-generated slide to the current presentation."""
        return await self.presentation_tools.add_slide(title, bullets, speaker_notes, index)

    @function_tool()
    async def generate_and_add_slide(self, instruction: str, index: int | None = None) -> str:
        """Generate one new slide from an instruction and add it to the deck."""
        return await self._with_generation_audio(
            self.presentation_tools.generate_and_add_slide(instruction, index)
        )

    @function_tool()
    async def update_slide(
        self,
        index: int,
        title: str | None = None,
        bullets: list[str] | None = None,
        speaker_notes: str | None = None,
    ) -> str:
        """Update fields on a slide by zero-based index."""
        return await self.presentation_tools.update_slide(index, title, bullets, speaker_notes)

    @function_tool()
    async def replace_slide(self, index: int, title: str, bullets: list[str], speaker_notes: str) -> str:
        """Replace one slide with newly generated content."""
        return await self.presentation_tools.replace_slide(index, title, bullets, speaker_notes)

    @function_tool()
    async def generate_and_replace_slide(self, index: int, instruction: str) -> str:
        """Generate replacement content for one slide."""
        return await self._with_generation_audio(
            self.presentation_tools.generate_and_replace_slide(index, instruction)
        )

    @function_tool()
    async def delete_slide(self, index: int) -> str:
        """Delete a slide by zero-based index."""
        return await self.presentation_tools.delete_slide(index)

    @function_tool()
    async def goto_slide(self, index: int) -> str:
        """Navigate to a slide by zero-based index immediately before discussing that slide. Do not use for future slides in the same spoken turn."""
        return await self.navigation_tools.goto_slide(index)

    @function_tool()
    async def next_slide(self) -> str:
        """Navigate to the next slide only when the user asks to continue or at the start of a later turn. Never call while still speaking about the current slide."""
        return await self.navigation_tools.next_slide()

    @function_tool()
    async def previous_slide(self) -> str:
        """Navigate to the previous slide immediately before discussing that slide."""
        return await self.navigation_tools.previous_slide()

    @function_tool()
    async def current_slide(self) -> str:
        """Get the current slide content."""
        return self.navigation_tools.current_slide()

    @function_tool()
    async def get_presentation_context(self) -> str:
        """Get compact context for all slides to answer questions or choose navigation."""
        return self.context_tools.presentation_context()

    @function_tool()
    async def get_presentation_outline(self) -> str:
        """Get slide indexes and titles."""
        return self.context_tools.presentation_outline()

    @function_tool()
    async def get_slide_context(self, index: int) -> str:
        """Get compact context for one slide by zero-based index."""
        return self.context_tools.slide_context(index)

    async def _with_generation_audio(self, operation):
        handle = self.background_audio.play(
            AudioConfig(
                BuiltinAudioClip.HOLD_MUSIC,
                volume=0.18,
                fade_in=0.5,
                fade_out=0.8,
            ),
            loop=True,
        )
        try:
            return await operation
        finally:
            handle.stop()
            with contextlib.suppress(Exception):
                await handle.wait_for_playout()


@server.rtc_session(agent_name="presentation-agent")
async def entrypoint(ctx: JobContext) -> None:
    settings = load_settings()

    presentation_service = PresentationService()
    llm_model = inference.LLM(model=settings.livekit_llm_model)
    background_audio = BackgroundAudioPlayer(stream_timeout_ms=1000)
    publisher = PresentationPublisher(
        room=ctx.room,
        topic=settings.presentation_topic,
        event_log=EventLog(settings.event_log_path),
    )

    agent = PresentationAgent(
        presentation_tools=PresentationTools(
            presentation_service,
            publisher,
            LiveKitSlideGenerator(llm_model),
        ),
        navigation_tools=NavigationTools(presentation_service, publisher),
        context_tools=ContextTools(presentation_service),
        background_audio=background_audio,
    )

    session = AgentSession(
        stt=inference.STT(model=settings.livekit_stt_model, language="multi"),
        llm=llm_model,
        tts=inference.TTS(model=settings.livekit_tts_model, voice=settings.livekit_tts_voice),
        vad=silero.VAD.load(),
        turn_handling={"interruption": {"mode": "vad"}},
    )

    await session.start(room=ctx.room, agent=agent)
    await background_audio.start(room=ctx.room, agent_session=session)


if __name__ == "__main__":
    agents.cli.run_app(server)
