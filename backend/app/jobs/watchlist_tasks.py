"""Celery tasks for watchlist monitoring and snapshotting."""
from __future__ import annotations

import asyncio
import hashlib
import json
import logging
from datetime import datetime, timezone

import httpx
from celery import shared_task
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

logger = logging.getLogger(__name__)


def _get_session() -> async_sessionmaker[AsyncSession]:
    engine = create_async_engine(settings.database_url, echo=False)
    return async_sessionmaker(engine, expire_on_commit=False)


async def _perform_lookup(input_val: str, input_type: str) -> dict:
    """Call our own search API to get fresh results for a watchlist item."""
    async with httpx.AsyncClient(base_url="http://api:8000", timeout=30) as client:
        resp = await client.post("/api/v1/search", json={"q": input_val})
        resp.raise_for_status()
        return resp.json()


async def _fire_webhook(url: str, payload: dict) -> None:
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            await client.post(url, json=payload)
        except Exception as exc:
            logger.warning("Webhook delivery failed to %s: %s", url, exc)


async def _run_check(watchlist_id: str) -> None:
    from app.alerts.models import Alert
    from app.snapshots.models import Snapshot
    from app.watchlists.models import Watchlist

    session_factory = _get_session()
    async with session_factory() as db:
        # Fetch watchlist
        result = await db.execute(select(Watchlist).where(Watchlist.id == watchlist_id))
        wl = result.scalar_one_or_none()
        if not wl:
            return

        # Run lookup
        try:
            data = await _perform_lookup(wl.input, wl.input_type)
        except Exception as exc:
            logger.error("Lookup failed for watchlist %s: %s", watchlist_id, exc)
            return

        # Compute hash of new result to detect changes
        new_hash = hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()

        # Compare with last snapshot
        last_snap = await db.execute(
            select(Snapshot)
            .where(Snapshot.watchlist_id == watchlist_id)
            .order_by(Snapshot.taken_at.desc())
            .limit(1)
        )
        prev = last_snap.scalar_one_or_none()
        changed = True
        if prev:
            prev_hash = hashlib.sha256(
                json.dumps(prev.result_data, sort_keys=True).encode()
            ).hexdigest()
            changed = prev_hash != new_hash

        # Save snapshot
        snap = Snapshot(watchlist_id=wl.id, result_data=data)
        db.add(snap)

        # Update last_checked_at
        await db.execute(
            update(Watchlist)
            .where(Watchlist.id == wl.id)
            .values(last_checked_at=datetime.now(timezone.utc))
        )
        await db.commit()

        # Fire alerts if result changed
        if changed:
            alerts_q = await db.execute(
                select(Alert).where(
                    Alert.watchlist_id == wl.id,
                    Alert.is_active == True,  # noqa: E712
                )
            )
            for alert in alerts_q.scalars().all():
                payload = {
                    "watchlist_id": str(wl.id),
                    "label": wl.label,
                    "input": wl.input,
                    "input_type": wl.input_type,
                    "snapshot_id": str(snap.id),
                    "changed": True,
                }
                await _fire_webhook(alert.channel_url, payload)
                alert.last_triggered_at = datetime.now(timezone.utc)
            await db.commit()


@shared_task(name="app.jobs.run_watchlist_check", bind=True, max_retries=2)
def run_watchlist_check(self, watchlist_id: str) -> None:
    """Take a fresh snapshot of one watchlist item and fire alerts on change."""
    try:
        asyncio.run(_run_check(watchlist_id))
    except Exception as exc:
        logger.error("Watchlist check failed: %s", exc)
        raise self.retry(exc=exc, countdown=60)


async def _dispatch_due() -> None:
    from app.watchlists.models import Watchlist
    from sqlalchemy import func, or_

    session_factory = _get_session()
    async with session_factory() as db:
        now = datetime.now(timezone.utc)
        result = await db.execute(
            select(Watchlist).where(
                or_(
                    Watchlist.last_checked_at == None,  # noqa: E711
                    func.extract(
                        "epoch",
                        now - Watchlist.last_checked_at,
                    )
                    >= Watchlist.check_interval_minutes * 60,
                )
            )
        )
        due = result.scalars().all()
        for wl in due:
            run_watchlist_check.delay(str(wl.id))
        logger.info("Dispatched %d watchlist checks", len(due))


@shared_task(name="app.jobs.check_due_watchlists")
def check_due_watchlists() -> None:
    """Periodic task: find watchlists due for a check and dispatch them."""
    asyncio.run(_dispatch_due())
