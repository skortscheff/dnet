FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/app app/
COPY worker/main.py main.py

CMD ["celery", "-A", "main.celery_app", "worker", "--loglevel=info"]
