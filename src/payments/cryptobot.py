"""CryptoBot (@CryptoBot) payment integration for TON/USDT/BTC."""

import logging
from typing import Optional

import aiohttp

logger = logging.getLogger(__name__)

CRYPTOBOT_API_URL = "https://pay.crypt.bot/api"


class CryptoBotClient:
    def __init__(self, api_token: str):
        self.api_token = api_token
        self.headers = {"Crypto-Pay-API-Token": api_token}

    async def _request(self, method: str, params: Optional[dict] = None) -> dict:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{CRYPTOBOT_API_URL}/{method}",
                headers=self.headers,
                params=params or {},
            ) as resp:
                data = await resp.json()
                if not data.get("ok"):
                    logger.error(f"CryptoBot API error: {data}")
                    raise Exception(f"CryptoBot API error: {data.get('error', 'Unknown')}")
                return data.get("result", {})

    async def create_invoice(
        self,
        amount: float,
        currency: str = "USDT",
        description: str = "",
        payload: str = "",
        paid_btn_name: str = "callback",
        paid_btn_url: str = "",
    ) -> dict:
        """Create a payment invoice.

        Returns dict with invoice_id, pay_url, etc.
        """
        params = {
            "asset": currency,
            "amount": str(amount),
            "description": description[:1024],
            "payload": payload,
            "paid_btn_name": paid_btn_name,
        }
        if paid_btn_url:
            params["paid_btn_url"] = paid_btn_url

        return await self._request("createInvoice", params)

    async def get_invoices(
        self,
        invoice_ids: Optional[list[int]] = None,
        status: Optional[str] = None,
    ) -> list[dict]:
        """Get invoices, optionally filtered."""
        params = {}
        if invoice_ids:
            params["invoice_ids"] = ",".join(str(i) for i in invoice_ids)
        if status:
            params["status"] = status
        result = await self._request("getInvoices", params)
        return result.get("items", [])

    async def check_invoice_paid(self, invoice_id: int) -> bool:
        """Check if a specific invoice has been paid."""
        invoices = await self.get_invoices(invoice_ids=[invoice_id])
        if invoices:
            return invoices[0].get("status") == "paid"
        return False


async def create_reading_invoice(
    client: CryptoBotClient,
    reading_id: int,
    reading_type: str,
    amount_usd: float,
    currency: str = "USDT",
) -> dict:
    """Create a CryptoBot invoice for a reading."""
    return await client.create_invoice(
        amount=amount_usd,
        currency=currency,
        description=f"Olivia Arcana — {reading_type.replace('_', ' ').title()} Reading",
        payload=f"reading:{reading_id}",
    )


async def create_subscription_invoice(
    client: CryptoBotClient,
    user_id: int,
    period: str,
    amount_usd: float,
    currency: str = "USDT",
) -> dict:
    """Create a CryptoBot invoice for a VIP subscription."""
    return await client.create_invoice(
        amount=amount_usd,
        currency=currency,
        description=f"Olivia Arcana VIP — {period.title()} Subscription",
        payload=f"subscription:{user_id}:{period}",
    )
