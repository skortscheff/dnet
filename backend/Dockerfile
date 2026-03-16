FROM python:3.12-slim

# Install standard system CA certificates so containers can reach external HTTPS services.
#
# CORPORATE / ENTERPRISE NOTE:
# If your host sits behind a firewall that performs SSL/TLS inspection (MITM decryption),
# the standard CAs above will not be enough — outbound HTTPS will fail certificate
# verification. In that case you need to trust your organisation's internal CA:
#
#   1. Copy your corporate CA bundle into the repo (do NOT commit it to git):
#        cp /path/to/your-corporate-ca.crt backend/corporate-ca.crt
#
#   2. Uncomment the two lines below and rebuild:
#        COPY backend/corporate-ca.crt /usr/local/share/ca-certificates/corporate-ca.crt
#        (the update-ca-certificates call below will pick it up automatically)
#
# This certificate is private company property. Never commit it to version control.
RUN apt-get update -qq && apt-get install -y --no-install-recommends ca-certificates \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/app app/
COPY backend/migrations migrations/
COPY backend/alembic.ini alembic.ini

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
