# Media Prototype 2

A scalable TypeScript Express.js server prototype demonstrating decoupled worker architecture with message queuing, caching, and Kubernetes deployment. This project computes Fibonacci numbers asynchronously using RabbitMQ for messaging and Redis for caching, with support for both local development and containerized production environments.

## Features

- **Asynchronous Computation**: Compute Fibonacci numbers using decoupled workers via RabbitMQ.
- **Caching**: Redis-based caching for computed results.
- **Real-time Updates**: Socket.IO integration for live progress updates.
- **Decoupled Workers**: Run workers separately for scalability.
- **Containerization**: Docker support for workers and main server.
- **Kubernetes Deployment**: Full K8s manifests for production scaling with HPA.
- **API Documentation**: Swagger UI for endpoint exploration.
- **Testing**: Jest-based unit and integration tests.

## Tech Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Messaging**: RabbitMQ (AMQP)
- **Caching**: Redis
- **Real-time**: Socket.IO
- **Containerization**: Docker
- **Orchestration**: Kubernetes (Minikube for local)
- **Testing**: Jest
- **Linting**: ESLint
- **Build**: TypeScript Compiler

## Prerequisites

- Node.js (v18+)
- Docker and Docker Compose
- kubectl and Minikube (for K8s)
- Make (for scripts)

## Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd media-prototype-2
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `config/.env` (copy from example if available).

## Usage

### Local Development

1. Start services with Docker Compose:
   ```bash
   make -C scripts up
   ```
2. Build the code for workers
    ```bash
    npm run build
    ```
3. Run the server in development mode:
   ```bash
   npm run dev
   ```

4. Access the app at `http://localhost:3000`.

5. API docs at `http://localhost:3000/api-docs`.

### Decoupled Workers

1. Set `DECOUPLED_WORKERS=1` in `config/.env`.
2. In `./workers`, build the project: `npm run build`.
3. In `./workers`, run: `npm run dev`.

### Running Media Server on container
1. Build the image
```
docker build -t media-server .
```
2. Run the Media Server on a container
```
docker run -d   --name media-server   -p PORT:PORT   --add-host=host.docker.internal:host-gateway   --env-file ./config/.env   -e REDIS_HOST="host.docker.internal"   -e RABBITMQ_HOST="host.docker.internal"   media-server:latest
```

### Testing

Run tests:
```bash
npm test
```

Run with coverage:
```bash
npm run test:coverage
```

## Deployment

### Kubernetes

For a hybrid setup (server on host/container, services in K8s):  
**Note:** Only need to run the first step for the subsequent runs

1. Start Minikube:
   ```bash
   minikube start
   ```

2. Enable metrics-server for worker auto scaling
   ```bash
   minikube addons enable metrics-server
   ```

3. Apply manifests:
   ```bash
   kubectl apply -f k8s/secret.yaml
   kubectl apply -f k8s/configmap.yaml
   kubectl apply -f k8s/rabbitmq.yaml
   kubectl apply -f k8s/redis.yaml
   kubectl apply -f k8s/deployment.yaml
   kubectl apply -f k8s/hpa.yaml
   ```

4. Port-forward services:
   ```bash
   kubectl port-forward svc/rabbitmq-service 5672:5672 15672:15672

   kubectl port-forward svc/redis-service 6379:6379
   ```
If the media server runs inside a container, then you need to add the flag `--address 0.0.0.0` for each command above
## API Endpoints

- `GET /api/fibonacci/:n` - Compute Fibonacci number.
- `GET /api/health` - Health check.
- Full docs at `/api-docs`.

## Project Structure

```
src/
├── app.ts                 # Main app setup
├── index.ts               # Entry point
├── routes/                # API routes
├── services/              # Business logic
├── controllers/           # Route handlers
├── utils/                 # Utilities
├── workers/               # Worker processes
└── config/                # Configuration
k8s/                       # Kubernetes manifests
workers/                   # Worker-specific code
```

## Contributing

1. Fork the repo.
2. Create a feature branch.
3. Make changes, add tests.
4. Run tests and linting.
5. Submit a PR.

## License

MIT License - see LICENSE file.