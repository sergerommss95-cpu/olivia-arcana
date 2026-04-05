"""Handler for free-text chat with Olivia."""

import logging

from aiogram import Router
from aiogram.types import Message

from src.config import BotConfig
from src.db.repository import Repository
from src.db.models import User
from src.persona.engine import PersonaEngine
from src.persona.context import build_user_context, build_conversation_context, build_chart_context

logger = logging.getLogger(__name__)
router = Router()


@router.message()
async def handle_chat(message: Message, db_user: User, repo: Repository, config: BotConfig):
    """Handle free-text conversation with Olivia."""
    if not message.text:
        return

    # Store user's message
    await repo.add_message(db_user.user_id, "user", message.text)

    # Check if conversation needs summarization
    msg_count = await repo.count_messages(db_user.user_id)
    max_messages = config.conversation.get("max_messages_in_db", 50)
    summarize_batch = config.conversation.get("summarize_batch_size", 40)

    if msg_count > max_messages:
        await _summarize_old_messages(db_user.user_id, repo, config, summarize_batch)

    # Build context
    user_context = await build_user_context(db_user, repo)
    conversation_history, summaries = await build_conversation_context(db_user.user_id, repo)

    # Add chart context if available
    if db_user.has_birth_data:
        chart_ctx = build_chart_context(db_user)
        user_context += f"\n\nCHART DATA:\n{chart_ctx}"

    # Generate response
    persona = PersonaEngine(config)
    try:
        response_text, tokens = await persona.chat(
            user_message=message.text,
            conversation_history=conversation_history[:-1],  # Exclude the message we just added
            user_context=user_context,
            summaries=summaries,
        )

        # Store Olivia's response
        await repo.add_message(db_user.user_id, "olivia", response_text, tokens)

        await message.answer(response_text)

    except Exception as e:
        logger.error(f"Chat response failed for user {db_user.user_id}: {e}")
        await message.answer(
            "The stars are momentarily obscured... I'll be back with you shortly. 🌙"
        )


async def _summarize_old_messages(user_id: int, repo: Repository,
                                   config: BotConfig, batch_size: int):
    """Summarize oldest messages and prune them."""
    try:
        oldest = await repo.get_oldest_messages(user_id, batch_size)
        if not oldest:
            return

        messages_for_summary = [
            {"role": m.role, "content": m.content}
            for m in oldest
        ]

        persona = PersonaEngine(config)
        summary_text, _ = await persona.summarize_conversation(messages_for_summary)

        first_id = oldest[0].message_id
        last_id = oldest[-1].message_id
        await repo.add_summary(user_id, summary_text, f"{first_id}-{last_id}")

        message_ids = [m.message_id for m in oldest]
        await repo.delete_messages(message_ids)

        logger.info(f"Summarized {len(oldest)} messages for user {user_id}")
    except Exception as e:
        logger.error(f"Summarization failed for user {user_id}: {e}")
