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
