# Makefile: Preferred way to manage docker commands
# Use 'make up', 'make stop', 'make build'

# Ensures that 'up', 'stop', etc. are treated as task names, not file names
.PHONY: up stop down build logs

# Spina up the containers in detached mode
up:
	@echo "Starting Docker Compose services in the background..."
	docker compose -f "../docker-compose.dev.yml" up -d

# Stops the running services
stop:
	@echo "Stopping Docker Compose services..."
	docker compose -f "../docker-compose.dev.yml" stop

# Stops and removes containers, networks, and volumes
down:
	@echo "Stopping and removing all Docker Compose services and data..."
	docker compose -f "../docker-compose.dev.yml" down

# Forces a rebuild of the services
build:
	@echo "Building (or rebuilding) services..."
	docker compose -f "../docker-compose.dev.yml" build

# Shows the logs from the services
logs:
	@echo "Tailing service logs (press Ctrl+C to stop)..."
	docker compose -f "../docker-compose.dev.yml" logs -f

# A command to list all available tasks
help:
	@echo "Available 'make' commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-10s\033[0m %s\n", $$1, $$2}'
