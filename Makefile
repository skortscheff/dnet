COMPOSE_BASE := -f compose.yaml
COMPOSE_DEV  := $(COMPOSE_BASE) -f compose.dev.yaml
COMPOSE_PROD := $(COMPOSE_BASE) -f compose.prod.yaml

.PHONY: up down build logs ps shell-api shell-worker migrate init-dev

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
