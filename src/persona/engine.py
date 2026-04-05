"""Claude API wrapper — powers all of Olivia's conversations and readings."""

import logging
from pathlib import Path
from typing import Optional

import anthropic

from src.config import BotConfig

logger = logging.getLogger(__name__)

PROMPTS_DIR = Path(__file__).parent / "prompts"


def _load_prompt(name: str) -> str:
    path = PROMPTS_DIR / f"{name}.txt"
    if path.exists():
        return path.read_text()
    logger.warning(f"Prompt file not found: {path}")
    return ""


class PersonaEngine:
    """Claude-powered persona for Olivia Arcana."""

    def __init__(self, config: BotConfig):
        self.config = config
        self.client = anthropic.AsyncAnthropic(api_key=config.anthropic_api_key)
        self.base_personality = _load_prompt("base_personality")
        self._reading_prompts = {}

    def _get_reading_prompt(self, reading_type: str) -> str:
        if reading_type not in self._reading_prompts:
            self._reading_prompts[reading_type] = _load_prompt(f"reading_{reading_type}")
        return self._reading_prompts[reading_type]

    def _build_system_prompt(self, language_instruction: str = "") -> str:
        parts = [self.base_personality]
        if language_instruction:
            parts.append(f"\nLANGUAGE: {language_instruction}")
        else:
            lang = self.config.language_name
            parts.append(
                f"\nLANGUAGE: Respond in {lang}. "
                f"Your name in this language is {self.config.persona_name}."
            )
        return "\n\n".join(parts)

    async def chat(
        self,
        user_message: str,
        conversation_history: list[dict],
        user_context: str = "",
        summaries: str = "",
    ) -> tuple[str, int]:
        """General conversation with Olivia.

        Returns (response_text, tokens_used).
        """
        system = self._build_system_prompt()
        if user_context:
            system += f"\n\nUSER CONTEXT:\n{user_context}"
        if summaries:
            system += f"\n\nPREVIOUS CONVERSATION SUMMARY:\n{summaries}"

        messages = []
        for msg in conversation_history:
            messages.append({
                "role": msg["role"],
                "content": msg["content"],
            })
        messages.append({"role": "user", "content": user_message})

        try:
            response = await self.client.messages.create(
                model=self.config.claude.get("model", "claude-sonnet-4-20250514"),
                max_tokens=self.config.claude.get("max_tokens", 1024),
                temperature=self.config.claude.get("temperature", 0.8),
                system=system,
                messages=messages,
            )
            text = response.content[0].text
            tokens = response.usage.input_tokens + response.usage.output_tokens
            return text, tokens
        except Exception as e:
            logger.error(f"Claude API error: {e}")
            raise

    async def generate_reading(
        self,
        reading_type: str,
        astro_data: str,
        user_context: str = "",
        user_question: str = "",
    ) -> tuple[str, int]:
        """Generate a specific type of reading.

        reading_type: birth_chart, compatibility, tarot, solar_return, etc.
        astro_data: Formatted astrological data from kerykeion.
        """
        reading_prompt = self._get_reading_prompt(reading_type)
        system = self._build_system_prompt()

        user_content = f"{reading_prompt}\n\nASTROLOGICAL DATA:\n{astro_data}"
        if user_context:
            user_content += f"\n\nUSER CONTEXT:\n{user_context}"
        if user_question:
            user_content += f"\n\nUSER'S QUESTION:\n{user_question}"

        try:
            response = await self.client.messages.create(
                model=self.config.claude.get("model", "claude-sonnet-4-20250514"),
                max_tokens=2048,
                temperature=self.config.claude.get("temperature", 0.8),
                system=system,
                messages=[{"role": "user", "content": user_content}],
            )
            text = response.content[0].text
            tokens = response.usage.input_tokens + response.usage.output_tokens
            return text, tokens
        except Exception as e:
            logger.error(f"Claude API error in reading generation: {e}")
            raise

    async def generate_daily_horoscope(
        self,
        sign: str,
        transit_data: str,
    ) -> tuple[str, int]:
        """Generate a daily horoscope for a single zodiac sign."""
        system = self._build_system_prompt()

        user_content = (
            f"Generate a daily horoscope for {sign} based on today's transits.\n\n"
            f"CURRENT TRANSITS:\n{transit_data}\n\n"
            f"Keep it 3-4 sentences. Be specific about which transit affects {sign} "
            f"and what they should focus on today. Warm, personal tone."
        )

        try:
            response = await self.client.messages.create(
                model=self.config.claude.get("model", "claude-sonnet-4-20250514"),
                max_tokens=300,
                temperature=0.9,
                system=system,
                messages=[{"role": "user", "content": user_content}],
            )
            text = response.content[0].text
            tokens = response.usage.input_tokens + response.usage.output_tokens
            return text, tokens
        except Exception as e:
            logger.error(f"Claude API error in horoscope generation: {e}")
            raise

    async def generate_roast(
        self,
        astro_data: str,
        user_name: str,
    ) -> tuple[str, int]:
        """Generate a zodiac roast — brutally honest but loving."""
        system = self._build_system_prompt()
        system += (
            "\n\nSPECIAL MODE: COSMIC ROAST. "
            "You are delivering a brutally honest, funny, sharp reading about the user's "
            "worst cosmic tendencies. Reference their ACTUAL chart data — specific planets "
            "and aspects that make their shadow side worse. Be witty, not mean. Think "
            "comedy roast meets astrology. End with a genuine redemption line — their "
            "chart's greatest strength that makes it all worthwhile."
        )

        user_content = (
            f"Roast {user_name}'s chart. Here's their data:\n\n{astro_data}\n\n"
            f"Be specific, funny, and ultimately loving. 3-4 paragraphs."
        )

        try:
            response = await self.client.messages.create(
                model=self.config.claude.get("model", "claude-sonnet-4-20250514"),
                max_tokens=1024,
                temperature=0.9,
                system=system,
                messages=[{"role": "user", "content": user_content}],
            )
            text = response.content[0].text
            tokens = response.usage.input_tokens + response.usage.output_tokens
            return text, tokens
        except Exception as e:
            logger.error(f"Claude API error in roast generation: {e}")
            raise

    async def summarize_conversation(
        self,
        messages: list[dict],
    ) -> tuple[str, int]:
        """Summarize a batch of conversation messages for long-term memory."""
        system = (
            "Summarize this conversation between a user and Olivia Arcana (an astrologer). "
            "Focus on: key topics discussed, readings given, personal details shared, "
            "emotional themes, and any preferences or concerns expressed. "
            "Keep it concise (2-3 sentences). This summary will be used as context for "
            "future conversations."
        )

        formatted = "\n".join(
            f"{'User' if m['role'] == 'user' else 'Olivia'}: {m['content']}"
            for m in messages
        )

        try:
            response = await self.client.messages.create(
                model="claude-haiku-4-5-20251001",  # Use Haiku for summaries (cheaper)
                max_tokens=200,
                temperature=0.3,
                system=system,
                messages=[{"role": "user", "content": formatted}],
            )
            text = response.content[0].text
            tokens = response.usage.input_tokens + response.usage.output_tokens
            return text, tokens
        except Exception as e:
            logger.error(f"Claude API error in summarization: {e}")
            raise
