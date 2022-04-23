project_repository='git@github.com:TArch64/delivery-help.git';
project_branch='deployment';
project_dir="$HOME/projects/delivery-help";
docker_compose_file="$project_dir/deployment/production/docker-compose-up.yaml";

function exec_docker() {
    docker compose --file "$docker_compose_file"  --project-directory "$project_dir" $1
}

rm -rf "$project_dir" && \
git clone --branch "$project_branch" "$project_repository" "$project_dir" && \
export $(cat "$HOME/projects/.env" | xargs) && \
echo "$CR_PASSWORD" | docker login ghcr.io -u "$CR_USERNAME" --password-stdin && \
exec_docker "pull" && \
exec_docker "down" && \
exec_docker "up --detach"
