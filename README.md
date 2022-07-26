# OSlash assignment submission

## Running

### Locally
1. Requires `postgres` and `redis` installed
2. Create tables from `tables.sql` in postgres
3. `npm install`
4. `npm run dev`

### Kubernetes cluster
1. Requires kubernetes cluster like `minikube`
2. Point shell to minikube's docker-daemon `minikube docker-env`
3. Deploy `./deploy.sh`
4. Create tables from `tables.sql` in postgres
5. Tunnel OSlash service `minikube tunnel`

## Testing
1. `npm test`
2. To generate coverage reports, `npm test -- --coverage`
