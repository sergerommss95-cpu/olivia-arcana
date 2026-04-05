"""Builds user context for each Claude API call."""

from src.db.models import User
from src.db.repository import Repository
from src.astrology.charts import compute_chart_from_user_data, NatalChart
from src.astrology.transits import get_current_transits, format_transits_summary, format_transit_overlay, find_active_transits_to_natal


async def build_user_context(user: User, repo: Repository) -> str:
    """Build a context string about the user for Claude."""
    parts = []

    if user.name:
        parts.append(f"User's name: {user.name}")

    if user.has_birth_data:
        parts.append(f"Sun sign: {user.zodiac_sun}")
        if user.zodiac_moon:
            parts.append(f"Moon sign: {user.zodiac_moon}")
        if user.zodiac_rising:
            parts.append(f"Rising sign: {user.zodiac_rising}")
        parts.append(f"Birth location: {user.birth_location}")

    if user.is_vip:
        parts.append("Subscription: VIP (address them with extra warmth)")
    else:
        parts.append("Subscription: Free tier")

    return "\n".join(parts)


async def build_conversation_context(user_id: int, repo: Repository) -> tuple[list[dict], str]:
    """Get recent messages and summaries formatted for Claude.

    Returns (messages_for_claude, summaries_text).
    """
    # Get recent messages
    recent = await repo.get_recent_messages(user_id, limit=10)
    messages = []
    for msg in recent:
        role = "user" if msg.role == "user" else "assistant"
        messages.append({"role": role, "content": msg.content})

    # Get summaries
    summaries = await repo.get_summaries(user_id)
    summary_text = ""
    if summaries:
        summary_text = "\n".join(s.summary_text for s in summaries)

    return messages, summary_text


def build_chart_context(user: User) -> str:
    """Compute and format natal chart + current transits for a user."""
    if not user.has_birth_data:
        return f"User is a {user.zodiac_sun or 'unknown sign'}. No full birth data available."

    try:
        chart = compute_chart_from_user_data(
            name=user.name or "User",
            birth_date=user.birth_date,
            birth_time=user.birth_time,
            lat=user.birth_lat,
            lng=user.birth_lng,
            tz_str=user.timezone or "UTC",
        )

        transits = get_current_transits()
        active = find_active_transits_to_natal(chart, transits)

        parts = [
            chart.to_summary(),
            "",
            format_transits_summary(transits),
            "",
            format_transit_overlay(chart, active),
        ]
        return "\n".join(parts)
    except Exception as e:
        return f"Chart computation error: {e}. Sun sign: {user.zodiac_sun or 'unknown'}."
