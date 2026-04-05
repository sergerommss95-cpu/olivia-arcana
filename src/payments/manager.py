"""Unified payment manager — abstracts Stars and CryptoBot behind one interface."""

import logging
from typing import Optional

from aiogram import Bot
from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton

from src.config import BotConfig
from src.db.repository import Repository
from src.payments.stars import send_reading_invoice, send_subscription_invoice
from src.payments.cryptobot import CryptoBotClient, create_reading_invoice, create_subscription_invoice

logger = logging.getLogger(__name__)


class PaymentManager:
    def __init__(self, config: BotConfig, repo: Repository, bot: Bot):
        self.config = config
        self.repo = repo
        self.bot = bot
        self.cryptobot = CryptoBotClient(config.cryptobot_token) if config.cryptobot_token else None

    def get_payment_keyboard(
        self,
        product: str,
        reading_id: Optional[int] = None,
        period: Optional[str] = None,
    ) -> InlineKeyboardMarkup:
        """Generate inline keyboard with payment options."""
        stars_price = self.config.get_price_stars(product)
        usd_price = self.config.get_price_usd(product)

        buttons = []

        # Stars button
        if reading_id:
            callback = f"pay_stars:reading:{reading_id}"
        elif period:
            callback = f"pay_stars:sub:{period}"
        else:
            callback = f"pay_stars:{product}"

        buttons.append(
            InlineKeyboardButton(
                text=f"⭐ Pay with Stars — {stars_price} Stars",
                callback_data=callback,
            )
        )

        # Crypto button (if available)
        if self.cryptobot and usd_price > 0:
            if reading_id:
                crypto_callback = f"pay_crypto:reading:{reading_id}"
            elif period:
                crypto_callback = f"pay_crypto:sub:{period}"
            else:
                crypto_callback = f"pay_crypto:{product}"

            buttons.append(
                InlineKeyboardButton(
                    text=f"💎 Pay with Crypto — ${usd_price:.2f}",
                    callback_data=crypto_callback,
                )
            )

        return InlineKeyboardMarkup(inline_keyboard=[[b] for b in buttons])

    async def process_stars_reading_payment(
        self,
        chat_id: int,
        reading_id: int,
        reading_type: str,
    ) -> None:
        """Send a Stars invoice for a reading."""
        amount = self.config.get_price_stars(reading_type)
        await send_reading_invoice(
            bot=self.bot,
            chat_id=chat_id,
            reading_id=reading_id,
            reading_type=reading_type,
            amount_stars=amount,
        )

    async def process_stars_subscription(
        self,
        chat_id: int,
        period: str,
    ) -> None:
        """Send a Stars invoice for a subscription."""
        product_key = f"vip_{period}"
        amount = self.config.get_price_stars(product_key)
        await send_subscription_invoice(
            bot=self.bot,
            chat_id=chat_id,
            period=period,
            amount_stars=amount,
        )

    async def process_crypto_reading_payment(
        self,
        chat_id: int,
        user_id: int,
        reading_id: int,
        reading_type: str,
    ) -> Optional[str]:
        """Create a CryptoBot invoice for a reading. Returns pay URL."""
        if not self.cryptobot:
            logger.warning("CryptoBot not configured")
            return None

        amount = self.config.get_price_usd(reading_type)
        try:
            invoice = await create_reading_invoice(
                client=self.cryptobot,
                reading_id=reading_id,
                reading_type=reading_type,
                amount_usd=amount,
            )
            pay_url = invoice.get("pay_url", invoice.get("bot_invoice_url", ""))

            # Store the invoice ID for later verification
            await self.repo.create_payment(
                user_id=user_id,
                payment_type="one_time",
                method="cryptobot",
                amount_crypto=amount,
                crypto_currency="USDT",
                reading_id=reading_id,
            )

            return pay_url
        except Exception as e:
            logger.error(f"CryptoBot invoice creation failed: {e}")
            return None

    async def handle_successful_reading_payment(
        self,
        user_id: int,
        reading_id: int,
        method: str,
        charge_id: Optional[str] = None,
    ) -> Optional[str]:
        """Process a successful reading payment. Returns the full reading content."""
        # Unlock the reading
        reading = await self.repo.unlock_reading(reading_id)
        if not reading:
            return None

        # Record the payment
        await self.repo.create_payment(
            user_id=user_id,
            payment_type="one_time",
            method=method,
            amount_stars=reading.price_stars if method == "stars" else None,
            amount_crypto=reading.price_crypto_usd if method == "cryptobot" else None,
            reading_id=reading_id,
        )

        # Log analytics
        await self.repo.log_event(user_id, "reading_unlocked", {
            "reading_id": reading_id,
            "type": reading.type,
            "method": method,
        })

        return reading.content

    async def handle_successful_subscription(
        self,
        user_id: int,
        period: str,
        method: str,
    ) -> None:
        """Process a successful subscription payment."""
        product_key = f"vip_{period}"
        stars = self.config.get_price_stars(product_key) if method == "stars" else None
        crypto = self.config.get_price_usd(product_key) if method == "cryptobot" else None

        await self.repo.create_subscription(
            user_id=user_id,
            method=method,
            period=period,
            amount_stars=stars,
            amount_crypto=crypto,
        )

        await self.repo.log_event(user_id, "subscription_started", {
            "period": period,
            "method": method,
        })
