import os

from celery import Celery
from celery.schedules import crontab

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

celery_app = Celery(
    "toolkit_worker",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["app.jobs"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_soft_time_limit=60,
    task_time_limit=120,
    beat_schedule={
        "check-due-watchlists": {
            "task": "app.jobs.check_due_watchlists",
            "schedule": crontab(minute="*/5"),  # every 5 minutes
        },
    },
)

if __name__ == "__main__":
    celery_app.start()
