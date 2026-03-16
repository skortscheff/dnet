FROM python:3.12-slim

# Install CA certificates so containers can make HTTPS connections to external services
RUN apt-get update -qq && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/app app/
COPY worker/main.py main.py

CMD ["celery", "-A", "main.celery_app", "worker", "--loglevel=info"]
