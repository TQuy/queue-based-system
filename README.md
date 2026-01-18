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