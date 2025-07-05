# parent image: nginx web server
FROM nginx:1.27.3-alpine
# custom nginx configuration
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
# Guesdt static content.
COPY ubkgbox/*.* /usr/share/nginx/html/
COPY ubkgbox/static/*.* /usr/share/nginx/html/static/

EXPOSE 7300 8080
