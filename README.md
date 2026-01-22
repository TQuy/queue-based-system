# Queue-based System
## Table of Contents
- [Commands](#commands)
- [How to run the repository at local](#how-to-run-the-repository-at-local)

## Commands
To run commands from `./scripts/Makefile` from the root folder, you can run:
```
make -C scripts <command>
```
## How to run the repository at local
To run the repository at local, first you need to start the services run in docker-compose:
```
make -C scripts up
```
then you start the ExpressJS server in development mode with:
```
npm run dev
```
**Note:** 
- If you want to run async process with decoupled workers, you have to to run
`npm run build`
to transpile typescript to javascript before starting the services


### Decouple workers
1. set `DECOUPLED_WORKERS=1` in the `config/.env` file  
2. Navigate in the the folder `./workers`
3. Start the worker process with `npm run dev` (remember to build after updating the worker code)

## Setup with Kubernetes
For local setup, we can have hybrid approach, where the media server is running in the host, while other services such as Datastore, Message Broker are running inside the Kubernetes cluster; Or we can run everything in the Kubernetes cluster.

Bellow is the list of commands we need to run if we use `minikube` for Kubernetes local setup. Note that we only need to run the first command for subsequent runs
1. Start minikube
```
minikube start
```

2. Make sure the `metrics-server` addons is enabled
```
minikube addons list
```
Enable the addons if it's not yet been enabled
```
minikube addons enable metrics-server
```
3. Apply K8s Manifests
```
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/rabbitmq.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/hpa.yaml
```
4. Forward the ports of Redis and RabbitMQ services so that the media server running at the host can communicate with them
```
kubectl port-forward svc/rabbitmq-service 5672:5672 15672:15672  

kubectl port-forward svc/redis-service 6379:6379
```
If the media server is run inside a single container instead of the host, then you need to add the flag `--address 0.0.0.0` for each command above