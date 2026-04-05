"""Configuration loader — merges base.yaml with language-specific configs."""

import os
from pathlib import Path
from typing import Any

import yaml
from dotenv import load_dotenv

load_dotenv()

CONFIG_DIR = Path(__file__).parent.parent / "config"


def _deep_merge(base: dict, override: dict) -> dict:
    result = base.copy()
    for key, value in override.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = _deep_merge(result[key], value)
        else:
            result[key] = value
    return result


def load_base_config() -> dict:
    with open(CONFIG_DIR / "base.yaml") as f:
        return yaml.safe_load(f)


def load_language_config(lang: str) -> dict:
    base = load_base_config()
    lang_path = CONFIG_DIR / f"{lang}.yaml"
    if lang_path.exists():
        with open(lang_path) as f:
            lang_config = yaml.safe_load(f)
        return _deep_merge(base, lang_config)
    return base


class BotConfig:
    """Config for a single language bot instance."""

    def __init__(self, lang: str):
        self.lang = lang
        self._config = load_language_config(lang)
        self.bot_token = os.getenv(f"BOT_TOKEN_{lang.upper()}", "")
        self.channel_id = os.getenv(f"CHANNEL_ID_{lang.upper()}", "")
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY", "")
        self.cryptobot_token = os.getenv("CRYPTOBOT_API_TOKEN", "")
        self.heygen_api_key = os.getenv("HEYGEN_API_KEY", "")
        self.elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY", "")
        self.database_dir = Path(os.getenv("DATABASE_DIR", "./data"))

    @property
    def db_path(self) -> Path:
        return self.database_dir / f"{self.lang}.db"

    @property
    def persona_name(self) -> str:
        return self._config.get("persona_name", "Olivia Arcana")

    @property
    def language_name(self) -> str:
        return self._config.get("language_name", "English")

    @property
    def pricing(self) -> dict:
        return self._config.get("pricing", {})

    @property
    def pricing_crypto(self) -> dict:
        return self._config.get("pricing_crypto", {})

    @property
    def free_tier(self) -> dict:
        return self._config.get("free_tier", {})

    @property
    def vip(self) -> dict:
        return self._config.get("vip", {})

    @property
    def claude(self) -> dict:
        return self._config.get("claude", {})

    @property
    def conversation(self) -> dict:
        return self._config.get("conversation", {})

    @property
    def scheduler(self) -> dict:
        return self._config.get("scheduler", {})

    @property
    def channel_vip_teaser(self) -> str:
        return self._config.get("channel_vip_teaser", "")

    def get_price_stars(self, product: str) -> int:
        return self.pricing.get(f"{product}_stars", 0)

    def get_price_usd(self, product: str) -> float:
        return self.pricing_crypto.get(f"{product}_usd", 0.0)
