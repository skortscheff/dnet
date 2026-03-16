FROM python:3.12-slim

# Install corporate CA chain so containers can reach external HTTPS services
COPY backend/ds-ca-chain.crt /usr/local/share/ca-certificates/ds-ca-chain.crt
RUN apt-get update -qq && apt-get install -y --no-install-recommends ca-certificates \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/app app/

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
