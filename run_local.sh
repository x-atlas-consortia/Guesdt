#!/bin/bash
# Build a local container of the guesdt web application.
docker run --name guesdt -d -p 8080:80 guesdt-nginx