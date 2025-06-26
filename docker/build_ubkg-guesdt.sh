#!/bin/bash
# -------------------------
# Unified Biomedical Knowledge Graph (UBKG)
# Builds and pushes the ubkg-guesdt component of a UBKGBox multi-container application

if [ "$1" = "build" ]; then
  docker compose -f development-docker-compose.yml -f docker-compose.yml -p ubkg-guesdt build
elif [ "$1" = "push" ]; then
  # buildx uses docker-compose.yml to publish in multiple architectures
  # NOTE:
  # The "--allow=fs.read=.." stops warnings related to the build context.
  # This is temporary. The actual solution is to move the "docs" folder under the docker folder,
  # after verifying that the GitHub pages implementation is not affected.
  docker buildx bake --allow=fs.read=.. -f development-docker-compose.yml -f docker-compose.yml  --push
fi