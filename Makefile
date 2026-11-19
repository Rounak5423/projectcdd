# ==============================================================================
# GENESIS Civilisation Engine — Operations & Container Control Makefile
# Provides standardized commands for local development, production, tests & backups
# ==============================================================================

.PHONY: help up down dev logs test shell-backend backup-db restore-db train clean reset-db build status

SHELL := /bin/bash
COMPOSE_FILE := docker-compose.yml
DEV_COMPOSE_FILE := docker-compose.dev.yml
BACKUP_DIR := backups

help: ## Display available targets and descriptions
	@echo "========================================================================"
	@echo "               GENESIS ENGINE OPERATIONS CONTROL MENU                   "
	@echo "========================================================================"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-18s\033[0m %s\n", $$1, $$2}'

build: ## Build all production Docker container images without cache
	@echo "--> Building production container images..."
	docker compose build --no-cache

up: ## Start production stack in detached background mode (frontend:3000, backend:internal)
	@echo "--> Starting GENESIS production stack..."
	@if [ ! -f .env ]; then \
		echo "Warning: .env not found. Copying .env.example with secure dev values..."; \
		cp .env.example .env; \
		sed -i.bak 's/ENVIRONMENT=production/ENVIRONMENT=development/g' .env 2>/dev/null || true; \
		rm -f .env.bak 2>/dev/null || true; \
	fi
	docker compose up -d
	@echo "--> Production stack running! Open http://localhost:3000"

down: ## Stop all active GENESIS containers
	@echo "--> Stopping GENESIS containers..."
	docker compose down

dev: ## Start development stack with live hot-reloading (frontend:5173, backend:8000)
	@echo "--> Launching GENESIS in development mode with live hot-reloading..."
	@if [ ! -f .env ]; then \
		echo "Creating .env from .env.example with development environment..."; \
		cp .env.example .env; \
		sed -i.bak 's/ENVIRONMENT=production/ENVIRONMENT=development/g' .env 2>/dev/null || true; \
		rm -f .env.bak 2>/dev/null || true; \
	fi
	docker compose -f $(COMPOSE_FILE) -f $(DEV_COMPOSE_FILE) up

logs: ## Follow live logs across all containers
	docker compose logs -f

status: ## Inspect container status and health probes
	docker compose ps

test: ## Execute complete containerized verification suite (pytest + 365-tick + Playwright)
	@echo "--> Running containerized test suite..."
	docker compose --profile tests run --rm tests

shell-backend: ## Open an interactive bash shell inside the backend container
	docker compose exec backend bash

backup-db: ## Perform an atomic, consistent hot-backup of the SQLite WAL database
	@mkdir -p $(BACKUP_DIR)
	@TIMESTAMP=$$(date +%Y%m%d_%H%M%S); \
	BACKUP_NAME="$(BACKUP_DIR)/genesis_backup_$${TIMESTAMP}.db"; \
	echo "--> Creating consistent SQLite WAL backup to $${BACKUP_NAME}..."; \
	docker compose exec -T backend python -c " \
import sqlite3; \
src = sqlite3.connect('/app/db/genesis.db'); \
dst = sqlite3.connect('/tmp/backup.db'); \
src.backup(dst); \
dst.close(); \
src.close(); \
print('Hot backup created in container.') \
	"; \
	docker compose cp backend:/tmp/backup.db "$${BACKUP_NAME}"; \
	docker compose exec -T backend rm -f /tmp/backup.db; \
	echo "--> Backup successfully saved to $${BACKUP_NAME} ($$(ls -lh $${BACKUP_NAME} | awk '{print $$5}'))"

restore-db: ## Restore database from backup file (Usage: make restore-db BACKUP_FILE=backups/genesis_backup_xyz.db)
	@if [ -z "$(BACKUP_FILE)" ]; then \
		echo "Error: BACKUP_FILE is required. Example: make restore-db BACKUP_FILE=backups/genesis_backup_20261115.db"; \
		exit 1; \
	fi
	@if [ ! -f "$(BACKUP_FILE)" ]; then \
		echo "Error: Backup file '$(BACKUP_FILE)' does not exist."; \
		exit 1; \
	fi
	@echo "--> Stopping backend before restoration..."
	docker compose stop backend
	@echo "--> Restoring database from $(BACKUP_FILE)..."
	docker compose run --rm -v $(PWD)/$(BACKUP_FILE):/restore_src.db -v genesis_db_data:/app/db backend python -c " \
import sqlite3, shutil, os; \
shutil.copyfile('/restore_src.db', '/app/db/genesis.db'); \
for ext in ['-wal', '-shm']: \
    if os.path.exists('/app/db/genesis.db' + ext): \
        os.remove('/app/db/genesis.db' + ext); \
print('Database restored successfully from backup.'); \
	"
	@echo "--> Restarting backend..."
	docker compose start backend
	@echo "--> Restoration complete!"

train: ## Launch ML model training & parameter calibration container (profile: ml)
	@echo "--> Launching ML training container..."
	docker compose --profile ml run --rm ml python ml/train_simulation_models.py

reset-db: ## Reset database volume (WARNING: Deletes all simulation worlds and history)
	@echo "--> Resetting database volume..."
	docker compose down -v
	@echo "--> Database volume purged."

clean: ## Remove all stopped containers, test artifacts, and dangling resources
	docker compose down -v --remove-orphans
