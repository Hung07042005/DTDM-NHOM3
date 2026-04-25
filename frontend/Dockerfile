FROM nginx:alpine

# Copy nginx config from the frontend directory
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy frontend assets from the frontend directory
COPY frontend/index.html /usr/share/nginx/html/index.html
COPY frontend/src /usr/share/nginx/html/src
COPY frontend/public /usr/share/nginx/html/public

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
