kubectl apply -f config.yml
kubectl apply -f postgres.yml

docker build . -t oslash/server
kubectl apply -f oslash.yml
