"""Paddle webhook HMAC signature verification tests."""

import hashlib
import hmac
import time

import pytest

import services.paddle_service as paddle

SECRET = "test-webhook-secret"


def _sign(payload: bytes, secret: str = SECRET, ts: str | None = None) -> str:
    ts = ts or str(int(time.time()))
    signed = f"{ts}:{payload.decode()}".encode()
    digest = hmac.new(secret.encode(), signed, hashlib.sha256).hexdigest()
    return f"ts={ts};h1={digest}"


@pytest.fixture
def webhook_secret(monkeypatch):
    monkeypatch.setattr(paddle, "PADDLE_WEBHOOK_SECRET", SECRET)


def test_valid_signature_accepted(webhook_secret):
    payload = b'{"event_type":"transaction.completed"}'
    assert paddle.verify_webhook(payload, _sign(payload)) is True


def test_tampered_payload_rejected(webhook_secret):
    payload = b'{"event_type":"transaction.completed"}'
    sig = _sign(payload)
    assert paddle.verify_webhook(b'{"event_type":"subscription.canceled"}', sig) is False


def test_wrong_secret_rejected(webhook_secret):
    payload = b'{"a":1}'
    assert paddle.verify_webhook(payload, _sign(payload, secret="other-secret")) is False


def test_missing_secret_rejected(monkeypatch):
    monkeypatch.setattr(paddle, "PADDLE_WEBHOOK_SECRET", "")
    payload = b'{"a":1}'
    assert paddle.verify_webhook(payload, _sign(payload)) is False


def test_missing_or_partial_header_rejected(webhook_secret):
    assert paddle.verify_webhook(b"{}", "") is False
    assert paddle.verify_webhook(b"{}", "ts=123") is False
