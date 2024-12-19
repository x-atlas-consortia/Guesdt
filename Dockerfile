# parent image: nginx web server
FROM nginx:1.27.3-alpine
# custom nginx configuration
COPY conf/nginx.conf /etc/nginx/nginx.conf
# guesdt static content
COPY static/*.html /usr/share/nginx/html/
COPY static/*.pdf /usr/share/nginx/html/