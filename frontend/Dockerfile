FROM nginx:alpine

# Copy nginx config from the frontend build context
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy frontend assets from the frontend build context
COPY index.html /usr/share/nginx/html/index.html
COPY src /usr/share/nginx/html/src
COPY public /usr/share/nginx/html/public

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
