"""Geocoding — city name to lat/lng via Nominatim + timezone detection."""

import asyncio
import logging
from typing import Optional
from dataclasses import dataclass

from geopy.adapters import AioHTTPAdapter
from geopy.geocoders import Nominatim
from timezonefinder import TimezoneFinder

from src.db.repository import Repository

logger = logging.getLogger(__name__)

_tf = TimezoneFinder()


@dataclass
class GeoResult:
    lat: float
    lng: float
    display_name: str
    timezone: str
    ambiguous: bool = False
    alternatives: list[str] = None

    def __post_init__(self):
        if self.alternatives is None:
            self.alternatives = []


async def geocode_location(
    query: str,
    repo: Repository,
) -> Optional[GeoResult]:
    """Geocode a location string to lat/lng with caching."""

    # Check cache first
    cached = await repo.get_cached_geocode(query)
    if cached:
        return GeoResult(
            lat=cached.lat,
            lng=cached.lng,
            display_name=cached.display_name,
            timezone=cached.timezone or _get_timezone(cached.lat, cached.lng),
        )

    # Query Nominatim
    try:
        async with Nominatim(
            user_agent="olivia-arcana-bot",
            adapter_factory=AioHTTPAdapter,
        ) as geolocator:
            results = await geolocator.geocode(
                query,
                exactly_one=False,
                limit=5,
                language="en",
            )

        if not results:
            return None

        if len(results) > 1:
            # Check if results are from very different locations
            first = results[0]
            alternatives = [r.address for r in results[1:4]]
            lat, lng = first.latitude, first.longitude
            tz = _get_timezone(lat, lng)

            # Cache the first result
            await repo.cache_geocode(query, lat, lng, first.address, tz)

            return GeoResult(
                lat=lat, lng=lng,
                display_name=first.address,
                timezone=tz,
                ambiguous=len(set(r.address.split(",")[-1].strip() for r in results[:3])) > 1,
                alternatives=alternatives,
            )

        location = results[0]
        lat, lng = location.latitude, location.longitude
        tz = _get_timezone(lat, lng)

        await repo.cache_geocode(query, lat, lng, location.address, tz)

        return GeoResult(
            lat=lat, lng=lng,
            display_name=location.address,
            timezone=tz,
        )

    except Exception as e:
        logger.error(f"Geocoding failed for '{query}': {e}")
        return None


def _get_timezone(lat: float, lng: float) -> str:
    """Get IANA timezone from coordinates."""
    tz = _tf.timezone_at(lat=lat, lng=lng)
    return tz or "UTC"
