#!/usr/bin/env bash

function load_update_script() {
    script="$(cat ./deploy-update-remote.sh)";
    script="${script/__DEPLOYMENT_BRANCH__/$(git branch --show-current)}"
    echo "$script";
}

export $(cat .env | xargs) && \
echo $CR_PASSWORD | docker login ghcr.io -u $CR_USERNAME --password-stdin && \
docker compose -f ./docker-compose-build.yaml build && \
docker compose -f ./docker-compose-build.yaml push && \
./connect.sh "$(load_update_script)"
