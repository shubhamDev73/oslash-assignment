kubectl apply -f config.yml
kubectl apply -f postgres.yml
kubectl apply -f redis.yml

docker build . -t oslash/server
kubectl apply -f oslash.yml
