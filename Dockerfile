# parent image: nginx web server
FROM nginx:1.27.3-alpine
# custom nginx configuration
COPY conf/nginx.conf /etc/nginx/nginx.conf
# guesdt static content
COPY docs/*.html /usr/share/nginx/html/
COPY docs/*.pdf /usr/share/nginx/html/