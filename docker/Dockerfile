# parent image: nginx web server
FROM nginx:1.27.3-alpine
# custom nginx configuration
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
# guesdt static content
COPY docs/*.* /usr/share/nginx/html/guesdt/

EXPOSE 7300 8080
