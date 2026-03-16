COMPOSE_BASE := -f compose.yaml
COMPOSE_DEV  := $(COMPOSE_BASE) -f compose.dev.yaml
COMPOSE_PROD := $(COMPOSE_BASE) -f compose.prod.yaml

.PHONY: up down build logs ps shell-api shell-worker migrate init-dev \
        prod-up prod-down prod-logs prod-ps prod-build prod-migrate deploy

# ---------------------------------------------------------------------------
# Development
# ---------------------------------------------------------------------------

up:
	docker compose $(COMPOSE_DEV) up

down:
	docker compose $(COMPOSE_DEV) down

build:
	docker compose $(COMPOSE_DEV) build

logs:
	docker compose $(COMPOSE_DEV) logs -f

ps:
	docker compose $(COMPOSE_DEV) ps

shell-api:
	docker compose $(COMPOSE_DEV) exec api bash

shell-worker:
	docker compose $(COMPOSE_DEV) exec worker bash

migrate:
	docker compose $(COMPOSE_DEV) exec api alembic upgrade head

init-dev:
	bash scripts/init-dev.sh

# ---------------------------------------------------------------------------
# Production
# ---------------------------------------------------------------------------

prod-up:
	docker compose $(COMPOSE_PROD) up -d

prod-down:
	docker compose $(COMPOSE_PROD) down

prod-build:
	docker compose $(COMPOSE_PROD) build

prod-logs:
	docker compose $(COMPOSE_PROD) logs -f

prod-ps:
	docker compose $(COMPOSE_PROD) ps

prod-migrate:
	docker compose $(COMPOSE_PROD) run --rm api alembic upgrade head

# Full first-time production deploy (builds, migrates, starts)
deploy:
	bash scripts/deploy.sh
